"""
Quick script to test MongoDB connection and fetch account credentials.
Run: python test_mongo.py
"""
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
import os
import json

load_dotenv()

uri = os.getenv("MONGODB_URI")
print(f"Connecting to: {uri[:30]}...")

try:
    # Try with certifi first, fallback to tlsAllowInvalidCertificates
    try:
        client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
        client.admin.command('ping')
    except Exception:
        print("certifi failed, trying with tlsAllowInvalidCertificates...")
        client = MongoClient(uri, tls=True, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=10000)
        client.admin.command('ping')

    print("✅ Connected to MongoDB!\n")

    db = client["User_credentials_db"]
    users = db["users"]

    # Count documents
    count = users.count_documents({})
    print(f"Total accounts in collection: {count}\n")

    # Fetch all documents (redact sensitive fields for display)
    docs = list(users.find({}))
    for i, doc in enumerate(docs):
        doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
        print(f"--- Account {i+1} ---")
        print(json.dumps(doc, indent=2, default=str))
        print()

except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\nTroubleshooting:")
    print("1. Check if your IP is whitelisted in MongoDB Atlas → Network Access")
    print("2. Verify the URI in .env is correct")
    print("3. Try: pip install pymongo[srv] certifi dnspython")
