#!/usr/bin/env python3
"""
Clean Vector Store Script
This script removes all files from a vector store to give you a fresh start.
"""

import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

def clean_vector_store(vector_store_id=None):
    """Clean all files from a vector store"""
    
    # Get vector store ID
    if not vector_store_id:
        vector_store_id = os.getenv("VECTOR_STORE_ID")
    
    if not vector_store_id:
        print("❌ Error: No vector store ID found")
        print("Make sure you have run 'python setup.py' first to create a vector store")
        print("Or provide vector store ID as argument: python clean_vector_store.py <vector_store_id>")
        sys.exit(1)
    
    # Check for OpenAI API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: OPENAI_API_KEY not found in environment variables")
        sys.exit(1)
    
    print(f"🧹 Cleaning Vector Store: {vector_store_id}")
    print("=" * 50)
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    try:
        # Get all files in the vector store
        print("📋 Getting list of files in vector store...")
        files = client.beta.vector_stores.files.list(vector_store_id=vector_store_id)
        
        if not files.data:
            print("✅ Vector store is already empty - no files to remove")
            return
        
        print(f"📁 Found {len(files.data)} files to remove:")
        for file in files.data:
            print(f"   - {file.id}")
        
        # Remove each file
        print("\n🗑️  Removing files...")
        removed_count = 0
        for file in files.data:
            try:
                client.beta.vector_stores.files.delete(
                    vector_store_id=vector_store_id,
                    file_id=file.id
                )
                removed_count += 1
                print(f"   ✅ Removed file: {file.id}")
            except Exception as e:
                print(f"   ❌ Error removing file {file.id}: {e}")
        
        print(f"\n🎉 Cleanup completed!")
        print(f"   Files removed: {removed_count}/{len(files.data)}")
        print(f"   Vector store is now empty and ready for fresh uploads")
        
    except Exception as e:
        print(f"❌ Error cleaning vector store: {e}")
        sys.exit(1)

def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Vector store ID provided as argument
        vector_store_id = sys.argv[1]
        clean_vector_store(vector_store_id)
    else:
        # Use vector store ID from environment
        clean_vector_store()

if __name__ == "__main__":
    main()
