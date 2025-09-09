import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)

class UserDatabase:
    def __init__(self, db_file: str = "users.json"):
        self.db_file = db_file
        self.users = self._load_users()
    
    def _load_users(self) -> Dict:
        """Load users from JSON file"""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading users database: {e}")
                return {}
        return {}
    
    def _save_users(self):
        """Save users to JSON file"""
        try:
            with open(self.db_file, 'w') as f:
                json.dump(self.users, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving users database: {e}")
            raise
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256 with salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}:{password_hash}"
    
    def _verify_password(self, password: str, stored_hash: str) -> bool:
        """Verify password against stored hash"""
        try:
            salt, password_hash = stored_hash.split(':')
            test_hash = hashlib.sha256((password + salt).encode()).hexdigest()
            return test_hash == password_hash
        except:
            return False
    
    def _generate_session_token(self) -> str:
        """Generate a secure session token"""
        return secrets.token_urlsafe(32)
    
    def register_user(self, username: str, email: str, password: str) -> Dict:
        """Register a new user"""
        # Check if user already exists
        if username in self.users:
            return {"success": False, "message": "Username already exists"}
        
        # Check if email already exists
        for user_data in self.users.values():
            if user_data.get("email") == email:
                return {"success": False, "message": "Email already exists"}
        
        # Create new user
        user_id = secrets.token_urlsafe(16)
        hashed_password = self._hash_password(password)
        
        user_data = {
            "user_id": user_id,
            "username": username,
            "email": email,
            "password_hash": hashed_password,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "chats": {},  # Dictionary of chat_id -> chat_data
            "is_active": True
        }
        
        self.users[username] = user_data
        self._save_users()
        
        logger.info(f"New user registered: {username}")
        return {"success": True, "message": "User registered successfully", "user_id": user_id}
    
    def authenticate_user(self, username: str, password: str) -> Dict:
        """Authenticate user login"""
        if username not in self.users:
            return {"success": False, "message": "Invalid username or password"}
        
        user_data = self.users[username]
        
        if not user_data.get("is_active", True):
            return {"success": False, "message": "Account is deactivated"}
        
        if not self._verify_password(password, user_data["password_hash"]):
            return {"success": False, "message": "Invalid username or password"}
        
        # Update last login
        user_data["last_login"] = datetime.now().isoformat()
        self._save_users()
        
        logger.info(f"User authenticated: {username}")
        return {
            "success": True, 
            "message": "Login successful",
            "user_data": {
                "user_id": user_data["user_id"],
                "username": user_data["username"],
                "email": user_data["email"],
                "chats": user_data.get("chats", {})
            }
        }
    
    def create_user_session(self, username: str) -> str:
        """Create a session token for user"""
        session_token = self._generate_session_token()
        
        if username in self.users:
            user_data = self.users[username]
            user_data["session_token"] = session_token
            user_data["session_expires"] = (datetime.now() + timedelta(hours=24)).isoformat()
            self._save_users()
        
        return session_token
    
    def validate_session(self, session_token: str) -> Optional[Dict]:
        """Validate session token and return user data"""
        for username, user_data in self.users.items():
            if user_data.get("session_token") == session_token:
                # Check if session is expired
                try:
                    expires = datetime.fromisoformat(user_data.get("session_expires", ""))
                    if datetime.now() < expires:
                        return {
                            "username": username,
                            "user_id": user_data["user_id"],
                            "thread_id": user_data.get("thread_id")
                        }
                    else:
                        # Session expired, remove it
                        user_data.pop("session_token", None)
                        user_data.pop("session_expires", None)
                        self._save_users()
                except:
                    pass
        return None
    
    def create_user_chat(self, username: str, chat_title: str = "New Chat") -> str:
        """Create a new chat for user"""
        if username not in self.users:
            return None
        
        chat_id = secrets.token_urlsafe(16)
        chat_data = {
            "chat_id": chat_id,
            "title": chat_title,
            "thread_id": None,  # Will be created when first message is sent
            "created_at": datetime.now().isoformat(),
            "last_message_at": None,
            "message_count": 0
        }
        
        self.users[username]["chats"][chat_id] = chat_data
        self._save_users()
        
        logger.info(f"Created new chat for user {username}: {chat_id}")
        return chat_id
    
    def get_user_chats(self, username: str) -> dict:
        """Get all chats for a user"""
        if username not in self.users:
            return {}
        return self.users[username].get("chats", {})
    
    def update_chat_thread(self, username: str, chat_id: str, thread_id: str):
        """Update thread ID for a specific chat"""
        if username in self.users and chat_id in self.users[username].get("chats", {}):
            self.users[username]["chats"][chat_id]["thread_id"] = thread_id
            self._save_users()
    
    def update_chat_last_message(self, username: str, chat_id: str):
        """Update last message timestamp for a chat"""
        if username in self.users and chat_id in self.users[username].get("chats", {}):
            chat_data = self.users[username]["chats"][chat_id]
            chat_data["last_message_at"] = datetime.now().isoformat()
            chat_data["message_count"] = chat_data.get("message_count", 0) + 1
            self._save_users()
    
    def delete_user_chat(self, username: str, chat_id: str) -> bool:
        """Delete a chat for a user"""
        if username in self.users and chat_id in self.users[username].get("chats", {}):
            del self.users[username]["chats"][chat_id]
            self._save_users()
            logger.info(f"Deleted chat {chat_id} for user {username}")
            return True
        return False
    
    def update_chat_title(self, username: str, chat_id: str, new_title: str) -> bool:
        """Update chat title"""
        if username in self.users and chat_id in self.users[username].get("chats", {}):
            self.users[username]["chats"][chat_id]["title"] = new_title
            self._save_users()
            return True
        return False
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user data by username"""
        return self.users.get(username)
    
    def get_all_users(self) -> List[Dict]:
        """Get all users (for admin purposes)"""
        return [
            {
                "username": username,
                "email": user_data["email"],
                "created_at": user_data["created_at"],
                "last_login": user_data.get("last_login"),
                "is_active": user_data.get("is_active", True)
            }
            for username, user_data in self.users.items()
        ]
    
    def deactivate_user(self, username: str) -> bool:
        """Deactivate a user account"""
        if username in self.users:
            self.users[username]["is_active"] = False
            self._save_users()
            return True
        return False

# Global database instance
user_db = UserDatabase()
