"""Test login for one account from MongoDB"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from pymongo import MongoClient
from py5paisa import FivePaisaClient
from dotenv import load_dotenv
import certifi, os, pyotp

load_dotenv()

uri = os.getenv("MONGODB_URI")
mongo = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
db = mongo["trading_db"]
acc = db["users"].find_one()

name = acc.get("NAME", "?")
cc = str(acc.get("client_code", ""))
print(f"Testing: {name} ({cc})")

cred = {
    "APP_NAME": acc["APP_NAME"],
    "APP_SOURCE": str(acc["APP_SOURCE"]),
    "USER_ID": acc["USER_ID"],
    "PASSWORD": acc["PASSWORD"],
    "USER_KEY": acc["USER_KEY"],
    "ENCRYPTION_KEY": acc["ENCRYPTION_KEY"],
}

totp = pyotp.TOTP(acc["totp_secret"].strip()).now()
print(f"TOTP generated: {totp}")

client = FivePaisaClient(cred=cred)
print("FivePaisaClient initialized")

result = client.get_totp_session(cc, totp, acc["mpin"])
print(f"Login result: {result}")

token = getattr(client, "Jwt_token", None) or getattr(client, "access_token", None)
print(f"Has token: {bool(token)}")

if token:
    print("SUCCESS - Login works!")
else:
    print("FAILED - No token obtained")
    # Check if the TOTP might have expired during init
    totp2 = pyotp.TOTP(acc["totp_secret"].strip()).now()
    print(f"TOTP now: {totp2} (was {totp})")
    if totp != totp2:
        print("TOTP CHANGED between generation and login! Timing issue.")

mongo.close()
