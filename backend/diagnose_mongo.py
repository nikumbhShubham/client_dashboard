"""
Diagnostic: Validate MongoDB account documents and TOTP generation
Checks field presence and TOTP format WITHOUT displaying any credential values
"""
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
import pyotp
import os

load_dotenv()

uri = os.getenv("MONGODB_URI")

try:
    try:
        mongo = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
        mongo.admin.command("ping")
    except Exception:
        mongo = MongoClient(uri, tls=True, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=10000)
        mongo.admin.command("ping")

    print("✅ Connected to MongoDB\n")

    db = mongo["trading_db"]
    docs = list(db["users"].find({}))
    print(f"Total accounts: {len(docs)}\n")

    required_fields = ["NAME", "APP_NAME", "APP_SOURCE", "USER_ID", "PASSWORD", 
                       "USER_KEY", "ENCRYPTION_KEY", "totp_secret", "mpin", "client_code"]

    for i, doc in enumerate(docs):
        name = doc.get("NAME", "Unknown")
        cc = doc.get("client_code", "???")
        print(f"--- Account {i+1}: {name} ({cc}) ---")
        
        # Check all required fields exist and are non-empty
        for field in required_fields:
            val = doc.get(field)
            if val is None:
                print(f"  ❌ MISSING: {field}")
            elif str(val).strip() == "":
                print(f"  ⚠️  EMPTY: {field}")
            else:
                # Show length and type, not the value
                print(f"  ✅ {field}: present (len={len(str(val).strip())}, type={type(val).__name__})")
        
        # Validate TOTP secret is valid base32
        totp_secret = doc.get("totp_secret", "")
        if totp_secret:
            try:
                totp_val = pyotp.TOTP(totp_secret.strip()).now()
                print(f"  🔑 TOTP generated successfully: {totp_val}")
            except Exception as e:
                print(f"  ❌ TOTP generation FAILED: {e}")
        
        # Check field types
        app_source = doc.get("APP_SOURCE")
        if app_source and not isinstance(app_source, str):
            print(f"  ⚠️  APP_SOURCE is {type(app_source).__name__}, should be str")
        
        client_code = doc.get("client_code")
        if client_code and not isinstance(client_code, str):
            print(f"  ⚠️  client_code is {type(client_code).__name__}, should be str")
        
        mpin = doc.get("mpin")
        if mpin and not isinstance(mpin, str):
            print(f"  ⚠️  mpin is {type(mpin).__name__}, should be str")
        
        print()

    mongo.close()

except Exception as e:
    print(f"❌ Error: {e}")
