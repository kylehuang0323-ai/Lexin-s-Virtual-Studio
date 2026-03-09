"""
My Studio - 主应用
一个基于多 AI Agent 协作的 Web 应用（支持多用户）
"""
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import uuid
import config
from agents import get_agent, get_all_agents_info, get_meeting_agents_info
import file_manager
import discussion_manager
import user_manager

app = Flask(__name__)
app.secret_key = config.SECRET_KEY

# 存储每个会话的 Agent 实例
agent_instances = {}


# ========================================
# 认证中间件
# ========================================

def login_required(f):
    """登录保护装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            if request.is_json or request.path.startswith("/api/"):
                return jsonify({"error": "未登录", "need_login": True}), 401
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated


def get_user_api_key():
    """获取当前登录用户的 API Key"""
    user_id = session.get("user_id")
    if user_id:
        return user_manager.get_api_key(user_id)
    return ""


def ensure_session_id():
    """确保 session 中有 session_id"""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return session["session_id"]


def get_or_create_agent(session_id: str, agent_id: str):
    """获取或创建 Agent 实例，自动注入用户 API Key"""
    key = f"{session_id}_{agent_id}"
    if key not in agent_instances:
        agent_instances[key] = get_agent(agent_id)
    agent = agent_instances[key]
    # 注入当前用户的 API Key
    user_key = get_user_api_key()
    if user_key:
        agent.set_api_key(user_key)
    return agent


# ========================================
# 认证页面 & API
# ========================================

@app.route("/login")
def login_page():
    """登录/注册页面"""
    if "user_id" in session:
        return redirect(url_for("index"))
    return render_template("login.html")


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    """注册"""
    data = request.get_json()
    result = user_manager.register_user(
        username=data.get("username", ""),
        password=data.get("password", ""),
        display_name=data.get("display_name", ""),
    )
    if "error" in result:
        return jsonify(result), 400
    # 自动登录
    user = result["user"]
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["display_name"] = user["display_name"]
    session["session_id"] = str(uuid.uuid4())
    return jsonify({"ok": True, "user": user})


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    """登录"""
    data = request.get_json()
    result = user_manager.login_user(
        username=data.get("username", ""),
        password=data.get("password", ""),
    )
    if "error" in result:
        return jsonify(result), 400
    user = result["user"]
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["display_name"] = user["display_name"]
    session["session_id"] = str(uuid.uuid4())
    return jsonify({"ok": True, "user": user})


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    """登出"""
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/auth/me", methods=["GET"])
@login_required
def api_me():
    """获取当前用户信息"""
    return jsonify({
        "user": {
            "id": session["user_id"],
            "username": session["username"],
            "display_name": session["display_name"],
            "has_api_key": bool(get_user_api_key()),
            "masked_key": user_manager.get_masked_key(session["user_id"]),
        }
    })


@app.route("/api/auth/apikey", methods=["POST"])
@login_required
def api_save_key():
    """保存用户的 API Key"""
    data = request.get_json()
    api_key = data.get("api_key", "").strip()
    provider = data.get("provider", "groq")
    if not api_key:
        return jsonify({"error": "API Key 不能为空"}), 400
    user_manager.save_api_key(session["user_id"], api_key, provider)
    # 清除已缓存的 agent 实例，使新 key 生效
    sid = session.get("session_id", "")
    keys_to_remove = [k for k in agent_instances if k.startswith(sid)]
    for k in keys_to_remove:
        del agent_instances[k]
    return jsonify({"ok": True, "masked_key": user_manager.get_masked_key(session["user_id"])})


# ========================================
# 主页面
# ========================================

@app.route("/")
@login_required
def index():
    """主页 - 聊天界面"""
    return render_template("index.html")


@app.route("/api/agents", methods=["GET"])
@login_required
def list_agents():
    """获取所有可用的 Agent 列表"""
    return jsonify({"agents": get_all_agents_info()})


@app.route("/api/agents/meeting", methods=["GET"])
@login_required
def list_meeting_agents():
    """获取会议室角色信息"""
    return jsonify({"agents": get_meeting_agents_info()})


@app.route("/api/chat", methods=["POST"])
@login_required
def chat():
    """与指定 Agent 对话"""
    data = request.get_json()
    user_message = data.get("message", "").strip()
    agent_id = data.get("agent_id", "requirement_analyst")

    if not user_message:
        return jsonify({"error": "消息不能为空"}), 400

    if not get_user_api_key():
        return jsonify({"error": "请先在设置中配置你的 API Key", "need_apikey": True}), 400

    sid = ensure_session_id()
    try:
        agent = get_or_create_agent(sid, agent_id)
        reply = agent.chat(user_message)
        return jsonify({
            "reply": reply,
            "agent_id": agent_id,
            "agent_name": agent.name,
            "agent_icon": agent.icon
        })
    except Exception as e:
        return jsonify({"error": f"处理失败: {str(e)}"}), 500


@app.route("/api/chat/all", methods=["POST"])
@login_required
def chat_all():
    """将消息发送给所有 Agent"""
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "消息不能为空"}), 400

    if not get_user_api_key():
        return jsonify({"error": "请先在设置中配置你的 API Key", "need_apikey": True}), 400

    sid = ensure_session_id()
    results = []
    agents_info = get_all_agents_info()
    meeting_info = {a["id"]: a for a in get_meeting_agents_info()}

    for agent_info in agents_info:
        agent_id = agent_info["id"]
        m = meeting_info.get(agent_id, {})
        try:
            agent = get_or_create_agent(sid, agent_id)
            reply = agent.chat(user_message)
            results.append({
                "agent_id": agent_id,
                "agent_name": agent_info["name"],
                "agent_icon": agent_info["icon"],
                "meeting_name": m.get("meeting_name", agent_info["name"]),
                "meeting_icon": m.get("meeting_icon", agent_info["icon"]),
                "meeting_title": m.get("meeting_title", ""),
                "reply": reply
            })
        except Exception as e:
            results.append({
                "agent_id": agent_id,
                "agent_name": agent_info["name"],
                "agent_icon": agent_info["icon"],
                "meeting_name": m.get("meeting_name", agent_info["name"]),
                "meeting_icon": m.get("meeting_icon", agent_info["icon"]),
                "meeting_title": m.get("meeting_title", ""),
                "reply": f"⚠️ 调用失败: {str(e)}"
            })

    return jsonify({"results": results})


@app.route("/api/clear", methods=["POST"])
@login_required
def clear_history():
    """清除所有 Agent 的对话历史"""
    if "session_id" in session:
        sid = session["session_id"]
        keys_to_remove = [k for k in agent_instances if k.startswith(sid)]
        for key in keys_to_remove:
            del agent_instances[key]
    return jsonify({"message": "对话历史已清除"})


# ========================================
# 项目文件管理 API
# ========================================

@app.route("/api/project/generate", methods=["POST"])
@login_required
def generate_project():
    """让代码工程师生成完整项目"""
    data = request.get_json()
    requirement = data.get("requirement", "").strip()
    project_name = data.get("project_name", "").strip()

    if not requirement:
        return jsonify({"error": "需求描述不能为空"}), 400
    if not project_name:
        return jsonify({"error": "项目名称不能为空"}), 400

    if not get_user_api_key():
        return jsonify({"error": "请先在设置中配置你的 API Key", "need_apikey": True}), 400

    sid = ensure_session_id()
    try:
        developer = get_or_create_agent(sid, "developer")
        raw_output = developer.generate_project(requirement)
        files = file_manager.parse_generated_files(raw_output)

        first_file_marker = raw_output.find("<<<FILE:")
        dev_doc = raw_output[:first_file_marker].strip() if first_file_marker > 0 else raw_output

        file_manager.save_dev_doc(project_name, dev_doc)
        result = file_manager.save_files(project_name, files) if files else {
            "project_name": project_name,
            "project_path": file_manager.get_project_path(project_name),
            "created": [], "errors": []
        }
        file_tree = file_manager.get_file_tree(project_name)

        return jsonify({
            "dev_doc": dev_doc, "files_created": result["created"],
            "errors": result["errors"], "file_tree": file_tree,
            "project_name": project_name, "project_path": result.get("project_path", ""),
            "raw_output": raw_output
        })
    except Exception as e:
        return jsonify({"error": f"项目生成失败: {str(e)}"}), 500


@app.route("/api/project/list", methods=["GET"])
@login_required
def list_projects():
    return jsonify({"projects": file_manager.list_projects()})


@app.route("/api/project/files", methods=["GET"])
@login_required
def project_files():
    project_name = request.args.get("project", "")
    if not project_name:
        return jsonify({"error": "缺少项目名称"}), 400
    return jsonify({"file_tree": file_manager.get_file_tree(project_name), "project_name": project_name})


@app.route("/api/project/file", methods=["GET"])
@login_required
def read_project_file():
    project_name = request.args.get("project", "")
    file_path = request.args.get("path", "")
    if not project_name or not file_path:
        return jsonify({"error": "缺少参数"}), 400
    result = file_manager.read_file(project_name, file_path)
    return jsonify(result) if "error" not in result else (jsonify(result), 404)


# ========================================
# 讨论记录管理 API
# ========================================

@app.route("/api/discussion/save", methods=["POST"])
@login_required
def save_discussion():
    data = request.get_json()
    topic = data.get("topic", "").strip()
    messages = data.get("messages", [])
    if not topic or not messages:
        return jsonify({"error": "缺少议题或消息"}), 400
    return jsonify(discussion_manager.save_discussion(topic, messages))


@app.route("/api/discussion/list", methods=["GET"])
@login_required
def list_discussions():
    return jsonify({"discussions": discussion_manager.list_discussions()})


@app.route("/api/discussion/load", methods=["GET"])
@login_required
def load_discussion():
    disc_id = request.args.get("id", "")
    if not disc_id:
        return jsonify({"error": "缺少讨论 ID"}), 400
    data = discussion_manager.load_discussion(disc_id)
    return jsonify(data) if "error" not in data else (jsonify(data), 404)


@app.route("/api/discussion/markdown", methods=["GET"])
@login_required
def discussion_markdown():
    disc_id = request.args.get("id", "")
    if not disc_id:
        return jsonify({"error": "缺少讨论 ID"}), 400
    result = discussion_manager.get_markdown(disc_id)
    return jsonify(result) if "error" not in result else (jsonify(result), 404)


@app.route("/api/discussion/summarize", methods=["POST"])
@login_required
def summarize_discussion():
    data = request.get_json()
    disc_id = data.get("id", "")
    topic = data.get("topic", "")
    messages = data.get("messages", [])
    if not topic or not messages:
        return jsonify({"error": "缺少议题或消息"}), 400

    if not get_user_api_key():
        return jsonify({"error": "请先配置 API Key", "need_apikey": True}), 400

    sid = ensure_session_id()
    try:
        arrodes = get_or_create_agent(sid, "arrodes")
        summary = arrodes.summarize_discussion(topic, messages)
        if disc_id:
            discussion_manager.update_summary(disc_id, summary)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": f"总结失败: {str(e)}"}), 500


if __name__ == "__main__":
    print("🏢 My Studio 启动中...")
    print("📋 需求分析师 | 🏗️ 架构设计师 | 🎨 UI设计师")
    print("🧩 UX设计师   | 💻 代码工程师 | 🧪 测试工程师")
    print("🪞 记录官·阿罗德斯")
    print(f"🌐 访问地址: http://localhost:5000")
    print("-" * 50)
    app.run(debug=config.DEBUG, host="0.0.0.0", port=5000)
