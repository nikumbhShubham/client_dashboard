"""
Margins Route — Real-time margin data across all accounts
"""
import asyncio
import logging
from flask import Blueprint, jsonify
from services import fivepaisa_service

logger = logging.getLogger(__name__)

margins_bp = Blueprint("margins", __name__)


@margins_bp.route("/api/v1/accounts/margins", methods=["GET"])
def get_margins():
    """Get margin data for all logged-in accounts"""
    logger.info(f"--- Fetching Margins ({len(fivepaisa_service.accounts)} accounts) ---")
    if not fivepaisa_service.accounts:
        return jsonify({"margins": [], "total_accounts": 0})

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        margins_data = loop.run_until_complete(fivepaisa_service.fetch_all_margins_async())
        loop.close()
    except Exception as e:
        logger.error(f"Margin fetch error: {e}")
        return jsonify({"margins": [], "total_accounts": 0, "error": str(e)})

    return jsonify({
        "margins": margins_data,
        "total_accounts": len(margins_data)
    })
