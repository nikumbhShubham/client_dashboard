"""
Account Routes — CRUD for trading accounts
"""
import logging
from flask import Blueprint, request, jsonify
from services import mongo_service, fivepaisa_service

logger = logging.getLogger(__name__)

accounts_bp = Blueprint("accounts", __name__)


@accounts_bp.route("/api/v1/accounts", methods=["GET"])
def list_accounts():
    """List all trading accounts from MongoDB"""
    docs = mongo_service.get_all_accounts()

    # Map to frontend-expected format
    accounts_list = []
    for doc in docs:
        cc = doc.get("client_code", "")
        is_logged_in = cc in fivepaisa_service.accounts
        accounts_list.append({
            "account_id": cc,
            "owner_id": 1,
            "broker_name": "FIVEPAISA",
            "nickname": doc.get("display_name", doc.get("NAME", "")),
            "trading_login_id": cc,
            "is_enabled": is_logged_in,
            "is_validated": is_logged_in,
            "is_paid": True,
            "created_at": "",
            "updated_at": "",
        })

    return jsonify({
        "accounts": accounts_list,
        "total": len(accounts_list)
    })


@accounts_bp.route("/api/v1/accounts", methods=["POST"])
def create_account():
    """Add a new trading account to MongoDB and login"""
    data = request.get_json()
    logger.info(f"--- Recieved POST /api/v1/accounts ---")
    logger.info(f"Payload: {data}")
    
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        logger.info(f"Adding account for client_code: {data.get('client_code')}")
        doc = mongo_service.add_account(data)

        # Try to login the new account immediately
        logged_in = fivepaisa_service.login_single_account(doc)

        return jsonify({
            "account_id": doc.get("client_code", ""),
            "owner_id": 1,
            "broker_name": "FIVEPAISA",
            "nickname": doc.get("display_name", doc.get("NAME", "")),
            "trading_login_id": doc.get("client_code", ""),
            "is_enabled": logged_in,
            "is_validated": logged_in,
            "is_paid": True,
            "created_at": "",
            "updated_at": "",
            "message": "Account added and logged in" if logged_in else "Account added but login failed"
        }), 201

    except ValueError as e:
        logger.warning(f"Validation Error: {str(e)}")
        code = "ALREADY_EXISTS" if "already exists" in str(e) else "MISSING_FIELDS"
        return jsonify({"error": code, "message": str(e)}), 400
    except Exception as e:
        logger.error(f"Create account error: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to create account", "message": str(e)}), 500


@accounts_bp.route("/api/v1/accounts/<client_code>", methods=["DELETE"])
def delete_account(client_code):
    """Delete a trading account from MongoDB and remove session"""
    try:
        mongo_service.delete_account(client_code)
        fivepaisa_service.remove_account_session(client_code)
        return jsonify({"message": f"Account {client_code} deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Delete account error: {e}")
        return jsonify({"error": "Failed to delete account"}), 500


@accounts_bp.route("/api/v1/accounts/validate", methods=["POST"])
def validate_account():
    """Validate account credentials by attempting login"""
    data = request.get_json()
    if not data:
        return jsonify({"valid": False, "message": "No data provided", "broker": ""}), 400

    try:
        result = fivepaisa_service.login_account(data)
        if result:
            return jsonify({
                "valid": True,
                "message": f"Login successful for {data.get('display_name', data.get('NAME', 'account'))}",
                "broker": "FIVEPAISA"
            })
        else:
            return jsonify({
                "valid": False,
                "message": "Login failed — check credentials",
                "broker": "FIVEPAISA"
            })
    except Exception as e:
        return jsonify({
            "valid": False,
            "message": str(e),
            "broker": "FIVEPAISA"
        })
