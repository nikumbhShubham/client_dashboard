"""
5paisa Service — Login, Position Fetch, Margin Fetch
Extracted from realtime_paisa_fetcher.py
"""
import asyncio
import httpx
import pyotp
import time
import logging
import json
from py5paisa import FivePaisaClient
from config import FIVEPAISA_BASE

logger = logging.getLogger(__name__)

# In-memory logged-in accounts: { client_code: { name, access_token, user_key, client_code } }
accounts = {}


# ── Login ──

def login_account(acc):
    """
    Login one 5paisa account using py5paisa SDK get_totp_session()
    Returns account info dict or None on failure.
    """
    name = acc.get("NAME", "Unknown")
    client_code = str(acc.get("client_code", ""))

    if not client_code:
        logger.warning(f"Skipping {name}: no client_code")
        return None

    try:
        cred = {
            "APP_NAME": acc.get("APP_NAME", ""),
            "APP_SOURCE": str(acc.get("APP_SOURCE", "")),
            "USER_ID": acc.get("USER_ID", ""),
            "PASSWORD": acc.get("PASSWORD", ""),
            "USER_KEY": acc.get("USER_KEY", ""),
            "ENCRYPTION_KEY": acc.get("ENCRYPTION_KEY", ""),
        }

        totp_secret = acc.get("totp_secret", "")
        mpin = acc.get("mpin", "")

        if not totp_secret or not mpin:
            logger.warning(f"Skipping {name}: missing totp_secret or mpin")
            return None

        totp = pyotp.TOTP(totp_secret.strip()).now()
        client = FivePaisaClient(cred=cred)
        client.get_totp_session(
            client_code=client_code,
            totp=totp,
            pin=mpin
        )

        access_token = getattr(client, 'Jwt_token', None) or getattr(client, 'access_token', None)

        if not access_token:
            logger.error(f"  ❌ {name} ({client_code}) — no access token after login. Response status: {getattr(client, 'Status', 'N/A')}. Message: {getattr(client, 'Message', 'N/A')}")
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


def login_all_accounts(account_docs, max_retries=3, retry_delay=5):
    """
    Login all accounts from MongoDB docs.
    Retries failed accounts up to max_retries times with retry_delay seconds between attempts.
    """
    global accounts

    if not account_docs:
        logger.error("No accounts to login")
        return

    logger.info(f"Logging into {len(account_docs)} accounts...")

    # First attempt
    failed = []
    for acc in account_docs:
        result = login_account(acc)
        if result:
            accounts[result["client_code"]] = result
        else:
            failed.append(acc)

    # Retry failed accounts
    retry = 0
    while failed and retry < max_retries:
        retry += 1
        logger.info(f"⏳ Retrying {len(failed)} failed account(s) in {retry_delay}s... (attempt {retry}/{max_retries})")
        time.sleep(retry_delay)

        still_failed = []
        for acc in failed:
            result = login_account(acc)
            if result:
                accounts[result["client_code"]] = result
            else:
                still_failed.append(acc)
        failed = still_failed

    if failed:
        failed_names = [acc.get("NAME", "?") for acc in failed]
        logger.warning(f"⚠️ Still failed after {max_retries} retries: {', '.join(failed_names)}")

    logger.info(f"🎯 Successfully logged into {len(accounts)}/{len(account_docs)} accounts")


def login_single_account(acc_doc):
    """Login a single newly-added account and add to the in-memory dict"""
    result = login_account(acc_doc)
    if result:
        accounts[result["client_code"]] = result
        return True
    return False


def remove_account_session(client_code):
    """Remove a logged-in account from the in-memory dict"""
    if client_code in accounts:
        del accounts[client_code]
        logger.info(f"Removed session for {client_code}")


# ── Positions ──

async def fetch_positions_raw(account_info, http_client):
    """Fetch positions for one account using raw httpx POST"""
    code = account_info["client_code"]
    name = account_info["name"]

    try:
        payload = {
            "head": {"key": account_info["user_key"]},
            "body": {"ClientCode": code}
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
    """Fetch positions for ALL accounts in parallel"""
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=5.0),
        verify=False,
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
    ) as http_client:
        tasks = [fetch_positions_raw(info, http_client) for info in accounts.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    return [r for r in results if isinstance(r, dict)]


# ── Margins ──

async def fetch_margin_raw(account_info, http_client):
    """Fetch margin for one account using raw httpx POST to 5paisa V3/Margin"""
    code = account_info["client_code"]
    name = account_info["name"]

    try:
        payload = {
            "head": {"key": account_info["user_key"]},
            "body": {"ClientCode": code}
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
                "account_id": int(code) if code.isdigit() else 0,
                "broker_name": "FIVEPAISA",
                "nickname": name,
                "trading_login_id": code,
                "equity": {"enabled": False, "net": 0, "available": {}, "utilised": {}},
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }

        data = response.json()
        margin_list = data.get("body", {}).get("EquityMargin", [])
        eq = margin_list[0] if margin_list else {}

        available_cash = float(eq.get("ALB", 0))
        opening_balance = float(eq.get("TCV", 0))
        collateral = float(eq.get("Collateral", 0))
        utilized = float(eq.get("MrgnUsd", 0))
        exposure = float(eq.get("Exposure", 0))
        span = float(eq.get("Span", 0))
        net = available_cash - utilized

        return {
            "account_id": int(code) if code.isdigit() else 0,
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
            "account_id": int(code) if code.isdigit() else 0,
            "broker_name": "FIVEPAISA",
            "nickname": name,
            "trading_login_id": code,
            "equity": {"enabled": False, "net": 0, "available": {}, "utilised": {}},
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%S"),
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

# ── Orders ──

async def fetch_orders_raw(account_info, http_client):
    """Fetch order book for one account using raw httpx POST"""
    code = account_info["client_code"]
    name = account_info["name"]

    try:
        payload = {
            "head": {"key": account_info["user_key"]},
            "body": {"ClientCode": code}
        }

        # V2/OrderBook is the standard endpoint
        response = await http_client.post(
            f"{FIVEPAISA_BASE}/V2/OrderBook",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {account_info['access_token']}"
            },
            timeout=10.0
        )

        if response.status_code != 200:
            logger.error(f"Orders API error for {name}: {response.status_code}")
            return []

        data = response.json()
        raw_orders = data.get("body", {}).get("OrderBookDetail", [])
        
        if raw_orders:
            print(f"\n--- [DEBUG] RAW ORDERS FROM 5PAISA ({name}) ---")
            print(json.dumps(raw_orders, indent=4))
            print("--- [DEBUG] END RAW ORDERS ---\n")

        if raw_orders:
            try:
                with open("e:/automation_frontend/backend/raw_order_debug.json", "w") as f:
                    json.dump(raw_orders[0], f, indent=4)
            except:
                pass
            logger.info(f"DEBUG: Sample Order Data saved to raw_order_debug.json")

        import re
        from datetime import datetime
        orders = []
        
        def parse_5paisa_date(date_str):
            if not date_str or "315513000000" in str(date_str):
                return "--:--:--"
            try:
                # User's hack: extract milliseconds using regex
                match = re.search(r'(\d+)', str(date_str))
                if match:
                    timestamp = int(match.group(1))
                    dt = datetime.fromtimestamp(timestamp / 1000)
                    return dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception as e:
                logger.debug(f"Date parse failed for {date_str}: {e}")
            return str(date_str)

        for o in raw_orders:
            # Try multiple fields for time as 5paisa can be inconsistent
            rt = o.get("OrderDateTime") or o.get("BrokerOrderTime") or o.get("ExchOrderTime") or o.get("OrderTime") or ""
            order_time = parse_5paisa_date(rt)
            
            # 5paisa Order ID Mapping: ExchOrderID (if not 0) > BrokerOrderId > RemoteOrderID
            ex_id = str(o.get("ExOrderIDS") or o.get("ExchOrderID") or "")
            if ex_id == "0": ex_id = ""
            broker_id = str(o.get("BrokerOrderId") or "")
            remote_id = str(o.get("RemoteOrderID") or "")
            
            # Price/Rate mapping
            price = o.get("Price") or o.get("Rate") or 0
            qty = o.get("Qty") or o.get("PendingQty") or 0

            unique_id = ex_id if ex_id else (broker_id if broker_id else (remote_id if remote_id else f"{code}-{o.get('ScripCode')}-{qty}-{price}-{o.get('BuySell')}"))

            orders.append({
                "order_id": unique_id,
                "symbol": o.get("ScripName") or "Unknown",
                "scripCode": o.get("ScripCode"),
                "qty": qty,
                "price": price,
                "status": o.get("OrderStatus") or "Unknown",
                "side": o.get("BuySell") or "", # 'B' or 'S'
                "time": order_time,
                "account": name,
                "client_code": code,
                "exchange": o.get("Exch") or "",
                "type": o.get("OrderType") or o.get("ScripType") or "",
                "remote_id": remote_id
            })
        return orders
    except Exception as e:
        logger.error(f"Order fetch error for {name}: {e}")
        return []


async def fetch_all_orders_async():
    """Fetch orders for ALL accounts in parallel"""
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=5.0),
        verify=False,
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
    ) as http_client:
        tasks = [fetch_orders_raw(info, http_client) for info in accounts.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    # Flatten results (list of lists)
    all_orders = []
    for r in results:
        if isinstance(r, list):
            all_orders.extend(r)
    return all_orders
