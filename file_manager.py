"""
文件管理器 - 负责项目文件的创建、读取和管理
"""
import os
import re
import json
from datetime import datetime

# 项目输出的根目录
PROJECTS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "projects")


def ensure_projects_root():
    """确保项目根目录存在"""
    os.makedirs(PROJECTS_ROOT, exist_ok=True)


def get_project_path(project_name: str) -> str:
    """获取项目的完整路径"""
    safe_name = re.sub(r'[<>:"/\\|?*]', '_', project_name)
    return os.path.join(PROJECTS_ROOT, safe_name)


def create_project(project_name: str) -> str:
    """创建项目目录，返回项目路径"""
    ensure_projects_root()
    project_path = get_project_path(project_name)
    os.makedirs(project_path, exist_ok=True)
    return project_path


def save_files(project_name: str, files: list) -> dict:
    """
    批量保存文件到项目目录
    files: [{"path": "src/main.py", "content": "..."}]
    返回: {"project_path": "...", "created": [...], "errors": [...]}
    """
    project_path = create_project(project_name)
    created = []
    errors = []

    for file_info in files:
        rel_path = file_info.get("path", "").strip()
        content = file_info.get("content", "")

        if not rel_path:
            errors.append({"path": rel_path, "error": "文件路径为空"})
            continue

        # 安全检查：禁止路径穿越
        full_path = os.path.normpath(os.path.join(project_path, rel_path))
        if not full_path.startswith(os.path.normpath(project_path)):
            errors.append({"path": rel_path, "error": "非法路径"})
            continue

        try:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            created.append(rel_path)
        except Exception as e:
            errors.append({"path": rel_path, "error": str(e)})

    return {
        "project_path": project_path,
        "project_name": project_name,
        "created": created,
        "errors": errors
    }


def save_dev_doc(project_name: str, doc_content: str) -> str:
    """保存开发文档到项目根目录"""
    project_path = create_project(project_name)
    doc_path = os.path.join(project_path, "开发文档.md")
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(doc_content)
    return doc_path


def get_file_tree(project_name: str) -> list:
    """
    获取项目的文件树结构
    返回: [{"name": "src", "type": "dir", "children": [...]}, ...]
    """
    project_path = get_project_path(project_name)
    if not os.path.exists(project_path):
        return []

    def _scan(dir_path, rel_prefix=""):
        items = []
        try:
            entries = sorted(os.listdir(dir_path))
        except PermissionError:
            return items

        dirs_first = sorted(entries, key=lambda x: (
            not os.path.isdir(os.path.join(dir_path, x)), x.lower()
        ))

        for entry in dirs_first:
            full = os.path.join(dir_path, entry)
            rel = os.path.join(rel_prefix, entry).replace("\\", "/")
            if os.path.isdir(full):
                children = _scan(full, rel)
                items.append({
                    "name": entry,
                    "path": rel,
                    "type": "dir",
                    "children": children
                })
            else:
                size = os.path.getsize(full)
                items.append({
                    "name": entry,
                    "path": rel,
                    "type": "file",
                    "size": size
                })
        return items

    return _scan(project_path)


def read_file(project_name: str, file_path: str) -> dict:
    """读取项目中的某个文件"""
    project_path = get_project_path(project_name)
    full_path = os.path.normpath(os.path.join(project_path, file_path))

    if not full_path.startswith(os.path.normpath(project_path)):
        return {"error": "非法路径"}

    if not os.path.exists(full_path):
        return {"error": "文件不存在"}

    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {
            "path": file_path,
            "content": content,
            "size": os.path.getsize(full_path)
        }
    except UnicodeDecodeError:
        return {"path": file_path, "content": "[二进制文件，无法预览]", "size": os.path.getsize(full_path)}
    except Exception as e:
        return {"error": str(e)}


def list_projects() -> list:
    """列出所有已创建的项目"""
    ensure_projects_root()
    projects = []
    for entry in sorted(os.listdir(PROJECTS_ROOT)):
        full = os.path.join(PROJECTS_ROOT, entry)
        if os.path.isdir(full):
            file_count = sum(len(files) for _, _, files in os.walk(full))
            projects.append({
                "name": entry,
                "file_count": file_count,
                "created_at": datetime.fromtimestamp(
                    os.path.getctime(full)
                ).strftime("%Y-%m-%d %H:%M")
            })
    return projects


def parse_generated_files(text: str) -> list:
    """
    从代码工程师的输出中解析文件列表。
    支持的格式：
    <<<FILE: path/to/file.py>>>
    文件内容
    <<<END_FILE>>>
    """
    pattern = r'<<<FILE:\s*(.+?)>>>\n([\s\S]*?)<<<END_FILE>>>'
    matches = re.findall(pattern, text)

    files = []
    for path, content in matches:
        path = path.strip()
        # 去掉内容首尾的空行
        content = content.strip('\n')
        if path and content:
            files.append({"path": path, "content": content})

    return files
