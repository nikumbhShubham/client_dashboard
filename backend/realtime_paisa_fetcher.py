"""
Multi-Account Real-time 5paisa PnL Fetcher
- Login: py5paisa SDK get_totp_session() (same as fivepaisa_simple_login.py)
- Positions: raw httpx POST to NetPositionNetWise (same as fivepaisa_position_adapter.py)
- Credentials: MongoDB (Cluster0 > trading_db > users)
- Position fetching runs in parallel using asyncio.gather()
"""
import asyncio
import httpx
import pyotp
import time
import os
import certifi
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from py5paisa import FivePaisaClient
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

FIVEPAISA_BASE = "https://Openapi.5paisa.com/VendorsAPI/Service1.svc"

# Logged-in accounts: { client_code: { name, access_token, user_key, client_code } }
accounts = {}


# ── MongoDB ──

def load_accounts_from_mongo():
    """Fetch all account docs from MongoDB (Cluster0 > trading_db > users)"""
    uri = os.getenv("MONGODB_URI")
    if not uri:
        logger.error("MONGODB_URI not set in .env")
        return []
    try:
        try:
            mongo = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
            mongo.admin.command("ping")
        except Exception:
            mongo = MongoClient(uri, tls=True, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=10000)
            mongo.admin.command("ping")

        db = mongo["trading_db"]
        docs = list(db["users"].find({}))
        logger.info(f"Found {len(docs)} accounts in MongoDB")
        mongo.close()
        return docs
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return []


# ── Login using py5paisa SDK (same as fivepaisa_simple_login.py) ──

def login_account_sdk(acc):
    """
    Login one 5paisa account using py5paisa SDK get_totp_session()
    Exact same approach as backend/app/services/login/fivepaisa_simple_login.py
    """
    name = acc.get("display_name", acc.get("NAME", "Unknown"))
    client_code = str(acc.get("client_code", ""))

    if not client_code:
        logger.warning(f"Skipping {name}: no client_code")
        return None

    try:
        # Support both nested credentials format and flat format
        creds_obj = acc.get("credentials", {})
        cred = {
            "APP_NAME": creds_obj.get("APP_NAME", acc.get("APP_NAME", "")),
            "APP_SOURCE": str(creds_obj.get("APP_SOURCE", acc.get("APP_SOURCE", ""))),
            "USER_ID": creds_obj.get("USER_ID", acc.get("USER_ID", "")),
            "PASSWORD": creds_obj.get("PASSWORD", acc.get("PASSWORD", "")),
            "USER_KEY": creds_obj.get("USER_KEY", acc.get("USER_KEY", "")),
            "ENCRYPTION_KEY": creds_obj.get("ENCRYPTION_KEY", acc.get("ENCRYPTION_KEY", "")),
        }

        totp_secret = acc.get("totp_secret", "")
        mpin = acc.get("mpin", "")

        if not totp_secret or not mpin:
            logger.warning(f"Skipping {name}: missing totp_secret or mpin")
            return None

        # Generate TOTP
        totp = pyotp.TOTP(totp_secret.strip()).now()

        # Initialize client with credentials
        client = FivePaisaClient(cred=cred)

        # Login using get_totp_session()
        # Key mapping from fivepaisa_simple_login.py:
        #   client_code = trading_login_id (the actual numeric client code)
        #   totp = generated TOTP
        #   pin = mpin
        client.get_totp_session(
            client_code=client_code,
            totp=totp,
            pin=mpin
        )

        # Get the access token (try Jwt_token first, then access_token)
        access_token = getattr(client, 'Jwt_token', None) or getattr(client, 'access_token', None)

        if not access_token:
            logger.error(f"  ❌ {name} ({client_code}) — no access token after login")
            return None

        logger.info(f"  ✅ {name} ({client_code}) — logged in")

        return {
            "client_code": client_code,
            "name": name,
            "access_token": access_token,
            "user_key": cred["USER_KEY"],
        }

    except Exception as e:
        logger.error(f"  ❌ {name} ({client_code}) — error: {e}")
        return None


def login_all_accounts():
    """Login all accounts from MongoDB"""
    global accounts

    docs = load_accounts_from_mongo()
    if not docs:
        logger.error("No accounts found in MongoDB")
        return

    logger.info(f"Logging into {len(docs)} accounts...")

    for acc in docs:
        result = login_account_sdk(acc)
        if result:
            accounts[result["client_code"]] = result

    logger.info(f"🎯 Successfully logged into {len(accounts)}/{len(docs)} accounts")


# ── Raw HTTPX Position Fetch (same as fivepaisa_position_adapter.py) ──

async def fetch_positions_raw(account_info, http_client):
    """Fetch positions for one account using raw httpx POST — no SDK"""
    code = account_info["client_code"]
    name = account_info["name"]

    try:
        # Same payload as fivepaisa_position_adapter.py
        payload = {
            "head": {
                "key": account_info["user_key"]
            },
            "body": {
                "ClientCode": code
            }
        }

        response = await http_client.post(
            f"{FIVEPAISA_BASE}/V2/NetPositionNetWise",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {account_info['access_token']}"
            },
            timeout=10.0
        )

        if response.status_code != 200:
            logger.error(f"Positions API error for {name}: {response.status_code}")
            return {"client_code": code, "name": name, "status": "Error", "m2m": 0, "pnl": 0, "positions": []}

        data = response.json()
        raw_positions = data.get("body", {}).get("NetPositionDetail", [])

        if not raw_positions:
            return {"client_code": code, "name": name, "status": "Live", "m2m": 0, "pnl": 0, "positions": []}

        positions = []
        for pos in raw_positions:
            netqty = int(pos.get("NetQty", 0))
            positions.append({
                "symbol": pos.get("ScripName"),
                "scripCode": pos.get("ScripCode"),
                "netqty": netqty,
                "ltp": float(pos.get("LTP", 0)),
                "m2m": float(pos.get("MTOM", 0)),
                "pnl": float(pos.get("BookedPL", 0)),
                "buyqty": pos.get("BuyQty", 0),
                "sellqty": pos.get("SellQty", 0),
                "buyavg": float(pos.get("BuyAvgRate", 0)),
                "sellavg": float(pos.get("SellAvgRate", 0)),
                "direction": "LONG" if netqty > 0 else ("SHORT" if netqty < 0 else "FLAT"),
                "exchange": pos.get("Exchange", ""),
                "account": name,
                "client_code": code,
            })

        return {
            "client_code": code,
            "name": name,
            "status": "Live",
            "m2m": sum(p["m2m"] for p in positions),
            "pnl": sum(p["pnl"] for p in positions),
            "positions": positions,
        }
    except Exception as e:
        logger.error(f"Fetch error for {name}: {e}")
        return {"client_code": code, "name": name, "status": "Error", "m2m": 0, "pnl": 0, "positions": []}


async def fetch_all_positions_async():
    """Fetch positions for ALL accounts in parallel using httpx"""
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=5.0),
        verify=False,
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
    ) as http_client:
        tasks = [fetch_positions_raw(info, http_client) for info in accounts.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    return [r for r in results if isinstance(r, dict)]



@app.route("/api/realtime/pnl", methods=["GET"])
def get_pnl():
    """Aggregated PnL across all accounts — positions fetched in parallel"""
    if not accounts:
        return jsonify({"status": "No Accounts", "total_m2m": 0, "total_pnl": 0, "accounts": [], "positions": []})

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        accounts_data = loop.run_until_complete(fetch_all_positions_async())
        loop.close()
    except Exception as e:
        logger.error(f"Parallel fetch error: {e}")
        return jsonify({"status": "Error", "total_m2m": 0, "total_pnl": 0, "accounts": [], "positions": []})

    all_positions = []
    for a in accounts_data:
        all_positions.extend(a.get("positions", []))

    total_m2m = sum(a["m2m"] for a in accounts_data)
    total_pnl = sum(a["pnl"] for a in accounts_data)

    return jsonify({
        "status": "Live",
        "total_m2m": total_m2m,
        "total_pnl": total_pnl,
        "accounts": accounts_data,
        "positions": all_positions,
        "total_accounts": len(accounts),
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
    })


# ── Raw HTTPX Margin Fetch (5paisa V3/Margin API) ──

async def fetch_margin_raw(account_info, http_client):
    """Fetch margin for one account using raw httpx POST to 5paisa V3/Margin"""
    code = account_info["client_code"]
    name = account_info["name"]

    try:
        payload = {
            "head": {
                "key": account_info["user_key"]
            },
            "body": {
                "ClientCode": code
            }
        }

        response = await http_client.post(
            f"{FIVEPAISA_BASE}/V3/Margin",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {account_info['access_token']}"
            },
            timeout=10.0
        )

        if response.status_code != 200:
            logger.error(f"Margin API error for {name}: {response.status_code}")
            return {
                "account_id": int(code),
                "broker_name": "FIVEPAISA",
                "nickname": name,
                "trading_login_id": code,
                "equity": {"enabled": False, "net": 0, "available": {}, "utilised": {}},
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "error": f"API returned {response.status_code}"
            }

        data = response.json()
        margin_list = data.get("body", {}).get("EquityMargin", [])

        # Parse the margin fields from 5paisa response
        eq = margin_list[0] if margin_list else {}

        available_cash = float(eq.get("ALB", 0))  # Available Ledger Balance
        opening_balance = float(eq.get("TCV", 0))  # Total Collateral Value
        collateral = float(eq.get("Collateral", 0))
        utilized = float(eq.get("MrgnUsd", 0))  # Margin Used
        exposure = float(eq.get("Exposure", 0))
        span = float(eq.get("Span", 0))
        net = available_cash - utilized

        return {
            "account_id": int(code),
            "broker_name": "FIVEPAISA",
            "nickname": name,
            "trading_login_id": code,
            "equity": {
                "enabled": True,
                "net": net,
                "available": {
                    "cash": available_cash,
                    "opening_balance": opening_balance,
                    "live_balance": available_cash,
                    "collateral": collateral,
                    "adhoc_margin": 0,
                    "intraday_payin": 0
                },
                "utilised": {
                    "debits": utilized,
                    "exposure": exposure,
                    "m2m_realised": float(eq.get("RealizedMTOM", 0)),
                    "m2m_unrealised": float(eq.get("UnrealizedMTOM", 0)),
                    "option_premium": float(eq.get("OptionPremium", 0)),
                    "payout": 0,
                    "span": span,
                    "holding_sales": 0,
                    "turnover": 0,
                    "liquid_collateral": 0,
                    "stock_collateral": collateral,
                    "delivery": 0
                }
            },
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%S")
        }
    except Exception as e:
        logger.error(f"Margin fetch error for {name}: {e}")
        return {
            "account_id": int(code),
            "broker_name": "FIVEPAISA",
            "nickname": name,
            "trading_login_id": code,
            "equity": {"enabled": False, "net": 0, "available": {}, "utilised": {}},
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "error": str(e)
        }


async def fetch_all_margins_async():
    """Fetch margins for ALL accounts in parallel"""
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=5.0),
        verify=False,
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
    ) as http_client:
        tasks = [fetch_margin_raw(info, http_client) for info in accounts.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    return [r for r in results if isinstance(r, dict)]


@app.route("/api/v1/accounts/margins", methods=["GET"])
def get_margins():
    """Get margin data for all logged-in accounts"""
    if not accounts:
        return jsonify({"margins": [], "total_accounts": 0})

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        margins_data = loop.run_until_complete(fetch_all_margins_async())
        loop.close()
    except Exception as e:
        logger.error(f"Margin fetch error: {e}")
        return jsonify({"margins": [], "total_accounts": 0, "error": str(e)})

    return jsonify({
        "margins": margins_data,
        "total_accounts": len(margins_data)
    })


if __name__ == "__main__":
    login_all_accounts()
    if accounts:
        app.run(debug=False, port=8000)
    else:
        logger.error("No accounts logged in. Check MongoDB data and credentials.")
