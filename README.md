# SecureStegoChat

A full-stack secure chat application with integrated steganography detection and code classification.

## Features

- Real-time chat using WebSockets
- User authentication (JWT-based)
- Friend system
- Text and image messaging
- Automatic steganography detection on received images
- Hidden data extraction using LSB (Least Significant Bit) technique
- Code classification for extracted payloads
- Security warnings and image blocking for suspicious content
- Security logging and auditing

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons
- WebSocket for real-time communication

### Backend
- FastAPI (Python)
- SQLAlchemy with SQLite
- JWT authentication
- WebSocket support
- Pillow for image processing
- NumPy for steganography analysis

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- pip

### Step 1: Clone and Setup Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:

**On Windows:**
```bash
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
source venv/bin/activate
```

4. Install Python dependencies:
```bash
pip install -r requirements.txt
```

5. Start the FastAPI server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Step 2: Setup Frontend

1. Open a new terminal and navigate to the project root

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

### Creating Accounts

1. Open your browser and go to `http://localhost:5173`
2. Click "Register" to create a new account
3. Fill in username, email, and password
4. You'll be automatically logged in

### Adding Friends

1. Click the "Add Friend" button in the sidebar
2. Search for a user by username
3. Click the plus icon to add them as a friend
4. They will appear in your friends list immediately

### Chatting

1. Click on a friend in the sidebar to open the chat
2. Type messages in the input field and press Enter or click Send
3. Messages appear in real-time for both users

### Sending Images

1. Click the image icon in the chat input
2. Select an image file from your computer
3. The image will be automatically scanned for hidden data
4. If suspicious content is detected, a security warning will appear

### Security Features

When you receive an image with hidden data:
- The image is automatically analyzed
- Hidden data is extracted using LSB steganography detection
- Extracted text is classified to detect code
- Suspicious images are blurred with a warning overlay
- Click the image to view the security analysis
- View extracted payload and confidence scores
- Choose to view the image anyway or go back

Security statuses:
- **Clean** (Green): No hidden data detected
- **Warning** (Yellow): Hidden data detected but not code
- **Suspicious** (Red): Hidden code detected

## Testing with Multiple Users

To test real-time chat:

1. Open the app in one browser: `http://localhost:5173`
2. Register and login as User 1

3. Open a second browser (or incognito window): `http://localhost:5173`
4. Register and login as User 2

5. In User 1's session, add User 2 as a friend
6. In User 2's session, refresh and you'll see User 1 in friends list
7. Start chatting in real-time

## Testing Steganography Detection

To test the security features, you can:

1. Create an image with hidden LSB data using a steganography tool
2. Send it through the chat
3. The receiver will see security warnings and analysis

Example tools to create steganographic images:
- stegano (Python library)
- steghide
- OpenStego

## Project Structure

```
project/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Database models
│   ├── database.py          # Database configuration
│   ├── auth.py              # Authentication logic
│   ├── requirements.txt     # Python dependencies
│   └── steganalysis/
│       ├── detector.py      # Steganography detection
│       ├── extractor.py     # Hidden data extraction
│       └── code_classifier.py  # Code classification
├── src/
│   ├── components/          # React components
│   ├── context/             # React context (Auth)
│   ├── pages/               # Page components
│   ├── services/            # API service
│   └── App.tsx              # Main application
└── README.md                # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/me` - Get current user

### Friends
- `GET /api/friends` - Get friends list
- `POST /api/friends/request` - Add friend
- `GET /api/users/search` - Search users

### Messages
- `GET /api/messages/{friend_id}` - Get chat history
- `POST /api/messages/text` - Send text message
- `POST /api/messages/image` - Send image message

### WebSocket
- `WS /ws/{user_id}` - Real-time messaging connection

## Security Pipeline

The security pipeline runs automatically on every received image:

1. **Detection**: LSB steganography detection using statistical analysis
2. **Extraction**: Extract hidden data from image pixels
3. **Classification**: Classify extracted text as code or non-code
4. **Logging**: Log all detections and actions
5. **User Warning**: Display security modal with analysis results

## Development

### Building for Production

Frontend:
```bash
npm run build
npm run preview
```

Backend:
```bash
# Use uvicorn directly for production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## License

MIT

## Author

Built as a cybersecurity research project demonstrating steganography detection in messaging applications.
