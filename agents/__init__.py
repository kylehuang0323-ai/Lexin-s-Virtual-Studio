from agents.base_agent import BaseAgent
from agents.requirement_analyst import RequirementAnalyst
from agents.architect import Architect
from agents.ui_designer import UIDesigner
from agents.ux_designer import UXDesigner
from agents.developer import Developer
from agents.tester import Tester
from agents.arrodes import Arrodes

# 所有可用的 Agent 角色注册表
AGENT_REGISTRY = {
    "requirement_analyst": {
        "class": RequirementAnalyst,
        "name": "需求分析师",
        "icon": "📋",
        "description": "分析和梳理用户需求，输出需求文档",
        "meeting_name": "占卜家·克莱恩",
        "meeting_icon": "🔮",
        "meeting_title": "序列7·占卜家途径",
        "meeting_desc": "读取模糊需求、拆解隐含意图、从混乱信息中占卜真实目标",
    },
    "architect": {
        "class": Architect,
        "name": "架构设计师",
        "icon": "🏗️",
        "description": "设计系统架构，规划技术方案",
        "meeting_name": "诡秘之主·克莱恩",
        "meeting_icon": "👑",
        "meeting_title": "序列0·诡秘途径顶点",
        "meeting_desc": "统御全局、设计规则、构建世界结构与边界",
    },
    "ui_designer": {
        "class": UIDesigner,
        "name": "UI设计师",
        "icon": "🎨",
        "description": "设计用户界面，规划视觉风格",
        "meeting_name": "魔女·特莉丝",
        "meeting_icon": "🌙",
        "meeting_title": "魔女途径",
        "meeting_desc": "感知美感、情绪引导、视觉诱导与第一印象塑造",
    },
    "ux_designer": {
        "class": UXDesigner,
        "name": "UX设计师",
        "icon": "🧩",
        "description": "优化用户体验，设计交互流程",
        "meeting_name": "观众·奥黛丽",
        "meeting_icon": "👁️",
        "meeting_title": "观众途径",
        "meeting_desc": "洞察人心、理解用户心理与行为路径",
    },
    "developer": {
        "class": Developer,
        "name": "代码工程师",
        "icon": "💻",
        "description": "编写代码，实现技术方案",
        "meeting_name": "工匠·亚当",
        "meeting_icon": "🔨",
        "meeting_title": "门途径·工匠",
        "meeting_desc": "把抽象设计锻造成现实，稳定、可复用、可扩展",
    },
    "tester": {
        "class": Tester,
        "name": "测试工程师",
        "icon": "🧪",
        "description": "制定测试方案，发现潜在问题",
        "meeting_name": "审判者",
        "meeting_icon": "⚖️",
        "meeting_title": "仲裁人途径",
        "meeting_desc": "找出漏洞、裁决对错、验证规则是否被正确执行",
    },
    "arrodes": {
        "class": Arrodes,
        "name": "记录官·阿罗德斯",
        "icon": "🪞",
        "description": "记录讨论、总结会议、生成纪要",
        "meeting_name": "阿罗德斯",
        "meeting_icon": "🪞",
        "meeting_title": "魔镜1-42",
        "meeting_desc": "记录一切、总结一切，热情洋溢的神奇魔镜",
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


def get_meeting_agents_info() -> list:
    """获取会议室（诡秘之主主题）的 Agent 信息"""
    return [
        {
            "id": agent_id,
            "name": info["name"],
            "meeting_name": info["meeting_name"],
            "meeting_icon": info["meeting_icon"],
            "meeting_title": info["meeting_title"],
            "meeting_desc": info["meeting_desc"],
        }
        for agent_id, info in AGENT_REGISTRY.items()
    ]
