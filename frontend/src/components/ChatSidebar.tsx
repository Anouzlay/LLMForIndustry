import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import { chatManagementAPI } from '../services/api';
import { ChatResponse } from '../types';

interface ChatSidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: (chatId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ currentChatId, onChatSelect, onNewChat }) => {
  const [chats, setChats] = useState<ChatResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hasAutoCreated, setHasAutoCreated] = useState(false);

  const loadChats = async () => {
    try {
      const response = await chatManagementAPI.getUserChats();
      setChats(response.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = useCallback(async () => {
    try {
      const newChat = await chatManagementAPI.createChat();
      setChats(prev => [newChat, ...prev]);
      onNewChat(newChat.chat_id);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }, [onNewChat]);

  useEffect(() => {
    loadChats();
  }, []);

  // Auto-create first chat if user has no chats
  useEffect(() => {
    if (!isLoading && chats.length === 0 && !hasAutoCreated) {
      setHasAutoCreated(true);
      handleNewChat();
    }
  }, [isLoading, chats.length, hasAutoCreated, handleNewChat]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await chatManagementAPI.deleteChat(chatId);
        setChats(prev => prev.filter(chat => chat.chat_id !== chatId));
        if (currentChatId === chatId) {
          // If we deleted the current chat, create a new one
          handleNewChat();
        }
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
  };

  const handleEditStart = (chat: ChatResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.chat_id);
    setEditingTitle(chat.title);
  };

  const handleEditSave = async (chatId: string) => {
    try {
      await chatManagementAPI.updateChatTitle(chatId, editingTitle);
      setChats(prev => prev.map(chat => 
        chat.chat_id === chatId ? { ...chat, title: editingTitle } : chat
      ));
      setEditingChatId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex items-center justify-center">
        <div className="text-gray-500">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recent Chats
          </h3>
          <div className="mt-2 space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.chat_id}
                onClick={() => onChatSelect(chat.chat_id)}
                className={`group relative flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.chat_id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  {editingChatId === chat.chat_id ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(chat.chat_id);
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSave(chat.chat_id);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCancel();
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <p className="text-xs text-gray-500">
                        {chat.last_message_at 
                          ? formatDate(chat.last_message_at)
                          : formatDate(chat.created_at)
                        }
                      </p>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                {editingChatId !== chat.chat_id && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditStart(chat, e)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(chat.chat_id, e)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
