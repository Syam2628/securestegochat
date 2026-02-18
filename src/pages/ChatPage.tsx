import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, User, Message } from '../services/api';

export function ChatPage() {
  const { user, token, logout } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (token) {
      loadFriends();
    }
  }, [token]);

  useEffect(() => {
    if (selectedFriend && token) {
      loadMessages(selectedFriend.id);

      const WS_URL = "wss://securestegochat.onrender.com"; // Hardcoded Production URL
      const websocket = new WebSocket(`${WS_URL}/ws/${user?.id}`);

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'text_message' || data.type === 'image_message') {
          const msg = data.message;
          if (
            (msg.sender_id === selectedFriend.id && msg.receiver_id === user?.id) ||
            (msg.sender_id === user?.id && msg.receiver_id === selectedFriend.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      };

      return () => {
        websocket.close();
      };
    }
  }, [selectedFriend, token, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFriends = async () => {
    if (!token) return;
    try {
      const data = await api.getFriends(token);
      setFriends(data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const loadMessages = async (friendId: number) => {
    if (!token) return;
    try {
      const data = await api.getMessages(token, friendId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (query.length > 2 && token) {
      try {
        const results = await api.searchUsers(token, query);
        setSearchResults(results);
        setShowSearch(true);
      } catch (err) {
        console.error('Search failed:', err);
      }
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const addFriend = async (friend: User) => {
    if (!token) return;
    try {
      await api.addFriend(token, friend.username);
      setSearchTerm('');
      setShowSearch(false);
      loadFriends();
    } catch (err) {
      console.error('Failed to add friend:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !token) return;

    try {
      await api.sendTextMessage(token, selectedFriend.id, newMessage);
      // Message update handled by WebSocket to avoid duplication if we append here too + WS
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFriend || !token) return;

    try {
      await api.sendImageMessage(token, selectedFriend.id, file);
      // Message update handled by WebSocket
    } catch (err) {
      console.error('Failed to send image:', err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="font-display h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e5e7eb] dark:border-[#1f2937] px-6 py-3 bg-white dark:bg-background-dark z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="size-8">
              <span className="material-symbols-outlined text-3xl">shield_moon</span>
            </div>
            <h2 className="text-[#111814] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">ShieldChat Pro</h2>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <a className="text-[#111814] dark:text-white text-sm font-medium hover:text-primary transition-colors" href="/admin/logs">Security Logs</a>
            <a className="text-[#111814] dark:text-white text-sm font-medium hover:text-primary transition-colors" href="#">Policies</a>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-[#f0f4f2] dark:bg-zinc-800 text-[#111814] dark:text-white hover:bg-[#e2e8e5]">
              <span className="material-symbols-outlined">lock</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-2"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Logout</span>
            </button>
          </div>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200 dark:border-zinc-700 font-bold flex items-center justify-center bg-gray-100 text-primary">
            {user?.username.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-solid border-[#f0f4f2] dark:border-zinc-800 flex flex-col bg-white dark:bg-background-dark shrink-0">
          <div className="p-4 border-b border-[#f0f4f2] dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 font-bold flex items-center justify-center bg-primary/10 text-primary">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <h1 className="text-[#111814] dark:text-white text-sm font-semibold">{user?.username}</h1>
                <p className="text-primary text-xs font-medium flex items-center gap-1">
                  <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                  Secure Connection Active
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 relative">
            <label className="flex items-center bg-[#f0f4f2] dark:bg-zinc-800 rounded-lg h-10 px-3 gap-2">
              <span className="material-symbols-outlined text-[#618972] text-xl">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm text-[#111814] dark:text-white placeholder:text-[#618972] w-full"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </label>
            {showSearch && (
              <div className="absolute top-16 left-4 right-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-zinc-800 last:border-0"
                    onClick={() => addFriend(result)}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.username}</span>
                    <span className="text-xs text-primary font-bold px-2 py-1 bg-primary/10 rounded">ADD</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`flex items-center gap-4 px-4 min-h-[72px] py-2 cursor-pointer transition-colors ${selectedFriend?.id === friend.id
                    ? 'bg-primary/10 border-l-4 border-primary'
                    : 'hover:bg-[#f9fafb] dark:hover:bg-zinc-800'
                  }`}
              >
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border border-primary/20 flex items-center justify-center bg-gray-100 text-[#111814] font-bold">
                  {friend.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-[#111814] dark:text-white text-sm font-bold truncate">{friend.username}</p>
                    <span className="text-[#618972] text-[10px]">Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#618972] text-xs font-medium line-clamp-1 italic">Encrypted Channel</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col bg-[#f6f8f7] dark:bg-background-dark/50 relative">
          {selectedFriend ? (
            <>
              <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-background-dark border-b border-[#f0f4f2] dark:border-zinc-800 shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex items-center justify-center bg-primary/10 font-bold text-primary">
                    {selectedFriend.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[#111814] dark:text-white font-bold text-base leading-none">{selectedFriend.username}</h3>
                    <p className="text-[#618972] text-[11px] font-medium uppercase tracking-wider mt-1">Status: Encrypted Tunnel Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#618972]">lock</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col items-${isMe ? 'end' : 'start'} gap-1`}>
                      <div className={`max-w-[80%] rounded-xl p-3 shadow-md ${isMe
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-white dark:bg-zinc-800 rounded-bl-none border border-black/5 dark:border-white/10'
                        }`}>
                        {msg.message_type === 'text' ? (
                          <p className={`text-sm leading-relaxed ${!isMe && 'text-[#111814] dark:text-zinc-200'}`}>
                            {msg.content}
                          </p>
                        ) : (
                          <div className="relative rounded-lg overflow-hidden border border-white/20">
                            {/* Use Hardcoded API Base for images */}
                            <img
                              src={`https://securestegochat.onrender.com${msg.content}`}
                              alt="Secure Content"
                              className={`max-w-xs ${msg.image_data?.security_status === 'pending' ? 'blur-sm' :
                                  msg.image_data?.security_status === 'suspicious' ? 'grayscale contrast-125' : ''
                                }`}
                            />

                            {/* Status Overlay */}
                            {msg.image_data?.security_status === 'clean' && (
                              <div className="absolute top-2 right-2 bg-emerald-500/90 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                <span>SAFE</span>
                              </div>
                            )}

                            {msg.image_data?.security_status === 'suspicious' && (
                              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">report</span>
                                <span>HIDDEN DATA</span>
                              </div>
                            )}

                            {msg.image_data?.security_status === 'pending' && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                  <div className="size-2 bg-white rounded-full animate-ping"></div>
                                  <span>SCANNING</span>
                                </div>
                                <div className="size-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                                <span className="text-[11px] font-semibold tracking-wide uppercase">Stego-Analysis</span>
                              </div>
                            )}

                            {/* Hidden Data Reveal */}
                            {(msg.image_data?.has_hidden_data || msg.image_data?.security_status === 'suspicious') && (
                              <div className="absolute bottom-2 left-2 right-2 bg-red-600 text-white rounded p-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="material-symbols-outlined text-lg animate-pulse shrink-0">warning</span>
                                  <span className="text-[11px] font-bold truncate">Hidden Payload Detected</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/80' : 'text-[#618972]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white dark:bg-background-dark border-t border-[#f0f4f2] dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="size-10 flex items-center justify-center rounded-lg hover:bg-[#f0f4f2] dark:hover:bg-zinc-800 text-[#618972] transition-colors"
                    >
                      <span className="material-symbols-outlined">image</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      className="w-full h-11 bg-[#f0f4f2] dark:bg-zinc-800 border-none rounded-xl px-4 text-sm text-[#111814] dark:text-white focus:ring-2 focus:ring-primary/50 placeholder:text-[#618972]"
                      placeholder="Type an encrypted message..."
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button className="absolute right-3 top-2.5 text-[#618972] hover:text-primary">
                      <span className="material-symbols-outlined">lock</span>
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="size-11 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg hover:opacity-90 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#618972]">
              <div className="size-20 bg-[#f0f4f2] dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">chat</span>
              </div>
              <h3 className="text-lg font-bold text-[#111814] dark:text-white">Select a secure channel</h3>
              <p className="text-sm">Choose a contact to establish an encrypted tunnel</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
