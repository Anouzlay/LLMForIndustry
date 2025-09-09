import axios from "axios";
import {
  ChatMessageResponse, ThreadResponse, UserRegister, UserLogin, AuthResponse, UserResponse,
  ChatCreate, ChatResponse, ChatListResponse, ChatMessageWithId
} from "../types";

// Vite env (typed via vite-env.d.ts)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // Allow long-running responses from the AI backend
  timeout: 180000,
});

// attach auth header if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("session_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("session_token");
      localStorage.removeItem("user_data");
    }
    return Promise.reject(err);
  }
);

// 👇 Add this named export to satisfy FileUpload.tsx
export async function uploadAPI(file: File) {
  const form = new FormData();
  form.append("file", file);

  // adjust the endpoint if your backend differs (e.g. "/api/files")
  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export const authAPI = {
  async register(userData: UserRegister): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/register", userData);
    return data;
  },
  async login(loginData: UserLogin): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/login", loginData);
    return data;
  },
  async getCurrentUser(): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>("/api/auth/me");
    return data;
  },
  async logout(): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post("/api/auth/logout");
    return data;
  },
};

export const chatAPI = {
  async sendMessage(message: string, chatId: string, threadId?: string): Promise<ChatMessageResponse> {
    const payload: ChatMessageWithId = { message, chat_id: chatId, thread_id: threadId };
    const { data } = await api.post<ChatMessageResponse>("/api/chat", payload);
    return data;
  },
  async createThread(): Promise<ThreadResponse> {
    const { data } = await api.post<ThreadResponse>("/api/thread");
    return data;
  },
};

export const chatManagementAPI = {
  async createChat(title: string = "New Chat"): Promise<ChatResponse> {
    const payload: ChatCreate = { title };
    const { data } = await api.post<ChatResponse>("/api/chats", payload);
    return data;
  },
  async getUserChats(): Promise<ChatListResponse> {
    const { data } = await api.get<ChatListResponse>("/api/chats");
    return data;
  },
  async deleteChat(chatId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete(`/api/chats/${chatId}`);
    return data;
  },
  async updateChatTitle(chatId: string, title: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.put(`/api/chats/${chatId}/title`, { title });
    return data;
  },
};

export default api;
