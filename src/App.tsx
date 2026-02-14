import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatPage } from "./pages/ChatPage";
import AdminLogs from "./pages/AdminLogs";

type PageType = "chat" | "admin";

function AppContent() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>("chat");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return showLogin ? (
      <LoginPage onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  // If logged in
  return (
    <>
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold">SecureStegoChat</h1>

        <div className="space-x-4">
          <button
            onClick={() => setCurrentPage("chat")}
            className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            💬 Chat
          </button>

          <button
            onClick={() => setCurrentPage("admin")}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-500"
          >
            🛡 Security Logs
          </button>
        </div>
      </div>

      {/* Page Content */}
      {currentPage === "chat" ? (
        <ChatPage />
      ) : (
        <AdminLogs />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
