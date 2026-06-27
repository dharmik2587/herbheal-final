import os

from dotenv import load_dotenv

load_dotenv()

IUCN_API_TOKEN = os.environ.get("IUCN_API_TOKEN", "")
USDA_API_KEY = os.environ.get("USDA_API_KEY", "")
FLASK_ENV = os.environ.get("FLASK_ENV", "development")
PORT = int(os.environ.get("PORT", 5000))

_origins = os.environ.get("ALLOWED_ORIGINS", "*").strip()
ALLOWED_ORIGINS = [o.strip() for o in _origins.split(",") if o.strip()] or ["*"]

# DeepSeek AI Configuration
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
