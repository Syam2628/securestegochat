
const API_BASE_URL = import.meta.env.VITE_API_URL;

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

// Helper for debugging logs
const logRequest = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    console.log(`[API] Request to: ${url}`, { status: response.status });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error from ${url}:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Request failed with status ${response.status}`);
      } catch (e) {
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }
    }
    return response.json();
  } catch (err) {
    console.error(`[API] Network error fetching ${url}:`, err);
    throw err;
  }
};

export const api = {
  async register(data: RegisterData) {
    return logRequest(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginData) {
    return logRequest(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getMe(token: string): Promise<User> {
    return logRequest(`${API_BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getFriends(token: string): Promise<User[]> {
    return logRequest(`${API_BASE_URL}/api/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async addFriend(token: string, friendUsername: string) {
    return logRequest(`${API_BASE_URL}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_username: friendUsername }),
    });
  },

  async searchUsers(token: string, query: string): Promise<User[]> {
    return logRequest(`${API_BASE_URL}/api/users/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getMessages(token: string, friendId: number): Promise<Message[]> {
    return logRequest(`${API_BASE_URL}/api/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async sendTextMessage(token: string, receiverId: number, content: string) {
    return logRequest(`${API_BASE_URL}/api/messages/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });
  },

  async sendImageMessage(token: string, receiverId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiver_id', receiverId.toString());

    return logRequest(`${API_BASE_URL}/api/messages/image`, { // Fixed path
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
    );
  },
};
