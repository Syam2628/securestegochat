
const API_BASE = "https://securestegochat.onrender.com";

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

// Helper for other non-auth requests
const logRequest = async (url: string, options?: RequestInit) => {
  try {
    console.log("Calling:", url); // Specific log requested by user
    const response = await fetch(url, options);
    console.log(`[API] Response from: ${url}`, { status: response.status });

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

export const registerUser = async (data: RegisterData) => {
  const url = `${API_BASE}/api/register`;
  console.log("Register URL:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Register failed:", errorText);
    throw new Error("Registration failed");
  }

  return response.json();
};

export const loginUser = async (data: LoginData) => {
  const url = `${API_BASE}/api/login`;
  console.log("Login URL:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Login failed:", errorText);
    throw new Error("Login failed");
  }

  return response.json();
};

export const api = {
  // Keeping these for backward compatibility if used elsewhere, 
  // but they should ideally redirect to the exported functions or use the same logic.
  register: registerUser,
  login: loginUser,

  async getMe(token: string): Promise<User> {
    return logRequest(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getFriends(token: string): Promise<User[]> {
    return logRequest(`${API_BASE}/api/friends`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async addFriend(token: string, friendUsername: string) {
    return logRequest(`${API_BASE}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_username: friendUsername }),
    });
  },

  async searchUsers(token: string, query: string): Promise<User[]> {
    return logRequest(`${API_BASE}/api/users/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async getMessages(token: string, friendId: number): Promise<Message[]> {
    return logRequest(`${API_BASE}/api/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async sendTextMessage(token: string, receiverId: number, content: string) {
    return logRequest(`${API_BASE}/api/messages/text`, {
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


    return logRequest(`${API_BASE}/api/messages/image?receiver_id=${receiverId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  },
};
