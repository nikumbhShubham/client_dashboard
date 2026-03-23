
import asyncio
import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Simulate the fetch logic
async def debug_fetch():
    # Use the first account from the environment or common knowledge if possible
    # Since I don't have the full env here, I'll try to read the mongo db for one account
    from pymongo import MongoClient
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    db = client["trading_db"]
    account = db["accounts"].find_one({"enabled": True})
    
    if not account:
        print("No enabled account found in DB")
        return

    print(f"Testing with account: {account['client_code']}")
    
    # We need access_token. Usually it's in a cache or we need to login.
    # But since the app is running, maybe I can just print the 'fivepaisa_service.accounts' if I could import it.
    # Instead, let's just use the 'accounts' dict from the running service if possible? No.
    
    # Okay, let's try to find the 'access_token' in the DB if stored there
    access_token = account.get("access_token") 
    user_key = account.get("user_key")
    
    if not access_token or not user_key:
        print("Access token or User Key missing in DB")
        return

    payload = {
        "head": {"key": user_key},
        "body": {"ClientCode": account['client_code']}
    }

    async with httpx.AsyncClient() as http_client:
        response = await http_client.post(
            "https://openapi.5paisa.com/VendorsAPI/Service1.svc/V2/OrderBook",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        raw_orders = data.get("body", {}).get("OrderBookDetail", [])
        if raw_orders:
            print("RAW SAMPLE ORDER:")
            print(json.dumps(raw_orders[0], indent=2))
        else:
            print("No orders found in response")
            print(f"Full response: {data}")

if __name__ == "__main__":
    asyncio.run(debug_fetch())
