#!/usr/bin/env python3
"""
Development server runner for the Document-Grounded Chatbot backend.
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Check if required environment variables are set
    required_vars = ["OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease run the setup script first: python setup.py")
        exit(1)
    
    # Check if vector store and assistant are configured
    if not os.getenv("VECTOR_STORE_ID") or not os.getenv("ASSISTANT_ID"):
        print("⚠️  Warning: Vector store or assistant not configured.")
        print("Run the setup script to create them: python setup.py")
        print("Continuing anyway...")
    
    print("🚀 Starting Document-Grounded Chatbot backend...")
    print("📡 API will be available at: http://localhost:8001")
    print("📚 API documentation at: http://localhost:8001/docs")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
