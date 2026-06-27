from flask import Blueprint, request, jsonify
from services.deepseek_service import deepseek_client
import logging

ai_bp = Blueprint('ai', __name__)
logger = logging.getLogger(__name__)


@ai_bp.route('/ai/chat', methods=['POST'])
def chat():
    """
    AI Chat endpoint – accepts a user message and optional context,
    returns a conservation-aware response from DeepSeek.

    Request body:
    {
        "message": "What is a safe alternative for endangered plants?",
        "context": {
            "plant": "Sarpagandha",
            "status": "Endangered",
            "uses": "hypertension, anxiety"
        }
    }

    Response:
    {
        "query": "What is a safe alternative for endangered plants?",
        "response": "AI response here...",
        "model": "deepseek-chat",
        "status": "success"
    }
    """
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Missing 'message' field"}), 400

        user_msg = data['message'].strip()
        if not user_msg:
            return jsonify({"error": "Message cannot be empty"}), 400

        # Validate message length (prevent abuse)
        if len(user_msg) > 2000:
            return jsonify({"error": "Message too long (max 2000 characters)"}), 400

        # Optional context from plant search
        context = data.get('context', {})

        logger.info(f"Chat request: {user_msg[:100]}...")
        result = deepseek_client.generate_response(user_msg, context)

        return jsonify({
            "query": user_msg,
            "response": result["response"],
            "model": result.get("model_used"),
            "status": result.get("status", "success")
        }), 200

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return jsonify({
            "error": "Internal server error",
            "status": "error"
        }), 500


@ai_bp.route('/ai/health', methods=['GET'])
def ai_health():
    """
    Check AI service health – returns status of DeepSeek integration.

    Response:
    {
        "ai_service": "ok" or "disabled",
        "model": "deepseek-chat",
        "message": "AI service is ready" or "AI service not configured"
    }
    """
    if deepseek_client.client is None:
        return jsonify({
            "ai_service": "disabled",
            "model": None,
            "message": "AI service not configured. Set DEEPSEEK_API_KEY in .env"
        }), 200

    return jsonify({
        "ai_service": "ok",
        "model": deepseek_client.model,
        "message": "AI service is ready"
    }), 200
