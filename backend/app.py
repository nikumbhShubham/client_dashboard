"""
StockSphere Backend — Flask API Server
Entry point: python app.py
"""
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from services import mongo_service, fivepaisa_service
from routes.accounts import accounts_bp
from routes.pnl import pnl_bp
from routes.margins import margins_bp
from routes.orders import orders_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler("backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Register route blueprints
app.register_blueprint(accounts_bp)
app.register_blueprint(pnl_bp)
app.register_blueprint(margins_bp)
app.register_blueprint(orders_bp)

@app.before_request
def log_request_info():
    logger.info(f">>> Request: {request.method} {request.url}")
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            logger.info(f"    Data: {request.get_data().decode('utf-8')[:500]}")
        except:
            pass

@app.after_request
def log_response_info(response):
    if response.status_code != 200:
        logger.warning(f"<<< Response: {response.status}")
    else:
        logger.info(f"<<< Response: {response.status}")
    return response

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"ping": "pong", "identity": "StockSphere_Backend_v1"})

@app.errorhandler(400)
def handle_400(e):
    logger.error(f"400 Error: {e.description}")
    return jsonify({
        "error": "BAD_REQUEST",
        "message": str(e.description),
        "source": "StockSphere_Backend"
    }), 400


@app.route("/api/health", methods=["GET"])
def health():
    return {
        "status": "ok",
        "logged_in_accounts": len(fivepaisa_service.accounts),
    }


def startup():
    """Load accounts from MongoDB and login all"""
    logger.info("=" * 50)
    logger.info("StockSphere Backend Starting...")
    logger.info("=" * 50)

    # Load accounts from MongoDB
    account_docs = mongo_service.get_all_accounts()

    if not account_docs:
        logger.warning("No accounts found in MongoDB. Start adding accounts via the UI.")
        return

    # Login all accounts with retry (3 retries, 5s delay)
    fivepaisa_service.login_all_accounts(account_docs, max_retries=3, retry_delay=5)


if __name__ == "__main__":
    startup()
    logger.info(f"Starting server on port 8000...")
    app.run(debug=False, host="0.0.0.0", port=8000)
