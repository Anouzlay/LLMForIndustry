export interface ChatMessage {
  message: string;
  thread_id?: string;
}

export interface ChatMessageResponse {
  reply: string;
  thread_id: string;
}

export interface ThreadResponse {
  thread_id: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isOutOfContext?: boolean;
}

// Authentication Types
export interface UserRegister {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserResponse {
  user_id: string;
  username: string;
  email: string;
  chats?: { [key: string]: any };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user_data?: UserResponse;
  session_token?: string;
}

// Chat Management Types
export interface ChatCreate {
  title: string;
}

export interface ChatResponse {
  chat_id: string;
  title: string;
  created_at: string;
  last_message_at?: string;
  message_count: number;
}

export interface ChatListResponse {
  chats: ChatResponse[];
}

export interface ChatMessageWithId {
  message: string;
  chat_id: string;
  thread_id?: string;
}
