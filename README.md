# Secure Stego Chat

Simple secure chat app with FastAPI backend, SQLite storage, WebSockets, image upload, and lightweight steganography checks.

## Stack

- Backend: Python, FastAPI, SQLite (`sqlite3`), WebSockets
- Frontend: Plain HTML, CSS, Vanilla JavaScript
- Image processing: Pillow

## Project Structure

```
secure-stego-chat/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── websocket_manager.py
│   ├── steganography/
│   │   ├── detector.py
│   │   ├── extractor.py
│   │   ├── code_classifier.py
│   │   └── logger.py
│   ├── uploads/
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── chat.html
│   ├── style.css
│   └── script.js
└── README.md
```

## Features

- User registration and login
- Token-based auth
- Text messaging API
- Image messaging API
- Real-time updates through WebSocket
- SQLite persistence for users/messages/logs
- Steganography pipeline on image upload:
  - LSB detection heuristic
  - LSB payload extraction
  - Hidden text code classification (Python, C/C++, Java, HTML, JavaScript, SQL)
  - Detection logging and suspicious-image warning

## Run Locally

1. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2. Start server:

```bash
uvicorn main:app --reload
```

3. Open app in browser:

- `http://127.0.0.1:8000/` for login/register
- `http://127.0.0.1:8000/chat` for chat page after login

## Main API Endpoints

- `POST /api/register`
- `POST /api/login`
- `GET /api/users`
- `GET /api/messages/{peer_id}`
- `POST /api/messages/text`
- `POST /api/messages/image`
- `GET /api/security/logs`
- `WS /ws?token=<session_token>`

## Notes

- Uploaded images are stored in `backend/uploads/`.
- Detection events are appended to `backend/detection.log`.
- Frontend has no build step and no framework dependencies.
