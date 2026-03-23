"""
Backend Configuration
- MongoDB connection
- Environment variables
"""
import os
import certifi
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI")
FIVEPAISA_BASE = "https://Openapi.5paisa.com/VendorsAPI/Service1.svc"

# MongoDB connection (lazy init)
_mongo_client = None


def get_mongo_db():
    """Get MongoDB database connection"""
    global _mongo_client
    if _mongo_client is None:
        uri = MONGODB_URI
        if not uri:
            raise RuntimeError("MONGODB_URI not set in .env")
        try:
            _mongo_client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
            _mongo_client.admin.command("ping")
        except Exception:
            _mongo_client = MongoClient(uri, tls=True, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=10000)
            _mongo_client.admin.command("ping")
        logger.info("MongoDB connected")
    return _mongo_client["trading_db"]
