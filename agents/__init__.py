from agents.base_agent import BaseAgent
from agents.requirement_analyst import RequirementAnalyst
from agents.architect import Architect
from agents.ui_designer import UIDesigner
from agents.ux_designer import UXDesigner
from agents.developer import Developer
from agents.tester import Tester

# 所有可用的 Agent 角色注册表
AGENT_REGISTRY = {
    "requirement_analyst": {
        "class": RequirementAnalyst,
        "name": "需求分析师",
        "icon": "📋",
        "description": "分析和梳理用户需求，输出需求文档"
    },
    "architect": {
        "class": Architect,
        "name": "架构设计师",
        "icon": "🏗️",
        "description": "设计系统架构，规划技术方案"
    },
    "ui_designer": {
        "class": UIDesigner,
        "name": "UI设计师",
        "icon": "🎨",
        "description": "设计用户界面，规划视觉风格"
    },
    "ux_designer": {
        "class": UXDesigner,
        "name": "UX设计师",
        "icon": "🧩",
        "description": "优化用户体验，设计交互流程"
    },
    "developer": {
        "class": Developer,
        "name": "代码工程师",
        "icon": "💻",
        "description": "编写代码，实现技术方案"
    },
    "tester": {
        "class": Tester,
        "name": "测试工程师",
        "icon": "🧪",
        "description": "制定测试方案，发现潜在问题"
    }
}


def get_agent(agent_id: str) -> BaseAgent:
    """根据 agent_id 获取对应的 Agent 实例"""
    if agent_id not in AGENT_REGISTRY:
        raise ValueError(f"未知的 Agent: {agent_id}")
    return AGENT_REGISTRY[agent_id]["class"]()


def get_all_agents_info() -> list:
    """获取所有 Agent 的信息列表"""
    return [
        {
            "id": agent_id,
            "name": info["name"],
            "icon": info["icon"],
            "description": info["description"]
        }
        for agent_id, info in AGENT_REGISTRY.items()
    ]
