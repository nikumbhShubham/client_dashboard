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
    Accepts either nested format (credentials sub-object) or flat format.
    New document format:
      { credentials: {APP_NAME, APP_SOURCE, USER_ID, PASSWORD, USER_KEY, ENCRYPTION_KEY},
        totp_secret, mpin, client_code, display_name, is_active, lot_multiplier }
    """
    # Support both nested and flat payload formats
    creds = data.get("credentials", {})
    credential_fields = ["APP_NAME", "APP_SOURCE", "USER_ID", "PASSWORD", "USER_KEY", "ENCRYPTION_KEY"]

    # If credentials sub-object is provided, use it; otherwise read flat fields
    for f in credential_fields:
        if not creds.get(f):
            creds[f] = data.get(f, "")

    display_name = data.get("display_name", data.get("NAME", ""))
    totp_secret = data.get("totp_secret", "")
    mpin = data.get("mpin", "")
    client_code = data.get("client_code", "")

    # Validate all required fields
    missing = []
    for f in credential_fields:
        if not creds.get(f):
            missing.append(f"credentials.{f}")
    if not display_name:
        missing.append("display_name")
    if not totp_secret:
        missing.append("totp_secret")
    if not mpin:
        missing.append("mpin")
    if not client_code:
        missing.append("client_code")

    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    # Check if client_code already exists
    existing = get_account_by_client_code(client_code)
    if existing:
        raise ValueError(f"Account with client_code {client_code} already exists")

    try:
        db = get_mongo_db()
        doc = {
            "credentials": {f: str(creds[f]) for f in credential_fields},
            "totp_secret": str(totp_secret),
            "mpin": str(mpin),
            "client_code": str(client_code),
            "display_name": str(display_name),
            "is_active": data.get("is_active", True),
            "lot_multiplier": data.get("lot_multiplier", 1),
        }
        result = db["users"].insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        logger.info(f"Added account: {doc['display_name']} ({doc['client_code']})")
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
