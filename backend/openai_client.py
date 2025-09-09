import os
from openai import OpenAI
from config import settings
import logging

logger = logging.getLogger(__name__)

class OpenAIClient:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required")
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.assistant_id = settings.ASSISTANT_ID
        self.vector_store_id = settings.VECTOR_STORE_ID

    def create_vector_store(self, name: str = "document_store"):
        """Create a new vector store"""
        try:
            vector_store = self.client.beta.vector_stores.create(name=name)
            logger.info(f"Created vector store: {vector_store.id}")
            return vector_store
        except Exception as e:
            logger.error(f"Error creating vector store: {e}")
            raise

    def upload_files_to_vector_store(self, file_paths: list):
        """Upload files to the vector store"""
        try:
            if not self.vector_store_id:
                raise ValueError("VECTOR_STORE_ID is required")
            
            # Open files and upload
            files = []
            for file_path in file_paths:
                if os.path.exists(file_path):
                    files.append(open(file_path, "rb"))
                else:
                    logger.warning(f"File not found: {file_path}")
            
            if not files:
                raise ValueError("No valid files to upload")
            
            # Upload files to vector store
            batch = self.client.beta.vector_stores.file_batches.upload_and_poll(
                vector_store_id=self.vector_store_id,
                files=files
            )
            
            # Close file handles
            for file in files:
                file.close()
            
            logger.info(f"Uploaded {len(files)} files to vector store")
            return batch
        except Exception as e:
            logger.error(f"Error uploading files: {e}")
            raise

    def create_assistant(self, name: str = "Document Assistant"):
        """Create an assistant with file search capabilities"""
        try:
            if not self.vector_store_id:
                raise ValueError("VECTOR_STORE_ID is required")
            
            assistant = self.client.beta.assistants.create(
                name=name,
                model="gpt-4o-mini",
                instructions=(
                    "You are a document-grounded chatbot that only answers questions based on the provided documents. "
                    "When a user asks a question:\n"
                    "1. Search through the uploaded documents to find relevant information\n"
                    "2. If you find relevant information, provide a comprehensive answer with citations\n"
                    "3. If the question cannot be answered from the documents or is irrelevant, "
                    "reply strictly: 'Out of context. Please ask based on the uploaded documents.'\n"
                    "4. Always be helpful but stay within the scope of the provided documents."
                ),
                tools=[{"type": "file_search"}],
                tool_resources={
                    "file_search": {
                        "vector_store_ids": [self.vector_store_id]
                    }
                }
            )
            logger.info(f"Created assistant: {assistant.id}")
            return assistant
        except Exception as e:
            logger.error(f"Error creating assistant: {e}")
            raise

    def create_thread(self):
        """Create a new conversation thread"""
        try:
            thread = self.client.beta.threads.create()
            logger.info(f"Created thread: {thread.id}")
            return thread
        except Exception as e:
            logger.error(f"Error creating thread: {e}")
            raise

    def send_message(self, thread_id: str, message: str):
        """Send a message to the assistant and get response"""
        try:
            # Add user message to thread
            self.client.beta.threads.messages.create(
                thread_id=thread_id,
                role="user",
                content=message
            )

            # Run the assistant
            run = self.client.beta.threads.runs.create_and_poll(
                thread_id=thread_id,
                assistant_id=self.assistant_id
            )

            # Check if run was successful
            if run.status != "completed":
                logger.error(f"Run failed with status: {run.status}")
                return "Sorry, I encountered an error processing your request."

            # Get the latest assistant message
            messages = self.client.beta.threads.messages.list(thread_id=thread_id)
            assistant_messages = [m for m in messages.data if m.role == "assistant"]
            
            if not assistant_messages:
                return "Out of context. Please ask based on the uploaded documents."

            latest_message = assistant_messages[0]
            reply = ""
            
            # Extract text content from the message
            for content in latest_message.content:
                if content.type == "text":
                    reply += content.text.value

            # Check if the response indicates no relevant information was found
            if not reply.strip() or "out of context" in reply.lower():
                return "Out of context. Please ask based on the uploaded documents."

            return reply.strip()
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return "Sorry, I encountered an error processing your request."

# Global client instance
openai_client = OpenAIClient()
