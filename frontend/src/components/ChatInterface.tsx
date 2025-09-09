import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  chatId: string | null;
  threadId?: string;
  onThreadCreated?: (threadId: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId, threadId, onThreadCreated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(threadId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear messages when chat changes
  useEffect(() => {
    setMessages([]);
    setCurrentThreadId(threadId);
    setError(null); // Clear any previous errors
  }, [chatId, threadId]);

  const createThread = async () => {
    try {
      const response = await chatAPI.createThread();
      setCurrentThreadId(response.thread_id);
      onThreadCreated?.(response.thread_id);
    } catch (error: any) {
      setError('Failed to create chat thread');
      console.error('Error creating thread:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!chatId) {
      setError('No chat selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await chatAPI.sendMessage(content, chatId, currentThreadId);
      
      // Update thread ID if it was created
      if (response.thread_id && response.thread_id !== currentThreadId) {
        setCurrentThreadId(response.thread_id);
        onThreadCreated?.(response.thread_id);
      }
      
      // Check if response is out of context
      const isOutOfContext = response.reply.toLowerCase().includes('out of context');
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.reply,
        role: 'assistant',
        timestamp: new Date(),
        isOutOfContext,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to send message');
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request.',
        role: 'assistant',
        timestamp: new Date(),
        isOutOfContext: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-semibold text-gray-900">Document Chat</h1>
            {currentThreadId && (
              <span className="text-sm text-gray-500">
                Thread: {currentThreadId.slice(0, 8)}...
              </span>
            )}
          </div>
          <button
            onClick={clearChat}
            className="btn-secondary text-sm"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!chatId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a chat to start
            </h3>
            <p className="text-gray-500 max-w-md">
              Choose a chat from the sidebar or create a new one to start asking questions about your documents.
            </p>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 max-w-md">
              Ask questions about your uploaded documents. The AI will search through your files to provide relevant answers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isLoading || !chatId}
        placeholder={
          chatId 
            ? "Ask a question about your documents..." 
            : "Select a chat to start..."
        }
      />
    </div>
  );
};

export default ChatInterface;
