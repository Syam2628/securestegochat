const API_BASE_URL = 'https://securestegochat.onrender.com/api';

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: string;
  created_at: string;
  sender_username: string;
  image_data?: {
    id: number;
    security_status: string;
    has_hidden_data: boolean;
    is_code: boolean;
    confidence_score: number;
    extracted_text: string | null;
  };
}

export const api = {
  async register(data: RegisterData) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  },

  async login(data: LoginData) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  async getMe(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch user data');
    return response.json();
  },

  async getFriends(token: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch friends');
    return response.json();
  },

  async addFriend(token: string, friendUsername: string) {
    const response = await fetch(`${API_BASE_URL}/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_username: friendUsername }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add friend');
    }

    return response.json();
  },

  async searchUsers(token: string, query: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  },

  async getMessages(token: string, friendId: number): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async sendTextMessage(token: string, receiverId: number, content: string) {
    const response = await fetch(`${API_BASE_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });

    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async sendImageMessage(token: string, receiverId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiver_id', receiverId.toString());

    const response = await fetch(
      `${API_BASE_URL}/messages/image?receiver_id=${receiverId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Failed to send image');
    return response.json();
  },
};
