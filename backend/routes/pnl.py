"""
PnL Route — Real-time PnL across all accounts
"""
import asyncio
import time
import logging
from flask import Blueprint, jsonify
from services import fivepaisa_service

logger = logging.getLogger(__name__)

pnl_bp = Blueprint("pnl", __name__)


@pnl_bp.route("/api/v1/realtime/pnl", methods=["GET"])
def get_pnl():
    """Aggregated PnL across all accounts — positions fetched in parallel"""
    logger.info(f"--- Polling PnL ({len(fivepaisa_service.accounts)} accounts) ---")
    if not fivepaisa_service.accounts:
        return jsonify({"status": "No Accounts", "total_m2m": 0, "total_pnl": 0, "accounts": [], "positions": []})

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        accounts_data = loop.run_until_complete(fivepaisa_service.fetch_all_positions_async())
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
        "total_accounts": len(fivepaisa_service.accounts),
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
    })
