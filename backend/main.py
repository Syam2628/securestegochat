import hashlib
import os
import secrets
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import get_conn, init_db
from models import LoginRequest, RegisterRequest, TextMessageRequest
from steganography import classify_extracted_text, detect_lsb_steganography, extract_lsb_data, log_detection_event
from websocket_manager import WebSocketManager

app = FastAPI(title="Secure Stego Chat")
manager = WebSocketManager()

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "https://securestegochat.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def password_hash(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def create_user_token(user_id: int) -> str:
    token = secrets.token_hex(24)
    with get_conn() as conn:
        conn.execute("INSERT INTO sessions(token, user_id) VALUES(?, ?)", (token, user_id))
        conn.commit()
    return token


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT u.id, u.username
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": row["id"], "username": row["username"], "token": token}


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/")
def root_page():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/chat")
def chat_page():
    return FileResponse(FRONTEND_DIR / "chat.html")


@app.get("/style.css")
def style_asset():
    return FileResponse(FRONTEND_DIR / "style.css")


@app.get("/script.js")
def script_asset():
    return FileResponse(FRONTEND_DIR / "script.js")


@app.post("/api/register")
def register(payload: RegisterRequest) -> dict:
    salt = secrets.token_hex(8)
    hashed = f"{salt}${password_hash(payload.password, salt)}"

    with get_conn() as conn:
        existing = conn.execute("SELECT id FROM users WHERE username = ?", (payload.username,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")

        cur = conn.execute(
            "INSERT INTO users(username, password_hash) VALUES(?, ?)",
            (payload.username, hashed),
        )
        conn.commit()
        user_id = cur.lastrowid

    token = create_user_token(user_id)
    return {"token": token, "user": {"id": user_id, "username": payload.username}}


@app.post("/api/login")
def login(payload: LoginRequest) -> dict:
    with get_conn() as conn:
        user = conn.execute(
            "SELECT id, username, password_hash FROM users WHERE username = ?",
            (payload.username,),
        ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    try:
        salt, stored_hash = user["password_hash"].split("$", 1)
    except ValueError:
        raise HTTPException(status_code=500, detail="Stored password format invalid")

    if password_hash(payload.password, salt) != stored_hash:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_user_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "username": user["username"]}}


@app.get("/api/users")
def list_users(current_user: dict = Depends(get_current_user)) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username FROM users WHERE id != ? ORDER BY username ASC",
            (current_user["id"],),
        ).fetchall()
    return [{"id": r["id"], "username": r["username"]} for r in rows]


@app.get("/api/messages/{peer_id}")
def get_messages(peer_id: int, current_user: dict = Depends(get_current_user)) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT m.id, m.sender_id, m.receiver_id, m.message_type, m.content,
                   m.is_suspicious, m.warning, m.created_at, u.username AS sender_username
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.id ASC
            """,
            (current_user["id"], peer_id, peer_id, current_user["id"]),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "sender_id": row["sender_id"],
            "receiver_id": row["receiver_id"],
            "sender_username": row["sender_username"],
            "message_type": row["message_type"],
            "content": row["content"],
            "is_suspicious": bool(row["is_suspicious"]),
            "warning": row["warning"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


async def publish_message(message: dict) -> None:
    await manager.send_to_many([message["sender_id"], message["receiver_id"]], {"type": "message.created", "message": message})


@app.post("/api/messages/text")
async def send_text(payload: TextMessageRequest, current_user: dict = Depends(get_current_user)) -> dict:
    with get_conn() as conn:
        receiver = conn.execute("SELECT id FROM users WHERE id = ?", (payload.receiver_id,)).fetchone()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur = conn.execute(
            """
            INSERT INTO messages(sender_id, receiver_id, message_type, content, created_at)
            VALUES(?, ?, 'text', ?, ?)
            """,
            (current_user["id"], payload.receiver_id, payload.content.strip(), now),
        )
        conn.commit()
        msg_id = cur.lastrowid

        row = conn.execute(
            """
            SELECT id, sender_id, receiver_id, message_type, content,
                   is_suspicious, warning, created_at
            FROM messages
            WHERE id = ?
            """,
            (msg_id,),
        ).fetchone()

    message = {
        "id": row["id"],
        "sender_id": row["sender_id"],
        "receiver_id": row["receiver_id"],
        "sender_username": current_user["username"],
        "message_type": row["message_type"],
        "content": row["content"],
        "is_suspicious": bool(row["is_suspicious"]),
        "warning": row["warning"],
        "created_at": row["created_at"],
    }
    await publish_message(message)
    return message


@app.post("/api/messages/image")
async def send_image(
    receiver_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = os.path.splitext(file.filename or "")[1] or ".png"
    saved_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = UPLOAD_DIR / saved_name

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    with saved_path.open("wb") as f:
        f.write(data)

    # Always attempt extraction — don't gate on detector heuristic
    extracted_text = extract_lsb_data(str(saved_path))
    is_code, language, code_confidence, patterns = classify_extracted_text(extracted_text)
    suspicious, detector_confidence = detect_lsb_steganography(str(saved_path))

    # Mark suspicious if either classifier found code OR detector flagged it
    marked_suspicious = bool(is_code) or suspicious
    warning = None
    if is_code:
        warning = (
            f"Hidden code detected "
            f"({language}, confidence={code_confidence}%, detector={detector_confidence}%)."
        )
    elif suspicious:
        warning = (
            f"Potential hidden data detected (detector confidence={detector_confidence}%)."
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO messages(sender_id, receiver_id, message_type, content, is_suspicious, warning, created_at)
            VALUES(?, ?, 'image', ?, ?, ?, ?)
            """,
            (
                current_user["id"],
                receiver_id,
                f"/uploads/{saved_name}",
                1 if marked_suspicious else 0,
                warning,
                now,
            ),
        )
        conn.commit()
        msg_id = cur.lastrowid

        if marked_suspicious:
            reason = f"patterns={patterns}; detector_confidence={detector_confidence}%"
            conn.execute(
                """
                INSERT INTO detection_logs(message_id, image_name, extracted_text, detected_language, reason)
                VALUES(?, ?, ?, ?, ?)
                """,
                (msg_id, saved_name, extracted_text[:2000], language, reason),
            )
            conn.commit()
            log_detection_event(msg_id, saved_name, language, reason)

        row = conn.execute(
            """
            SELECT id, sender_id, receiver_id, message_type, content,
                   is_suspicious, warning, created_at
            FROM messages
            WHERE id = ?
            """,
            (msg_id,),
        ).fetchone()

    message = {
        "id": row["id"],
        "sender_id": row["sender_id"],
        "receiver_id": row["receiver_id"],
        "sender_username": current_user["username"],
        "message_type": row["message_type"],
        "content": row["content"],
        "is_suspicious": bool(row["is_suspicious"]),
        "warning": row["warning"],
        "created_at": row["created_at"],
    }
    await publish_message(message)
    return message


@app.get("/api/security/logs")
def security_logs(current_user: dict = Depends(get_current_user)) -> list[dict]:
    # Any authenticated user can read logs in this simple version.
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, message_id, image_name, extracted_text, detected_language, reason, created_at
            FROM detection_logs
            ORDER BY id DESC
            """
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/messages/{message_id}/hidden-code")
def get_hidden_code(message_id: int, current_user: dict = Depends(get_current_user)) -> dict:
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT extracted_text, detected_language, reason
            FROM detection_logs
            WHERE message_id = ?
            ORDER BY id DESC LIMIT 1
            """,
            (message_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No hidden code found for this message")
    return {
        "extracted_text": row["extracted_text"] or "",
        "detected_language": row["detected_language"] or "unknown",
        "reason": row["reason"] or "",
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT u.id, u.username
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()

    if not row:
        await websocket.close(code=1008)
        return

    user_id = row["id"]
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep the socket alive, ignore client pings/messages.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
