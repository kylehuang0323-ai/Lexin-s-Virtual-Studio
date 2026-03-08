import os
from dotenv import load_dotenv

load_dotenv()

# Google Gemini API 配置
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "在这里填入你的 Gemini API Key")

# Gemini 模型名称
GEMINI_MODEL = "gemini-2.0-flash"

# Flask 配置
SECRET_KEY = os.getenv("SECRET_KEY", "virtual-studio-secret-key")
DEBUG = True
