import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, User, Message } from '../services/api';
import { ChatMessage } from '../components/ChatMessage';
import { AddFriendModal } from '../components/AddFriendModal';
import { LogOut, UserPlus, Send, Image, MessageCircle } from 'lucide-react';

export function ChatPage() {
  const { user, token, logout } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      loadFriends();
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      const websocket = new WebSocket(`ws://localhost:8000/ws/${user.id}`);

      websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'text_message' || data.type === 'image_message') {
          if (
            selectedFriend &&
            (data.message.sender_id === selectedFriend.id ||
              data.message.receiver_id === selectedFriend.id)
          ) {
            setMessages((prev) => [...prev, data.message]);
          }
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWs(websocket);

      return () => {
        websocket.close();
      };
    }
  }, [user, selectedFriend, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFriends = async () => {
    if (!token) return;
    try {
      const friendsList = await api.getFriends(token);
      setFriends(friendsList);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const loadMessages = async (friendId: number) => {
    if (!token) return;
    try {
      const msgs = await api.getMessages(token, friendId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSelectFriend = (friend: User) => {
    setSelectedFriend(friend);
    loadMessages(friend.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !token) return;

    try {
      const sentMessage = await api.sendTextMessage(token, selectedFriend.id, newMessage);
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFriend || !token) return;

    try {
      const sentMessage = await api.sendImageMessage(token, selectedFriend.id, file);
      setMessages((prev) => [...prev, sentMessage]);
    } catch (err) {
      console.error('Failed to send image:', err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-cyan-600">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">SecureStegoChat</h1>
            <button
              onClick={logout}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="text-white text-sm">
            <p className="font-medium">{user?.username}</p>
            <p className="text-blue-100 text-xs">{user?.email}</p>
          </div>
        </div>

        <div className="p-4 border-b">
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus className="w-5 h-5" />
            Add Friend
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No friends yet</p>
              <p className="text-sm">Add friends to start chatting</p>
            </div>
          ) : (
            <div className="divide-y">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleSelectFriend(friend)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                    selectedFriend?.id === friend.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="font-semibold text-gray-800">{friend.username}</p>
                  <p className="text-sm text-gray-600">{friend.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            <div className="p-4 bg-white border-b shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">{selectedFriend.username}</h2>
              <p className="text-sm text-gray-600">Online</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user?.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Send image"
                >
                  <Image className="w-6 h-6" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold">Select a friend to start chatting</p>
            </div>
          </div>
        )}
      </div>

      <AddFriendModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onFriendAdded={loadFriends}
      />
    </div>
  );
}
