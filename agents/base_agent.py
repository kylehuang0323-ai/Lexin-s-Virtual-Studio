"""
BaseAgent - 所有 AI Agent 的基类
封装了 DeepSeek API (OpenAI 兼容接口) 的调用逻辑
"""
from openai import OpenAI
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

        # 客户端延迟初始化，支持按用户传入 API Key
        self._client = None
        self._api_key = None

    def set_api_key(self, api_key: str):
        """设置用户专属 API Key，重建客户端"""
        if api_key and api_key != self._api_key:
            self._api_key = api_key
            self._client = OpenAI(
                api_key=api_key,
                base_url=config.GROQ_BASE_URL,
            )

    @property
    def client(self):
        """获取 OpenAI 客户端，优先使用用户 Key，否则用全局配置"""
        if self._client:
            return self._client
        if not hasattr(self, '_default_client'):
            self._default_client = OpenAI(
                api_key=config.GROQ_API_KEY,
                base_url=config.GROQ_BASE_URL,
            )
        return self._default_client

    def _build_system_prompt(self) -> str:
        """构建系统提示词，子类可以重写"""
        return f"""你是一位专业的{self.name}，在 My Studio 中工作。
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
            # 构建 OpenAI 格式的消息列表
            messages = [{"role": "system", "content": self.system_prompt}]

            # 添加对话历史（最近10轮）
            for msg in self.conversation_history[-10:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

            # 添加当前用户消息
            messages.append({"role": "user", "content": user_message})

            # 调用 DeepSeek API
            response = self.client.chat.completions.create(
                model=config.AI_MODEL,
                messages=messages,
            )

            assistant_reply = response.choices[0].message.content

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
