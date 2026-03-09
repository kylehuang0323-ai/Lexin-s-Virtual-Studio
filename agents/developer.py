from agents.base_agent import BaseAgent
import config


class Developer(BaseAgent):
    """代码工程师 Agent - 具备项目文件生成和管理能力"""

    def __init__(self):
        self.name = "代码工程师"
        self.icon = "💻"
        self.role_description = """我是一位全栈代码工程师，擅长：
- 将设计方案转化为可运行的代码
- 编写高质量、可维护的代码
- 前端开发（HTML/CSS/JavaScript/React/Vue）
- 后端开发（Python/Node.js/Java）
- 数据库操作和 API 开发
- 代码优化和重构
- 编写完整的开发文档
- 规划项目文件结构并生成全部代码文件"""
        super().__init__()

    def _build_system_prompt(self) -> str:
        return f"""你是 My Studio 中的{self.name} {self.icon}。
{self.role_description}

你的工作方式：
1. 根据架构设计和需求文档编写代码
2. 提供具体的代码实现，包括：
   - 项目结构和文件组织
   - 核心模块的完整代码
   - 关键函数的实现逻辑
   - 数据库模型定义
   - API 接口实现
   - 前端页面实现
3. 代码规范：
   - 添加必要的注释（中文）
   - 遵循语言最佳实践
   - 考虑错误处理和边界情况
   - 提供代码运行说明
4. 始终使用中文回复，代码注释也用中文
"""

    def build_generate_prompt(self, requirement: str) -> str:
        """构建项目文件生成的专用提示词"""
        return f"""你是 My Studio 中的{self.name} {self.icon}。
{self.role_description}

现在你需要根据以下需求，完成两件事：

## 任务一：编写开发文档
编写一份完整的开发文档（Markdown 格式），包含：
1. 项目概述
2. 技术栈说明
3. 项目目录结构
4. 模块说明（每个文件的作用）
5. API 接口文档（如果有）
6. 数据库设计（如果有）
7. 部署和运行说明
8. 注意事项

## 任务二：生成项目所有代码文件
请生成项目的全部代码文件。每个文件必须使用以下固定格式输出：

<<<FILE: 相对路径/文件名>>>
文件的完整内容
<<<END_FILE>>>

例如：
<<<FILE: src/main.py>>>
# 主程序入口
print("Hello World")
<<<END_FILE>>>

<<<FILE: requirements.txt>>>
flask>=3.0.0
<<<END_FILE>>>

重要规则：
- 每个文件都必须用 <<<FILE: 路径>>> 和 <<<END_FILE>>> 包裹
- 路径使用正斜杠 /，不要用反斜杠
- 文件内容必须是完整可运行的代码，不要省略
- 先输出开发文档的内容，然后输出所有代码文件
- 使用中文注释

## 需求内容：
{requirement}
"""

    def generate_project(self, requirement: str) -> str:
        """生成整个项目的代码和文档"""
        try:
            prompt = self.build_generate_prompt(requirement)

            # 包含历史对话上下文
            context = ""
            if self.conversation_history:
                context = "[之前的讨论上下文]\n"
                for msg in self.conversation_history[-6:]:
                    role_label = "用户" if msg["role"] == "user" else self.name
                    context += f"{role_label}: {msg['content']}\n\n"

            full_prompt = context + prompt if context else prompt

            # 调用 DeepSeek API 生成项目
            response = self.client.chat.completions.create(
                model=config.AI_MODEL,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": full_prompt},
                ],
                max_tokens=8192,
            )

            result = response.choices[0].message.content

            # 保存到对话历史
            self.conversation_history.append({
                "role": "user",
                "content": f"[生成项目] {requirement}"
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": result
            })

            return result

        except Exception as e:
            return f"生成项目时出错: {str(e)}"
