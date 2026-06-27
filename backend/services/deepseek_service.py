import logging
from openai import OpenAI
from config import DEEPSEEK_API_KEY, DEEPSEEK_MODEL, DEEPSEEK_BASE_URL

logger = logging.getLogger(__name__)

# ============================================================
# HIDDEN SYSTEM PROMPT – never exposed to the frontend
# ============================================================
SYSTEM_PROMPT = """
You are HerbHeal Compass AI, a conservation-aware medicinal plant assistant.
Your core mission:
1. Educate users about medicinal plants while strongly prioritizing biodiversity protection.
2. Whenever a user mentions an endangered or vulnerable species, immediately suggest safer, sustainable alternatives (by genus, family, or similar uses).
3. Always include a clear disclaimer: "This is for educational purposes only. Consult a qualified healthcare provider before using any plant."
4. If you don't know, say "I don't have enough information" – never invent data.
5. Refer to the IUCN Red List status when relevant.
6. Keep responses concise, friendly, and actionable.
7. Never recommend illegal or harmful practices.
Your tone is empathetic, authoritative, and rooted in science.
"""


class DeepSeekClient:
    def __init__(self):
        if not DEEPSEEK_API_KEY:
            logger.warning("DEEPSEEK_API_KEY not set. AI features will be disabled.")
            self.client = None
        else:
            self.client = OpenAI(
                api_key=DEEPSEEK_API_KEY,
                base_url=DEEPSEEK_BASE_URL
            )
        self.model = DEEPSEEK_MODEL

    def generate_response(self, user_message: str, context: dict = None) -> dict:
        """
        Call DeepSeek with the hidden system prompt.
        Optionally include context (e.g., plant name, uses) to ground the answer.
        Returns dict with 'response' and 'model_used'.
        """
        if not self.client:
            return {
                "response": "AI service is not configured. Please set DEEPSEEK_API_KEY in your .env file.",
                "model_used": None,
                "status": "disabled"
            }

        # Build messages: system + optional context + user message
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        # If context is provided, inject it as additional context
        if context:
            context_parts = []
            if context.get("plant"):
                context_parts.append(f"Plant: {context['plant']}")
            if context.get("status"):
                context_parts.append(f"IUCN Status: {context['status']}")
            if context.get("uses"):
                context_parts.append(f"Traditional Uses: {context['uses']}")
            if context_parts:
                context_str = "Relevant context: " + " | ".join(context_parts)
                messages.append({"role": "user", "content": context_str})

        messages.append({"role": "user", "content": user_message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            reply = response.choices[0].message.content
            logger.info(f"DeepSeek response generated for query: {user_message[:50]}...")
            return {
                "response": reply,
                "model_used": self.model,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"DeepSeek API error: {e}")
            return {
                "response": "Sorry, I couldn't process your request right now. Please try again later.",
                "model_used": None,
                "status": "error",
                "error": str(e)
            }


# Singleton instance
deepseek_client = DeepSeekClient()
