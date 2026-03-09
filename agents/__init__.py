from agents.base_agent import BaseAgent
from agents.requirement_analyst import RequirementAnalyst
from agents.architect import Architect
from agents.ui_designer import UIDesigner
from agents.ux_designer import UXDesigner
from agents.developer import Developer
from agents.tester import Tester
from agents.arrodes import Arrodes
from agents.product_manager import ProductManager

# 所有可用的 Agent 角色注册表（塔罗会成员映射）
AGENT_REGISTRY = {
    "product_manager": {
        "class": ProductManager,
        "name": "产品经理",
        "icon": "🎯",
        "description": "产品规划、项目管理、优先级决策、里程碑把控",
        "meeting_name": "「正义」·奥黛丽",
        "meeting_icon": "⚖️",
        "meeting_title": "旁观者途径",
        "meeting_desc": "洞察人心、读取情绪、把控产品方向与项目节奏",
    },
    "requirement_analyst": {
        "class": RequirementAnalyst,
        "name": "需求分析师",
        "icon": "📋",
        "description": "分析和梳理用户需求，输出需求文档",
        "meeting_name": "「隐者」·卡特莉雅",
        "meeting_icon": "📖",
        "meeting_title": "隐者途径",
        "meeting_desc": "博学善析、解读隐藏信息、从混乱中提炼真实需求",
    },
    "architect": {
        "class": Architect,
        "name": "架构设计师",
        "icon": "🏗️",
        "description": "设计系统架构，规划技术方案",
        "meeting_name": "「愚者」·克莱恩",
        "meeting_icon": "🌫️",
        "meeting_title": "占卜家→诡秘之主途径",
        "meeting_desc": "灰雾之上统御全局、设计规则、构建世界结构与边界",
    },
    "ui_designer": {
        "class": UIDesigner,
        "name": "UI设计师",
        "icon": "🎨",
        "description": "设计用户界面，规划视觉风格",
        "meeting_name": "「魔术师」·佛尔思",
        "meeting_icon": "🚪",
        "meeting_title": "门途径·学徒",
        "meeting_desc": "想象力丰富、打开视觉之门、将灵感化为界面",
    },
    "ux_designer": {
        "class": UXDesigner,
        "name": "UX设计师",
        "icon": "🧩",
        "description": "优化用户体验，设计交互流程",
        "meeting_name": "「星星」·伦纳德",
        "meeting_icon": "⭐",
        "meeting_title": "黑夜途径",
        "meeting_desc": "洞悉暗处细节、守护用户体验之路",
    },
    "developer": {
        "class": Developer,
        "name": "代码工程师",
        "icon": "💻",
        "description": "编写代码，实现技术方案",
        "meeting_name": "「太阳」·德里克",
        "meeting_icon": "☀️",
        "meeting_title": "日光途径",
        "meeting_desc": "坚韧务实、以光明之力锻造代码、将设计铸成现实",
    },
    "tester": {
        "class": Tester,
        "name": "测试工程师",
        "icon": "🧪",
        "description": "制定测试方案，发现潜在问题",
        "meeting_name": "「审判」·希欧",
        "meeting_icon": "⚔️",
        "meeting_title": "仲裁人途径",
        "meeting_desc": "裁决对错、审判缺陷、验证规则是否被正确执行",
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
