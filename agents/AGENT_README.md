agent/ui-designer
# 🎨 UI设计师 Agent

## 角色职责
- 设计美观、现代的用户界面
- 制定视觉设计规范和配色方案
- 设计响应式布局方案
- 创建组件库和设计系统
- 提供具体的 CSS 实现建议

## 相关文件
- `agents/ui_designer.py` - UI设计师 Agent 实现

# 💻 代码工程师 Agent

## 角色职责
- 将设计方案转化为可运行的代码
- 编写高质量、可维护的代码
- 前后端全栈开发
- 编写完整的开发文档
- **项目文件生成**：根据需求文档自动创建全部代码文件并管理文件结构

## 特殊能力
代码工程师是唯一具备 `generate_project()` 方法的 Agent，可以：
1. 生成完整的开发文档（Markdown 格式）
2. 输出结构化的代码文件（使用 <<<FILE:>>> 标记格式）
3. 自动创建项目目录和文件

## 相关文件
- `agents/developer.py` - 代码工程师 Agent 实现（含 generate_project）
main
- `agents/base_agent.py` - Agent 基类
- `file_manager.py` - 文件管理器（解析、创建、读取文件）

## 开发说明
agent/ui-designer
修改此角色的行为，请编辑 `agents/ui_designer.py` 中的：

修改此角色的行为，请编辑 `agents/developer.py` 中的：
main
- `role_description` - 角色描述
- `_build_system_prompt()` - 聊天系统提示词
- `build_generate_prompt()` - 项目生成专用提示词
