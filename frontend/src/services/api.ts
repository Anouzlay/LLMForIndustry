import axios from 'axios';
import { 
  ChatMessage, ChatMessageResponse, ThreadResponse, UserRegister, UserLogin, AuthResponse, UserResponse,
  ChatCreate, ChatResponse, ChatListResponse, ChatMessageWithId
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_data');
      // Don't redirect, let the AuthContext handle the state
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  async register(userData: UserRegister): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', userData);
    return response.data;
  },

  async login(loginData: UserLogin): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', loginData);
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/api/auth/me');
    return response.data;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

export const chatAPI = {
  async sendMessage(message: string, chatId: string, threadId?: string): Promise<ChatMessageResponse> {
    const payload: ChatMessageWithId = { message, chat_id: chatId, thread_id: threadId };
    const response = await api.post<ChatMessageResponse>('/api/chat', payload);
    return response.data;
  },

  async createThread(): Promise<ThreadResponse> {
    const response = await api.post<ThreadResponse>('/api/thread');
    return response.data;
  },
};

export const chatManagementAPI = {
  async createChat(title: string = "New Chat"): Promise<ChatResponse> {
    const payload: ChatCreate = { title };
    const response = await api.post<ChatResponse>('/api/chats', payload);
    return response.data;
  },

  async getUserChats(): Promise<ChatListResponse> {
    const response = await api.get<ChatListResponse>('/api/chats');
    return response.data;
  },

  async deleteChat(chatId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/chats/${chatId}`);
    return response.data;
  },

  async updateChatTitle(chatId: string, title: string): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/api/chats/${chatId}/title`, { title });
    return response.data;
  },
};

export default api;
