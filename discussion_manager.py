"""
讨论记录管理器
管理会议讨论的保存、检索和加载
"""
import os
import json
from datetime import datetime

DISCUSSIONS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "discussions")


def ensure_dir():
    """确保讨论记录目录存在"""
    os.makedirs(DISCUSSIONS_ROOT, exist_ok=True)


def save_discussion(topic: str, messages: list, summary: str = "") -> dict:
    """
    保存一次讨论记录
    - topic: 讨论议题
    - messages: 消息列表 [{"name": "...", "icon": "...", "role": "...", "content": "..."}]
    - summary: 阿罗德斯的总结（可选）
    返回: {"id": "...", "path": "...", "markdown_path": "..."}
    """
    ensure_dir()

    timestamp = datetime.now()
    disc_id = timestamp.strftime("%Y%m%d_%H%M%S")
    folder = os.path.join(DISCUSSIONS_ROOT, disc_id)
    os.makedirs(folder, exist_ok=True)

    # 保存原始数据 (JSON)
    data = {
        "id": disc_id,
        "topic": topic,
        "created_at": timestamp.isoformat(),
        "messages": messages,
        "summary": summary,
    }
    json_path = os.path.join(folder, "discussion.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 生成 Markdown 文件
    md_content = generate_markdown(topic, messages, summary, timestamp)
    md_path = os.path.join(folder, "会议纪要.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    return {
        "id": disc_id,
        "path": folder,
        "markdown_path": md_path,
    }


def generate_markdown(topic: str, messages: list, summary: str, timestamp: datetime) -> str:
    """生成讨论记录的 Markdown 文件"""
    time_str = timestamp.strftime("%Y年%m月%d日 %H:%M")

    md = f"""# 🌫️ 灰雾之上 · 圆桌会议记录

> **议题**: {topic}
> **时间**: {time_str}
> **参与者**: {', '.join(set(m.get('name', '未知') for m in messages if m.get('role') != 'user'))}

---

## 📝 讨论全文

"""

    for msg in messages:
        name = msg.get("name", "未知")
        icon = msg.get("icon", "")
        content = msg.get("content", "")
        role = msg.get("role", "")

        if role == "user":
            md += f"### 👤 **你**\n\n{content}\n\n---\n\n"
        else:
            title = msg.get("meeting_title", "")
            title_str = f" *({title})*" if title else ""
            md += f"### {icon} **{name}**{title_str}\n\n{content}\n\n---\n\n"

    if summary:
        md += f"""## 🪞 阿罗德斯的总结

{summary}
"""

    return md


def list_discussions() -> list:
    """列出所有讨论记录"""
    ensure_dir()
    discussions = []

    for name in sorted(os.listdir(DISCUSSIONS_ROOT), reverse=True):
        folder = os.path.join(DISCUSSIONS_ROOT, name)
        json_path = os.path.join(folder, "discussion.json")

        if not os.path.isfile(json_path):
            continue

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            msg_count = len([m for m in data.get("messages", []) if m.get("role") != "user"])
            discussions.append({
                "id": data.get("id", name),
                "topic": data.get("topic", "未知议题"),
                "created_at": data.get("created_at", ""),
                "display_time": _format_time(data.get("created_at", "")),
                "message_count": msg_count,
                "has_summary": bool(data.get("summary")),
            })
        except (json.JSONDecodeError, KeyError):
            continue

    return discussions


def load_discussion(disc_id: str) -> dict:
    """加载一条完整的讨论记录"""
    folder = os.path.join(DISCUSSIONS_ROOT, disc_id)
    json_path = os.path.join(folder, "discussion.json")

    if not os.path.isfile(json_path):
        return {"error": f"讨论记录 {disc_id} 不存在"}

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data


def get_markdown(disc_id: str) -> dict:
    """获取讨论记录的 Markdown 内容"""
    folder = os.path.join(DISCUSSIONS_ROOT, disc_id)
    md_path = os.path.join(folder, "会议纪要.md")

    if not os.path.isfile(md_path):
        return {"error": "Markdown 文件不存在"}

    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    return {"content": content, "path": md_path}


def update_summary(disc_id: str, summary: str):
    """更新讨论的总结内容"""
    folder = os.path.join(DISCUSSIONS_ROOT, disc_id)
    json_path = os.path.join(folder, "discussion.json")

    if not os.path.isfile(json_path):
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    data["summary"] = summary
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 重新生成 Markdown
    timestamp = datetime.fromisoformat(data["created_at"])
    md_content = generate_markdown(data["topic"], data["messages"], summary, timestamp)
    md_path = os.path.join(folder, "会议纪要.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)


def _format_time(iso_str: str) -> str:
    """将 ISO 时间格式化为显示时间"""
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%m月%d日 %H:%M")
    except (ValueError, TypeError):
        return "未知时间"
