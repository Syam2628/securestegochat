# SecureStegoChat - Complete Project Structure

```
SecureStegoChat/
│
├── backend/                          # Python FastAPI Backend
│   ├── main.py                       # FastAPI app with all routes & WebSocket
│   ├── database.py                   # SQLAlchemy database configuration
│   ├── models.py                     # Database models (User, Message, etc.)
│   ├── auth.py                       # JWT authentication logic
│   ├── requirements.txt              # Python dependencies
│   ├── create_stego_test.py          # Utility to create test images
│   │
│   ├── steganalysis/                 # Security Analysis Modules
│   │   ├── __init__.py
│   │   ├── detector.py               # LSB steganography detection
│   │   ├── extractor.py              # Hidden data extraction
│   │   └── code_classifier.py        # Code classification engine
│   │
│   └── uploads/                      # Image storage (created at runtime)
│
├── src/                              # React Frontend
│   ├── main.tsx                      # React entry point
│   ├── App.tsx                       # Main app component
│   ├── index.css                     # Tailwind CSS imports
│   │
│   ├── context/                      # React Context
│   │   └── AuthContext.tsx           # Authentication state management
│   │
│   ├── pages/                        # Page Components
│   │   ├── LoginPage.tsx             # Login interface
│   │   ├── RegisterPage.tsx          # Registration interface
│   │   └── ChatPage.tsx              # Main chat interface
│   │
│   ├── components/                   # Reusable Components
│   │   ├── ChatMessage.tsx           # Individual message component
│   │   ├── SecurityModal.tsx         # Security warning modal
│   │   └── AddFriendModal.tsx        # Add friend interface
│   │
│   └── services/                     # API Services
│       └── api.ts                    # Backend API communication
│
├── public/                           # Static assets
│
├── README.md                         # Full documentation
├── QUICKSTART.md                     # Quick start guide
├── PROJECT_STRUCTURE.md              # This file
│
├── package.json                      # Node.js dependencies
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind CSS configuration
└── postcss.config.js                 # PostCSS configuration
```

## Key Files Explained

### Backend Files

**main.py** (450+ lines)
- FastAPI application setup
- CORS middleware configuration
- REST API endpoints for auth, friends, messages
- WebSocket endpoint for real-time chat
- Image upload and security scanning
- Connection manager for WebSocket clients

**models.py**
- `User`: User accounts with authentication
- `FriendRelation`: Friend connections between users
- `Message`: Text and image messages
- `ImageMessage`: Image-specific data and security status
- `SecurityLog`: Audit log for security detections

**steganalysis/detector.py**
- LSB steganography detection
- Chi-square statistical analysis
- Pattern detection algorithms
- Confidence scoring

**steganalysis/extractor.py**
- LSB bit extraction
- Binary to text conversion
- Payload validation
- Delimiter-based extraction

**steganalysis/code_classifier.py**
- Multi-language code detection
- Pattern matching for Python, JavaScript, Java, C/C++, HTML, SQL, Bash
- Confidence scoring
- Structure analysis

### Frontend Files

**App.tsx**
- Main application component
- Authentication routing
- Loading states

**pages/ChatPage.tsx**
- Main chat interface
- Friend sidebar
- Message display
- WebSocket connection
- Image upload handling

**components/ChatMessage.tsx**
- Message rendering (text/image)
- Security badge display
- Image blur for suspicious content
- Security modal trigger

**components/SecurityModal.tsx**
- Detailed security analysis display
- Extracted payload preview
- Warning messages
- Action buttons

**services/api.ts**
- Centralized API communication
- Type-safe interfaces
- Error handling
- Authentication headers

## Data Flow

### Authentication Flow
```
User -> LoginPage -> api.login() -> FastAPI /api/login
     -> JWT token returned -> Stored in localStorage
     -> AuthContext updates -> ChatPage renders
```

### Message Flow
```
User types message -> ChatPage.handleSendMessage()
     -> api.sendTextMessage() -> FastAPI /api/messages/text
     -> Message saved to DB -> WebSocket broadcast
     -> Receiver's WebSocket receives -> Message added to chat
```

### Image Security Flow
```
User uploads image -> api.sendImageMessage()
     -> FastAPI receives image -> Save to uploads/
     -> SteganographyDetector.detect_lsb_steganography()
     -> If detected: SteganographyExtractor.extract_lsb_data()
     -> If text found: CodeClassifier.classify()
     -> ImageMessage + SecurityLog created
     -> Security status returned to sender
     -> WebSocket broadcast to receiver
     -> Receiver sees blurred image + warning
     -> Click triggers SecurityModal
     -> User reviews analysis -> Choose to view or go back
```

## Database Schema

### Users Table
- id (PK)
- username (unique)
- email (unique)
- hashed_password
- created_at

### Friend_Relations Table
- id (PK)
- user_id (FK -> users.id)
- friend_id (FK -> users.id)
- accepted (boolean)
- created_at

### Messages Table
- id (PK)
- sender_id (FK -> users.id)
- receiver_id (FK -> users.id)
- content (text or image path)
- message_type ('text' or 'image')
- created_at
- read (boolean)

### Image_Messages Table
- id (PK)
- message_id (FK -> messages.id)
- file_path
- original_filename
- security_status ('clean', 'warning', 'suspicious')
- has_hidden_data (boolean)
- extracted_text (nullable)
- is_code (boolean)
- confidence_score (0-100)
- created_at

### Security_Logs Table
- id (PK)
- image_message_id (FK -> image_messages.id)
- detection_type
- extracted_payload
- classification
- confidence
- action_taken
- timestamp

## Security Pipeline Algorithms

### 1. LSB Detection
- Extract least significant bits from all pixels
- Calculate bit distribution (should be ~50/50 for random data)
- Perform chi-square test on bit pairs
- Detect suspicious patterns in LSB data
- Generate confidence score (0-100)

### 2. Data Extraction
- Read LSB from each pixel
- Group into 8-bit bytes
- Convert to characters
- Validate as printable text
- Return up to 5000 characters

### 3. Code Classification
- Pattern matching for language-specific keywords
- Structure analysis (braces, semicolons, indentation)
- Calculate code-like line ratio
- Multi-language detection
- Confidence scoring

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Create new account |
| POST | /api/login | Authenticate user |
| GET | /api/me | Get current user |
| GET | /api/friends | List all friends |
| POST | /api/friends/request | Add new friend |
| GET | /api/users/search?q= | Search users |
| GET | /api/messages/{friend_id} | Get chat history |
| POST | /api/messages/text | Send text message |
| POST | /api/messages/image | Send image (with security scan) |
| WS | /ws/{user_id} | WebSocket connection |

## Technologies Used

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Pillow**: Image processing
- **NumPy**: Numerical operations for steganalysis
- **python-jose**: JWT implementation
- **passlib**: Password hashing
- **uvicorn**: ASGI server

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS
- **Lucide React**: Icon library

## Running the Application

See **QUICKSTART.md** for detailed setup instructions.

Quick commands:

Terminal 1 (Backend):
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

Terminal 2 (Frontend):
```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
