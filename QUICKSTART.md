# SecureStegoChat - Quick Start Guide

Follow these steps to get the application running locally.

## Prerequisites

Make sure you have installed:
- **Node.js 18+** and npm
- **Python 3.8+** and pip

## Quick Setup (5 minutes)

### Terminal 1: Start the Backend

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

Backend will be running at: `http://localhost:8000`

### Terminal 2: Start the Frontend

```bash
npm install
npm run dev
```

Frontend will be running at: `http://localhost:5173`

## Testing the Application

### 1. Create Two User Accounts

**Browser 1 (Normal window):**
1. Go to `http://localhost:5173`
2. Click "Register"
3. Create user: `alice` / `alice@test.com` / `password123`

**Browser 2 (Incognito/Private window):**
1. Go to `http://localhost:5173`
2. Click "Register"
3. Create user: `bob` / `bob@test.com` / `password123`

### 2. Add Each Other as Friends

**In Browser 1 (Alice):**
1. Click "Add Friend" button
2. Search for "bob"
3. Click the plus icon to add Bob

**In Browser 2 (Bob):**
1. Refresh the page or click "Add Friend" then close
2. You'll see Alice in your friends list

### 3. Start Chatting

1. Click on your friend's name in the sidebar
2. Type a message and press Enter
3. See messages appear in real-time in both browsers

### 4. Test Image Messaging

1. Click the image icon
2. Select any image from your computer
3. The image will be sent and analyzed
4. Check the security badge (Clean/Warning/Suspicious)

### 5. Test Security Features (Optional)

To test steganography detection, you can create a test image with hidden data:

**Create a test image with hidden data:**

```python
# save this as create_stego_image.py
from PIL import Image
import numpy as np

def text_to_binary(text):
    return ''.join(format(ord(char), '08b') for char in text)

def hide_text_in_image(image_path, text, output_path):
    img = Image.open(image_path)
    img_array = np.array(img)

    binary_text = text_to_binary(text + "###END###")

    flat = img_array.flatten()
    for i, bit in enumerate(binary_text):
        if i < len(flat):
            flat[i] = (flat[i] & 0xFE) | int(bit)

    stego_array = flat.reshape(img_array.shape)
    stego_img = Image.fromarray(stego_array.astype('uint8'))
    stego_img.save(output_path)

# Use any image you have
hide_text_in_image('your_image.jpg',
                   'def hack(): print("malicious code")',
                   'stego_image.png')
```

Then send `stego_image.png` through the chat and watch the security warning appear!

## Troubleshooting

### Backend won't start
- Make sure port 8000 is not in use
- Verify Python 3.8+ is installed: `python --version`
- Check all dependencies installed: `pip list`

### Frontend won't start
- Make sure port 5173 is not in use
- Delete `node_modules` and run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Messages not appearing in real-time
- Check both backend and frontend are running
- Check browser console for WebSocket errors
- Try refreshing both browser windows

### Database errors
- Delete `backend/securestegoChat.db` and restart backend
- The database will be recreated automatically

## What's Next?

- Read the full README.md for detailed documentation
- Explore the code structure in `backend/` and `src/`
- Try sending different types of images
- Check the security logs in the database

## Key Features to Try

1. **Real-time Messaging**: Messages appear instantly in both windows
2. **Image Security**: Every image is scanned automatically
3. **Security Warnings**: Suspicious images are blurred with warnings
4. **Code Detection**: Hidden code is identified and classified
5. **Security Modal**: Click suspicious images to see detailed analysis

Enjoy exploring SecureStegoChat!
