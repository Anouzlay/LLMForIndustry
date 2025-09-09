from pydantic import BaseModel, EmailStr
from typing import List, Optional

class ChatMessage(BaseModel):
    message: str
    thread_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    reply: str
    thread_id: str

class ThreadResponse(BaseModel):
    thread_id: str

# Authentication Models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    chats: Optional[dict] = None

class AuthResponse(BaseModel):
    success: bool
    message: str
    user_data: Optional[UserResponse] = None
    session_token: Optional[str] = None

class SessionUser(BaseModel):
    username: str
    user_id: str
    thread_id: Optional[str] = None

# Chat Management Models
class ChatCreate(BaseModel):
    title: str = "New Chat"

class ChatResponse(BaseModel):
    chat_id: str
    title: str
    created_at: str
    last_message_at: Optional[str] = None
    message_count: int = 0

class ChatListResponse(BaseModel):
    chats: List[ChatResponse]

class ChatMessageWithId(BaseModel):
    message: str
    chat_id: str
    thread_id: Optional[str] = None
