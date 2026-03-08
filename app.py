"""
虚拟工作室 - 主应用
一个基于多 AI Agent 协作的 Web 应用
"""
from flask import Flask, render_template, request, jsonify, session
import config
from agents import get_agent, get_all_agents_info
from agents.developer import Developer
import file_manager

app = Flask(__name__)
app.secret_key = config.SECRET_KEY

# 存储每个会话的 Agent 实例
agent_instances = {}


def get_or_create_agent(session_id: str, agent_id: str):
    """获取或创建 Agent 实例，保持对话上下文"""
    key = f"{session_id}_{agent_id}"
    if key not in agent_instances:
        agent_instances[key] = get_agent(agent_id)
    return agent_instances[key]


@app.route("/")
def index():
    """主页 - 聊天界面"""
    return render_template("index.html")


@app.route("/api/agents", methods=["GET"])
def list_agents():
    """获取所有可用的 Agent 列表"""
    return jsonify({"agents": get_all_agents_info()})


@app.route("/api/chat", methods=["POST"])
def chat():
    """与指定 Agent 对话"""
    data = request.get_json()
    user_message = data.get("message", "").strip()
    agent_id = data.get("agent_id", "requirement_analyst")

    if not user_message:
        return jsonify({"error": "消息不能为空"}), 400

    # 使用 session ID 来维持对话上下文
    if "session_id" not in session:
        import uuid
        session["session_id"] = str(uuid.uuid4())

    try:
        agent = get_or_create_agent(session["session_id"], agent_id)
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
def chat_all():
    """将消息发送给所有 Agent，收集各方意见"""
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "消息不能为空"}), 400

    if "session_id" not in session:
        import uuid
        session["session_id"] = str(uuid.uuid4())

    results = []
    agents_info = get_all_agents_info()

    for agent_info in agents_info:
        try:
            agent = get_or_create_agent(session["session_id"], agent_info["id"])
            reply = agent.chat(user_message)
            results.append({
                "agent_id": agent_info["id"],
                "agent_name": agent_info["name"],
                "agent_icon": agent_info["icon"],
                "reply": reply
            })
        except Exception as e:
            results.append({
                "agent_id": agent_info["id"],
                "agent_name": agent_info["name"],
                "agent_icon": agent_info["icon"],
                "reply": f"⚠️ 调用失败: {str(e)}"
            })

    return jsonify({"results": results})


@app.route("/api/clear", methods=["POST"])
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
def generate_project():
    """让代码工程师生成完整项目（开发文档 + 代码文件）"""
    data = request.get_json()
    requirement = data.get("requirement", "").strip()
    project_name = data.get("project_name", "").strip()

    if not requirement:
        return jsonify({"error": "需求描述不能为空"}), 400
    if not project_name:
        return jsonify({"error": "项目名称不能为空"}), 400

    if "session_id" not in session:
        import uuid
        session["session_id"] = str(uuid.uuid4())

    try:
        # 获取代码工程师 Agent
        developer = get_or_create_agent(session["session_id"], "developer")

        # 调用生成功能
        raw_output = developer.generate_project(requirement)

        # 解析生成的文件列表
        files = file_manager.parse_generated_files(raw_output)

        # 提取开发文档（<<<FILE: 之前的内容）
        first_file_marker = raw_output.find("<<<FILE:")
        if first_file_marker > 0:
            dev_doc = raw_output[:first_file_marker].strip()
        else:
            dev_doc = raw_output

        # 保存开发文档
        file_manager.save_dev_doc(project_name, dev_doc)

        # 保存代码文件
        if files:
            result = file_manager.save_files(project_name, files)
        else:
            result = {
                "project_name": project_name,
                "project_path": file_manager.get_project_path(project_name),
                "created": [],
                "errors": []
            }

        # 获取文件树
        file_tree = file_manager.get_file_tree(project_name)

        return jsonify({
            "dev_doc": dev_doc,
            "files_created": result["created"],
            "errors": result["errors"],
            "file_tree": file_tree,
            "project_name": project_name,
            "project_path": result.get("project_path", ""),
            "raw_output": raw_output
        })

    except Exception as e:
        return jsonify({"error": f"项目生成失败: {str(e)}"}), 500


@app.route("/api/project/list", methods=["GET"])
def list_projects():
    """列出所有已生成的项目"""
    projects = file_manager.list_projects()
    return jsonify({"projects": projects})


@app.route("/api/project/files", methods=["GET"])
def project_files():
    """获取项目的文件树"""
    project_name = request.args.get("project", "")
    if not project_name:
        return jsonify({"error": "缺少项目名称"}), 400

    tree = file_manager.get_file_tree(project_name)
    return jsonify({"file_tree": tree, "project_name": project_name})


@app.route("/api/project/file", methods=["GET"])
def read_project_file():
    """读取项目中的某个文件"""
    project_name = request.args.get("project", "")
    file_path = request.args.get("path", "")

    if not project_name or not file_path:
        return jsonify({"error": "缺少参数"}), 400

    result = file_manager.read_file(project_name, file_path)
    if "error" in result:
        return jsonify(result), 404

    return jsonify(result)


if __name__ == "__main__":
    print("🏢 虚拟工作室启动中...")
    print("📋 需求分析师 | 🏗️ 架构设计师 | 🎨 UI设计师")
    print("🧩 UX设计师   | 💻 代码工程师 | 🧪 测试工程师")
    print(f"🌐 访问地址: http://localhost:5000")
    print("-" * 50)
    app.run(debug=config.DEBUG, host="0.0.0.0", port=5000)
