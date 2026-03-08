"""
BaseAgent - 所有 AI Agent 的基类
封装了 Google Gemini API (google-genai SDK) 的调用逻辑
"""
from google import genai
import config


class BaseAgent:
    """AI Agent 基类，所有角色 Agent 都继承自此类"""

    def __init__(self):
        # 仅在子类未设置时使用默认值（子类在 super().__init__() 前赋值）
        if not hasattr(self, 'name'):
            self.name = "基础Agent"
        if not hasattr(self, 'icon'):
            self.icon = "🤖"
        if not hasattr(self, 'role_description'):
            self.role_description = "我是一个通用的AI助手。"

        self.system_prompt = self._build_system_prompt()
        self.conversation_history = []

        # 初始化 Gemini 客户端
        self.client = genai.Client(api_key=config.GEMINI_API_KEY)

    def _build_system_prompt(self) -> str:
        """构建系统提示词，子类可以重写"""
        return f"""你是一位专业的{self.name}，在一个虚拟工作室中工作。
{self.role_description}

工作准则：
1. 始终使用中文回复
2. 回复要专业、具体、有建设性
3. 结合你的专业角色给出建议
4. 如果需要其他角色配合，请明确指出
5. 使用清晰的格式（标题、列表、代码块等）组织回复
"""

    def chat(self, user_message: str) -> str:
        """与 Agent 对话"""
        try:
            # 构建带有对话历史的消息
            messages = self._build_messages(user_message)

            # 调用 Gemini API
            response = self.client.models.generate_content(
                model=config.GEMINI_MODEL,
                contents=messages,
                config={
                    "system_instruction": self.system_prompt,
                }
            )

            assistant_reply = response.text

            # 保存对话历史
            self.conversation_history.append({
                "role": "user",
                "content": user_message
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_reply
            })

            return assistant_reply

        except Exception as e:
            error_msg = f"调用 AI 时出错: {str(e)}"
            return error_msg

    def _build_messages(self, user_message: str) -> str:
        """构建发送给模型的完整消息"""
        full_message = ""

        if self.conversation_history:
            full_message += "[历史对话]\n"
            for msg in self.conversation_history[-10:]:  # 保留最近10轮
                role_label = "用户" if msg["role"] == "user" else self.name
                full_message += f"{role_label}: {msg['content']}\n\n"

        full_message += f"[当前用户输入]\n{user_message}"
        return full_message

    def clear_history(self):
        """清除对话历史"""
        self.conversation_history = []

    def get_info(self) -> dict:
        """获取 Agent 信息"""
        return {
            "name": self.name,
            "icon": self.icon,
            "role_description": self.role_description
        }
