# 🏢 虚拟工作室 (Virtual Studio)

一个基于 AI 多角色 Agent 的虚拟团队协作工作室。

## ✨ 功能特点

- **多角色 AI 团队**：内置 6 位专业 Agent，各司其职
  - 📋 需求分析师 - 梳理需求，输出需求文档
  - 🏗️ 架构设计师 - 设计系统架构，规划技术方案
  - 🎨 UI设计师 - 设计用户界面，规划视觉风格
  - 🧩 UX设计师 - 优化用户体验，设计交互流程
  - 💻 代码工程师 - 编写代码，实现技术方案
  - 🧪 测试工程师 - 制定测试方案，发现潜在问题

- **全员讨论模式**：一键让所有 Agent 同时分析你的想法
- **中文界面**：完全的中文对话体验
- **可扩展**：轻松添加新角色 Agent

## 🚀 快速开始

### 1. 获取 Gemini API Key

访问 [Google AI Studio](https://aistudio.google.com/apikey) 创建 API Key。

### 2. 配置环境

```bash
# 复制环境变量示例文件
copy .env.example .env

# 编辑 .env 文件，填入你的 API Key
# GEMINI_API_KEY=你的API_KEY
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 启动应用

```bash
python app.py
```

浏览器访问 http://localhost:5000 即可使用。

## 📁 项目结构

```
虚拟工作室/
├── app.py                 # Flask 主应用
├── config.py              # 配置文件
├── requirements.txt       # Python 依赖
├── .env.example           # 环境变量模板
├── agents/                # AI Agent 模块
│   ├── __init__.py        # Agent 注册表
│   ├── base_agent.py      # Agent 基类
│   ├── requirement_analyst.py
│   ├── architect.py
│   ├── ui_designer.py
│   ├── ux_designer.py
│   ├── developer.py
│   └── tester.py
├── static/
│   ├── css/style.css
│   └── js/chat.js
└── templates/
    └── index.html
```

## 🔧 添加新 Agent

1. 在 `agents/` 目录创建新文件，继承 `BaseAgent`
2. 在 `agents/__init__.py` 的 `AGENT_REGISTRY` 中注册

示例：
```python
from agents.base_agent import BaseAgent

class ProductManager(BaseAgent):
    def __init__(self):
        self.name = "产品经理"
        self.icon = "📊"
        self.role_description = "我是产品经理，负责..."
        super().__init__()
```
