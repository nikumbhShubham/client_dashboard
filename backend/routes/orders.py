"""
Orders Route — Real-time order book across all accounts
"""
import asyncio
import logging
from flask import Blueprint, jsonify
from services import fivepaisa_service

logger = logging.getLogger(__name__)

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/api/v1/realtime/orders", methods=["GET"])
def get_orders():
    """Aggregated Order Book across all accounts"""
    logger.info(f"--- Polling Orders ({len(fivepaisa_service.accounts)} accounts) ---")
    
    if not fivepaisa_service.accounts:
        return jsonify({"status": "No Accounts", "orders": []})

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        all_orders = loop.run_until_complete(fivepaisa_service.fetch_all_orders_async())
        loop.close()
    except Exception as e:
        logger.error(f"Parallel order fetch error: {e}")
        return jsonify({"status": "Error", "orders": [], "error": str(e)})

    return jsonify({
        "status": "Live",
        "orders": all_orders,
        "total_orders": len(all_orders),
        "total_accounts": len(fivepaisa_service.accounts)
    })
