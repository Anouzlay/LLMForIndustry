import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ASSISTANT_ID: str = os.getenv("ASSISTANT_ID", "")
    VECTOR_STORE_ID: str = os.getenv("VECTOR_STORE_ID", "")
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3001,http://localhost:5173").split(",")
    
    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".txt", ".docx", ".md", ".json", ".csv"}

settings = Settings()
