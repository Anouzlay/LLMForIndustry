import React, { useState } from 'react';
import { MessageCircle, FileText, LogOut, User } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import ChatSidebar from './components/ChatSidebar';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserResponse } from './types';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [showRegister, setShowRegister] = useState(false);



  const handleThreadCreated = (newThreadId: string) => {
    setThreadId(newThreadId);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    // Clear any existing thread ID when switching chats
    setThreadId(undefined);
  };

  const handleNewChat = (chatId: string) => {
    setCurrentChatId(chatId);
    // Clear any existing thread ID when switching to a new chat
    setThreadId(undefined);
  };

  const handleAuthSuccess = (userData: UserResponse, token: string) => {
    // This will be handled by the AuthContext
    setShowRegister(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          {showRegister ? (
            <RegisterForm
              onRegisterSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <LoginForm
              onLoginSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Document Chatbot
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Welcome, {user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
        <div className="flex-1 flex flex-col">
          <ChatInterface
            chatId={currentChatId}
            threadId={threadId}
            onThreadCreated={handleThreadCreated}
          />
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
