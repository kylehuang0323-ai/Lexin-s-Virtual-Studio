import os
from dotenv import load_dotenv

load_dotenv()

# Groq API 配置
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# AI 模型名称
AI_MODEL = "llama-3.3-70b-versatile"

# Flask 配置
SECRET_KEY = os.getenv("SECRET_KEY", "virtual-studio-secret-key")
DEBUG = True
