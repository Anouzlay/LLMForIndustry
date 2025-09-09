# 🚀 Quick Start Guide

## What You've Built

A complete **Document-Grounded Chatbot** system with:

✅ **Backend**: FastAPI with OpenAI Assistants API integration  
✅ **Frontend**: React + TypeScript with modern UI  
✅ **RAG System**: Vector Store for document retrieval  
✅ **Guardrails**: Automatic "Out of context" detection  
✅ **File Upload**: Support for multiple document types  
✅ **Chat Interface**: Real-time conversation with thread management  

## 🏃‍♂️ Quick Start (3 Steps)

### 1. Add Your Documents
```bash
# Add your document files to the docs folder
cd backend
mkdir -p docs
# Copy your PDF, TXT, DOCX, MD, JSON, CSV files to docs/
```

### 2. Initialize System (One Command!)
```bash
cd backend
python setup.py
# This creates .env file, validates API key, uploads docs, and sets up everything
```

### 3. Start Application
```bash
# Option A: Use startup script (recommended)
./start.sh  # Linux/Mac
start.bat   # Windows

# Option B: Manual start
# Terminal 1: Backend
cd backend && python run.py

# Terminal 2: Frontend  
cd frontend && npm run dev
```

## 🎯 How to Use

1. **Add Documents**: Place files in `backend/docs/` folder
2. **Run Setup**: Execute `python setup.py` to process documents
3. **Start Chatting**: Open app and ask questions about your documents
4. **Get Answers**: AI searches your docs and provides relevant answers
5. **Out-of-Context**: Ask unrelated questions → get "Out of context" response

## 📁 Key Files Created

### Backend
- `main.py` - FastAPI application with all endpoints
- `openai_client.py` - OpenAI integration with vector store
- `setup.py` - One-time setup script
- `config.py` - Environment configuration

### Frontend  
- `App.tsx` - Main application with chat interface
- `ChatInterface.tsx` - Chat UI with out-of-context handling
- `api.ts` - API service layer

## 🔧 API Endpoints

- `POST /api/chat` - Send message, get AI response  
- `POST /api/thread` - Create conversation thread
- Files are automatically processed during setup (no upload endpoints)

## 🛡️ Out-of-Context Protection

The system has **3 layers** of protection:

1. **Assistant Instructions**: Clear prompts to refuse unrelated questions
2. **Response Analysis**: Detects "out of context" in AI responses  
3. **UI Indicators**: Visual warnings for irrelevant questions

## 📊 Supported Files

- PDF, TXT, DOCX, MD, JSON, CSV
- Max 50MB per file
- Automatic file validation

## 🎉 You're Ready!

Your document-grounded chatbot is now ready to:
- Accept document uploads
- Answer questions based on your files
- Handle out-of-context questions gracefully
- Provide a modern chat experience

**Access your app at**: http://localhost:3001
