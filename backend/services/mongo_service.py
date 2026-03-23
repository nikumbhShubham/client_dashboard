"""
MongoDB Service — CRUD operations for trading_db.users
"""
import logging
from bson import ObjectId
from config import get_mongo_db

logger = logging.getLogger(__name__)


def get_all_accounts():
    """Fetch all account docs from MongoDB"""
    try:
        db = get_mongo_db()
        docs = list(db["users"].find({}))
        for doc in docs:
            doc["_id"] = str(doc["_id"])
        logger.info(f"Found {len(docs)} accounts in MongoDB")
        return docs
    except Exception as e:
        logger.error(f"Failed to fetch accounts: {e}")
        return []


def get_account_by_client_code(client_code):
    """Find a single account by client_code"""
    try:
        db = get_mongo_db()
        doc = db["users"].find_one({"client_code": str(client_code)})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        logger.error(f"Failed to fetch account {client_code}: {e}")
        return None


def add_account(data):
    """
    Insert a new account into MongoDB.
    Expected fields: NAME, APP_NAME, APP_SOURCE, USER_ID, PASSWORD,
                     USER_KEY, ENCRYPTION_KEY, totp_secret, mpin, client_code
    """
    required_fields = [
        "NAME", "APP_NAME", "APP_SOURCE", "USER_ID", "PASSWORD",
        "USER_KEY", "ENCRYPTION_KEY", "totp_secret", "mpin", "client_code"
    ]

    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    # Check if client_code already exists
    existing = get_account_by_client_code(data["client_code"])
    if existing:
        raise ValueError(f"Account with client_code {data['client_code']} already exists")

    try:
        db = get_mongo_db()
        # Only store the required fields (clean insert)
        doc = {field: str(data[field]) for field in required_fields}
        result = db["users"].insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        logger.info(f"Added account: {doc['NAME']} ({doc['client_code']})")
        return doc
    except Exception as e:
        logger.error(f"Failed to add account: {e}")
        raise


def delete_account(client_code):
    """Delete an account by client_code"""
    try:
        db = get_mongo_db()
        result = db["users"].delete_one({"client_code": str(client_code)})
        if result.deleted_count == 0:
            raise ValueError(f"Account with client_code {client_code} not found")
        logger.info(f"Deleted account: {client_code}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete account {client_code}: {e}")
        raise
