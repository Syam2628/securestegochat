from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
import json

import models
import auth
from database import engine, get_db
from steganalysis.detector import SteganographyDetector
from steganalysis.extractor import SteganographyExtractor
from steganalysis.code_classifier import CodeClassifier

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SecureStegoChat API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://securestego.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

detector = SteganographyDetector()
extractor = SteganographyExtractor()
classifier = CodeClassifier()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(message)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class FriendRequest(BaseModel):
    friend_username: str

class TextMessage(BaseModel):
    receiver_id: int
    content: str

@app.post("/api/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email
        }
    }

@app.post("/api/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email
        }
    }

@app.get("/api/me")
def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

@app.post("/api/friends/request")
def send_friend_request(
    request: FriendRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    friend = db.query(models.User).filter(models.User.username == request.friend_username).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")

    if friend.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")

    existing = db.query(models.FriendRelation).filter(
        ((models.FriendRelation.user_id == current_user.id) & (models.FriendRelation.friend_id == friend.id)) |
        ((models.FriendRelation.user_id == friend.id) & (models.FriendRelation.friend_id == current_user.id))
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Friend relation already exists")

    new_relation = models.FriendRelation(
        user_id=current_user.id,
        friend_id=friend.id,
        accepted=True
    )
    db.add(new_relation)

    reverse_relation = models.FriendRelation(
        user_id=friend.id,
        friend_id=current_user.id,
        accepted=True
    )
    db.add(reverse_relation)

    db.commit()
    return {"message": "Friend added successfully", "friend": {"id": friend.id, "username": friend.username}}

@app.get("/api/friends")
def get_friends(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    friend_relations = db.query(models.FriendRelation).filter(
        models.FriendRelation.user_id == current_user.id,
        models.FriendRelation.accepted == True
    ).all()

    friends = []
    for relation in friend_relations:
        friend = db.query(models.User).filter(models.User.id == relation.friend_id).first()
        if friend:
            friends.append({
                "id": friend.id,
                "username": friend.username,
                "email": friend.email
            })

    return friends

@app.get("/api/users/search")
def search_users(
    q: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).filter(
        models.User.username.contains(q),
        models.User.id != current_user.id
    ).limit(10).all()

    return [{"id": u.id, "username": u.username} for u in users]

@app.post("/api/messages/text")
async def send_text_message(
    message: TextMessage,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_message = models.Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content,
        message_type="text"
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    message_data = {
        "type": "text_message",
        "message": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "content": new_message.content,
            "message_type": "text",
            "created_at": new_message.created_at.isoformat(),
            "sender_username": current_user.username
        }
    }

    await manager.send_personal_message(json.dumps(message_data), message.receiver_id)

    return message_data["message"]

@app.post("/api/messages/image")
async def send_image_message(
    receiver_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join("uploads", unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    new_message = models.Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        content=f"/uploads/{unique_filename}",
        message_type="image"
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # ==============================
    # SECURITY PIPELINE
    # ==============================

    has_hidden, confidence = detector.detect_lsb_steganography(file_path)

    extracted_text = None
    is_code = False
    detected_language = None
    code_confidence = 0
    security_status = "clean"

    if has_hidden:
        extracted_text = extractor.extract_lsb_data(file_path)

        # If extraction fails → override false positive
        if not extracted_text:
            has_hidden = False
            confidence = 0
            security_status = "clean"

        else:
            is_code, detected_language, code_confidence = classifier.classify(extracted_text)

            if is_code:
                security_status = "suspicious"
            else:
                security_status = "warning"

    image_message = models.ImageMessage(
        message_id=new_message.id,
        file_path=file_path,
        original_filename=file.filename,
        security_status=security_status,
        has_hidden_data=has_hidden,
        extracted_text=extracted_text,
        is_code=is_code,
        confidence_score=int(confidence)
    )
    db.add(image_message)
    db.commit()
    db.refresh(image_message)

    # Log only real payload cases
    if has_hidden and extracted_text:
        security_log = models.SecurityLog(
            image_message_id=image_message.id,
            detection_type="LSB Steganography",
            extracted_payload=extracted_text[:1000],
            classification=detected_language if is_code else "Not Code",
            confidence=code_confidence if is_code else int(confidence),
            action_taken=f"Marked as {security_status}"
        )
        db.add(security_log)
        db.commit()

    message_data = {
        "type": "image_message",
        "message": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "content": new_message.content,
            "message_type": "image",
            "created_at": new_message.created_at.isoformat(),
            "sender_username": current_user.username,
            "image_data": {
                "id": image_message.id,
                "security_status": security_status,
                "has_hidden_data": has_hidden,
                "is_code": is_code,
                "confidence_score": int(confidence),
                "extracted_text": extracted_text[:500] if extracted_text else None
            }
        }
    }

    await manager.send_personal_message(json.dumps(message_data), receiver_id)

    return message_data["message"]


@app.get("/api/messages/{friend_id}")
def get_messages(
    friend_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == current_user.id) & (models.Message.receiver_id == friend_id)) |
        ((models.Message.sender_id == friend_id) & (models.Message.receiver_id == current_user.id))
    ).order_by(models.Message.created_at).all()

    result = []
    for msg in messages:
        msg_dict = {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "message_type": msg.message_type,
            "created_at": msg.created_at.isoformat(),
            "sender_username": msg.sender.username
        }

        if msg.message_type == "image":
            image_msg = db.query(models.ImageMessage).filter(
                models.ImageMessage.message_id == msg.id
            ).first()
            if image_msg:
                msg_dict["image_data"] = {
                    "id": image_msg.id,
                    "security_status": image_msg.security_status,
                    "has_hidden_data": image_msg.has_hidden_data,
                    "is_code": image_msg.is_code,
                    "confidence_score": image_msg.confidence_score,
                    "extracted_text": image_msg.extracted_text[:500] if image_msg.extracted_text else None
                }

        result.append(msg_dict)

    return result

@app.get("/api/admin/security-logs")
def get_security_logs(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # OPTIONAL: Only allow admin users
    # if current_user.username != "admin":
    #     raise HTTPException(status_code=403, detail="Access denied")

    logs = db.query(models.SecurityLog).order_by(
        models.SecurityLog.created_at.desc()
    ).all()

    result = []

    for log in logs:
        result.append({
            "id": log.id,
            "detection_type": log.detection_type,
            "extracted_payload": log.extracted_payload,
            "classification": log.classification,
            "confidence": log.confidence,
            "action_taken": log.action_taken,
            "created_at": log.created_at.isoformat()
        })

    return result


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

