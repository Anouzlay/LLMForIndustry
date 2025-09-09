from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging
from typing import Optional

from config import settings
from models import (
    ChatMessage, ChatMessageResponse, ThreadResponse, 
    UserRegister, UserLogin, AuthResponse, UserResponse, SessionUser,
    ChatCreate, ChatResponse, ChatListResponse, ChatMessageWithId
)
from openai_client import openai_client
from user_database import user_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document-Grounded Chatbot API",
    description="A RAG-based chatbot that answers questions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication setup
security = HTTPBearer(auto_error=False)

def get_current_user(authorization: Optional[str] = Header(None)) -> SessionUser:
    """Get current user from session token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")
        user_data = user_db.validate_session(token)
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        return SessionUser(**user_data)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid session token")

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    logger.info("Starting Document-Grounded Chatbot API")
    
    # Validate required environment variables
    if not settings.OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY is required")
        raise ValueError("OPENAI_API_KEY environment variable is required")
    
    if not settings.ASSISTANT_ID:
        logger.error("ASSISTANT_ID not set. Run 'python setup.py' to create an assistant.")
        raise ValueError("ASSISTANT_ID environment variable is required. Run setup.py first.")
    
    if not settings.VECTOR_STORE_ID:
        logger.error("VECTOR_STORE_ID not set. Run 'python setup.py' to create a vector store.")
        raise ValueError("VECTOR_STORE_ID environment variable is required. Run setup.py first.")
    
    logger.info("✅ All required environment variables are configured")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Document-Grounded Chatbot API")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Document-Grounded Chatbot API is running"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "assistant_configured": bool(settings.ASSISTANT_ID),
        "vector_store_configured": bool(settings.VECTOR_STORE_ID),
        "setup_required": not (settings.ASSISTANT_ID and settings.VECTOR_STORE_ID),
        "setup_command": "python setup.py" if not (settings.ASSISTANT_ID and settings.VECTOR_STORE_ID) else None
    }

# Authentication Endpoints
@app.post("/api/auth/register", response_model=AuthResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        result = user_db.register_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password
        )
        
        if result["success"]:
            # Create session token
            session_token = user_db.create_user_session(user_data.username)
            
            return AuthResponse(
                success=True,
                message=result["message"],
                user_data=UserResponse(
                    user_id=result["user_id"],
                    username=user_data.username,
                    email=user_data.email
                ),
                session_token=session_token
            )
        else:
            return AuthResponse(
                success=False,
                message=result["message"]
            )
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/auth/login", response_model=AuthResponse)
async def login_user(login_data: UserLogin):
    """Login user"""
    try:
        result = user_db.authenticate_user(
            username=login_data.username,
            password=login_data.password
        )
        
        if result["success"]:
            # Create session token
            session_token = user_db.create_user_session(login_data.username)
            
            return AuthResponse(
                success=True,
                message=result["message"],
                user_data=UserResponse(**result["user_data"]),
                session_token=session_token
            )
        else:
            return AuthResponse(
                success=False,
                message=result["message"]
            )
    except Exception as e:
        logger.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: SessionUser = Depends(get_current_user)):
    """Get current user information"""
    user_data = user_db.get_user_by_username(current_user.username)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        user_id=user_data["user_id"],
        username=user_data["username"],
        email=user_data["email"],
        chats=user_data.get("chats", {})
    )

@app.post("/api/auth/logout")
async def logout_user(current_user: SessionUser = Depends(get_current_user)):
    """Logout user (invalidate session)"""
    try:
        user_data = user_db.get_user_by_username(current_user.username)
        if user_data:
            user_data.pop("session_token", None)
            user_data.pop("session_expires", None)
            user_db._save_users()
        
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Error logging out user: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

# Chat Management Endpoints
@app.post("/api/chats", response_model=ChatResponse)
async def create_chat(chat_data: ChatCreate, current_user: SessionUser = Depends(get_current_user)):
    """Create a new chat for the current user"""
    try:
        chat_id = user_db.create_user_chat(current_user.username, chat_data.title)
        if not chat_id:
            raise HTTPException(status_code=500, detail="Failed to create chat")
        
        # Get the created chat data
        user_chats = user_db.get_user_chats(current_user.username)
        chat_info = user_chats[chat_id]
        
        return ChatResponse(
            chat_id=chat_id,
            title=chat_info["title"],
            created_at=chat_info["created_at"],
            last_message_at=chat_info.get("last_message_at"),
            message_count=chat_info.get("message_count", 0)
        )
    except Exception as e:
        logger.error(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating chat: {str(e)}")

@app.get("/api/chats", response_model=ChatListResponse)
async def get_user_chats(current_user: SessionUser = Depends(get_current_user)):
    """Get all chats for the current user"""
    try:
        user_chats = user_db.get_user_chats(current_user.username)
        
        # Convert to list and sort by last_message_at (most recent first)
        chats_list = []
        for chat_id, chat_data in user_chats.items():
            chats_list.append(ChatResponse(
                chat_id=chat_id,
                title=chat_data["title"],
                created_at=chat_data["created_at"],
                last_message_at=chat_data.get("last_message_at"),
                message_count=chat_data.get("message_count", 0)
            ))
        
        # Sort by last_message_at (most recent first), then by created_at
        chats_list.sort(key=lambda x: x.last_message_at or x.created_at, reverse=True)
        
        return ChatListResponse(chats=chats_list)
    except Exception as e:
        logger.error(f"Error getting user chats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting chats: {str(e)}")

@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str, current_user: SessionUser = Depends(get_current_user)):
    """Delete a chat for the current user"""
    try:
        success = user_db.delete_user_chat(current_user.username, chat_id)
        if not success:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return {"success": True, "message": "Chat deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting chat: {str(e)}")

@app.put("/api/chats/{chat_id}/title")
async def update_chat_title(chat_id: str, title_data: dict, current_user: SessionUser = Depends(get_current_user)):
    """Update chat title"""
    try:
        new_title = title_data.get("title")
        if not new_title:
            raise HTTPException(status_code=400, detail="Title is required")
        
        success = user_db.update_chat_title(current_user.username, chat_id, new_title)
        if not success:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        return {"success": True, "message": "Chat title updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating chat title: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating chat title: {str(e)}")

# File upload endpoint removed - files are now automatically uploaded during setup

@app.post("/api/thread", response_model=ThreadResponse)
async def create_thread(current_user: SessionUser = Depends(get_current_user)):
    """Create a new conversation thread for the current user"""
    try:
        thread = openai_client.create_thread()
        
        # Update user's thread ID in database
        user_db.update_user_thread(current_user.username, thread.id)
        
        return ThreadResponse(thread_id=thread.id)
    except Exception as e:
        logger.error(f"Error creating thread: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating thread: {str(e)}")

@app.post("/api/chat", response_model=ChatMessageResponse)
async def chat(message_data: ChatMessageWithId, current_user: SessionUser = Depends(get_current_user)):
    """Handle chat messages for a specific chat"""
    try:
        if not message_data.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        if not settings.ASSISTANT_ID:
            raise HTTPException(
                status_code=500, 
                detail="Assistant not configured. Please set ASSISTANT_ID environment variable."
            )
        
        # Get user's chats
        user_chats = user_db.get_user_chats(current_user.username)
        if message_data.chat_id not in user_chats:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        chat_data = user_chats[message_data.chat_id]
        thread_id = message_data.thread_id or chat_data.get("thread_id")
        
        if not thread_id:
            # Create new thread for this chat
            thread = openai_client.create_thread()
            thread_id = thread.id
            # Update chat's thread ID in database
            user_db.update_chat_thread(current_user.username, message_data.chat_id, thread_id)
        
        # Send message and get response
        reply = openai_client.send_message(thread_id, message_data.message)
        
        # Update chat's last message timestamp
        user_db.update_chat_last_message(current_user.username, message_data.chat_id)
        
        return ChatMessageResponse(reply=reply, thread_id=thread_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

# Setup endpoints removed for security - use setup.py script instead

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
