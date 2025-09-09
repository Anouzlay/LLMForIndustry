import React, { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserResponse } from './types';
import { chatManagementAPI } from './services/api';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, login } = useAuth();
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [showRegister, setShowRegister] = useState(false);

  // Single-chat mode: ensure one chat exists and is selected (must be before any returns)
  useEffect(() => {
    const ensureSingleChat = async () => {
      if (!isAuthenticated || currentChatId) return;
      try {
        const list = await chatManagementAPI.getUserChats();
        if (list.chats.length === 0) {
          const created = await chatManagementAPI.createChat('New Chat');
          setCurrentChatId(created.chat_id);
        } else {
          setCurrentChatId(list.chats[0].chat_id);
        }
      } catch (e) {
        // Silent: ChatInterface handles errors on send
      }
    };
    void ensureSingleChat();
  }, [isAuthenticated, currentChatId]);
  const handleThreadCreated = (newThreadId: string) => {
    setThreadId(newThreadId);
  };

  // In single-chat mode, selection helpers are not used

  const handleAuthSuccess = (userData: UserResponse, token: string) => {
    // Immediately set auth state so UI switches without waiting for effect
    login(userData, token);
    setShowRegister(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 flex flex-col" data-accent="violet">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/app-icon.svg" alt="App" className="w-8 h-8" />
              <h1 className="text-2xl font-bold text-gray-900">
                LLM4industry
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
        <div className="flex-1 flex flex-col max-w-6xl w-[80%] mx-auto">
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
