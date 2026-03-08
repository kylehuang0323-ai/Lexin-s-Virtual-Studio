/**
 * 虚拟工作室 - 前端聊天逻辑 + 项目文件管理
 */

// 状态管理
const state = {
    currentAgentId: "requirement_analyst",
    agents: [],
    isLoading: false,
    currentProject: null  // 当前查看的项目名
};

// DOM 元素
const elements = {
    agentList: document.getElementById("agent-list"),
    chatMessages: document.getElementById("chat-messages"),
    userInput: document.getElementById("user-input"),
    btnSend: document.getElementById("btn-send"),
    btnAskAll: document.getElementById("btn-ask-all"),
    btnClear: document.getElementById("btn-clear"),
    btnGenerate: document.getElementById("btn-generate"),
    btnProjects: document.getElementById("btn-projects"),
    btnTogglePanel: document.getElementById("btn-toggle-panel"),
    currentAgentInfo: document.getElementById("current-agent-info"),
    // 文件面板
    filePanel: document.getElementById("file-panel"),
    btnClosePanel: document.getElementById("btn-close-panel"),
    filePanelProjectName: document.getElementById("file-panel-project-name"),
    fileTreeContainer: document.getElementById("file-tree-container"),
    filePreviewContainer: document.getElementById("file-preview-container"),
    previewFileName: document.getElementById("preview-file-name"),
    filePreviewContent: document.getElementById("file-preview-content"),
    btnClosePreview: document.getElementById("btn-close-preview"),
    // 生成弹窗
    generateModal: document.getElementById("generate-modal"),
    genProjectName: document.getElementById("gen-project-name"),
    genRequirement: document.getElementById("gen-requirement"),
    btnGenCancel: document.getElementById("btn-gen-cancel"),
    btnGenConfirm: document.getElementById("btn-gen-confirm"),
    // 项目列表弹窗
    projectsModal: document.getElementById("projects-modal"),
    projectsList: document.getElementById("projects-list"),
    btnProjectsClose: document.getElementById("btn-projects-close")
};

// ========================================
// 初始化
// ========================================

async function init() {
    await loadAgents();
    bindEvents();
}

async function loadAgents() {
    try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        state.agents = data.agents;
        renderAgentList();
    } catch (err) {
        console.error("加载 Agent 列表失败:", err);
    }
}

function bindEvents() {
    elements.btnSend.addEventListener("click", sendMessage);
    elements.btnAskAll.addEventListener("click", askAllAgents);
    elements.btnClear.addEventListener("click", clearHistory);
    elements.btnGenerate.addEventListener("click", openGenerateModal);
    elements.btnProjects.addEventListener("click", openProjectsModal);
    elements.btnTogglePanel.addEventListener("click", toggleFilePanel);
    elements.btnClosePanel.addEventListener("click", () => toggleFilePanel(false));
    elements.btnClosePreview.addEventListener("click", closePreview);

    // 生成弹窗
    elements.btnGenCancel.addEventListener("click", closeGenerateModal);
    elements.btnGenConfirm.addEventListener("click", confirmGenerate);
    elements.generateModal.querySelector(".modal-overlay").addEventListener("click", closeGenerateModal);

    // 项目列表弹窗
    elements.btnProjectsClose.addEventListener("click", closeProjectsModal);
    elements.projectsModal.querySelector(".modal-overlay").addEventListener("click", closeProjectsModal);

    elements.userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ========================================
// Agent 列表渲染
// ========================================

function renderAgentList() {
    elements.agentList.innerHTML = state.agents.map(agent => `
        <div class="agent-card ${agent.id === state.currentAgentId ? 'active' : ''}"
             data-agent-id="${agent.id}"
             onclick="selectAgent('${agent.id}')">
            <div class="icon">${agent.icon}</div>
            <div class="info">
                <div class="name">${agent.name}</div>
                <div class="desc">${agent.description}</div>
            </div>
        </div>
    `).join("");
}

function selectAgent(agentId) {
    state.currentAgentId = agentId;
    renderAgentList();

    const agent = state.agents.find(a => a.id === agentId);
    if (agent) {
        elements.currentAgentInfo.innerHTML = `
            <span class="agent-icon">${agent.icon}</span>
            <span class="agent-name">${agent.name}</span>
        `;
    }
}

// ========================================
// 消息发送
// ========================================

async function sendMessage() {
    const message = elements.userInput.value.trim();
    if (!message || state.isLoading) return;

    clearWelcome();
    appendMessage("user", "👤", message);
    elements.userInput.value = "";

    const loadingId = showLoading();
    state.isLoading = true;
    setInputEnabled(false);

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                agent_id: state.currentAgentId
            })
        });
        const data = await res.json();
        removeLoading(loadingId);

        if (data.error) {
            appendMessage("agent", "⚠️", `错误: ${data.error}`, "系统提示");
        } else {
            appendMessage("agent", data.agent_icon, data.reply, data.agent_name);
        }
    } catch (err) {
        removeLoading(loadingId);
        appendMessage("agent", "⚠️", `网络错误: ${err.message}`, "系统提示");
    }

    state.isLoading = false;
    setInputEnabled(true);
    elements.userInput.focus();
}

async function askAllAgents() {
    const message = elements.userInput.value.trim();
    if (!message || state.isLoading) return;

    clearWelcome();
    appendMessage("user", "👤", message);
    elements.userInput.value = "";

    const divider = document.createElement("div");
    divider.className = "team-discussion-divider";
    divider.textContent = "🗣️ 全员讨论";
    elements.chatMessages.appendChild(divider);

    const loadingId = showLoading();
    state.isLoading = true;
    setInputEnabled(false);

    try {
        const res = await fetch("/api/chat/all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });
        const data = await res.json();
        removeLoading(loadingId);

        if (data.results) {
            data.results.forEach(result => {
                appendMessage("agent", result.agent_icon, result.reply, result.agent_name);
            });
        }
    } catch (err) {
        removeLoading(loadingId);
        appendMessage("agent", "⚠️", `网络错误: ${err.message}`, "系统提示");
    }

    state.isLoading = false;
    setInputEnabled(true);
    elements.userInput.focus();
}

async function clearHistory() {
    try {
        await fetch("/api/clear", { method: "POST" });
        elements.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🏢</div>
                <h2>对话已清除</h2>
                <p>开始新的对话吧！描述你的创意或想法。</p>
            </div>
        `;
    } catch (err) {
        console.error("清除历史失败:", err);
    }
}

// ========================================
// 项目生成
// ========================================

function openGenerateModal() {
    elements.generateModal.classList.remove("hidden");
    elements.genProjectName.value = "";
    elements.genRequirement.value = "";
    elements.genProjectName.focus();
}

function closeGenerateModal() {
    elements.generateModal.classList.add("hidden");
}

async function confirmGenerate() {
    const projectName = elements.genProjectName.value.trim();
    const requirement = elements.genRequirement.value.trim();

    if (!projectName) {
        elements.genProjectName.style.borderColor = "var(--error)";
        elements.genProjectName.focus();
        return;
    }
    if (!requirement) {
        elements.genRequirement.style.borderColor = "var(--error)";
        elements.genRequirement.focus();
        return;
    }

    closeGenerateModal();
    clearWelcome();

    // 在聊天中显示生成请求
    appendMessage("user", "👤", `📦 请生成项目「${projectName}」\n\n${requirement}`);

    const loadingId = showLoading();
    state.isLoading = true;
    setInputEnabled(false);

    try {
        const res = await fetch("/api/project/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project_name: projectName,
                requirement: requirement
            })
        });
        const data = await res.json();
        removeLoading(loadingId);

        if (data.error) {
            appendMessage("agent", "⚠️", `生成失败: ${data.error}`, "系统提示");
        } else {
            // 显示开发文档摘要
            if (data.dev_doc) {
                appendMessage("agent", "💻", data.dev_doc, "代码工程师 - 开发文档");
            }

            // 显示生成结果状态卡片
            appendGenerateStatus(data);

            // 打开文件面板
            state.currentProject = projectName;
            showFilePanel(projectName, data.file_tree);
        }
    } catch (err) {
        removeLoading(loadingId);
        appendMessage("agent", "⚠️", `网络错误: ${err.message}`, "系统提示");
    }

    state.isLoading = false;
    setInputEnabled(true);
}

function appendGenerateStatus(data) {
    const statusDiv = document.createElement("div");
    statusDiv.className = "generate-status";

    const createdCount = data.files_created ? data.files_created.length : 0;
    const errorCount = data.errors ? data.errors.length : 0;

    let html = `
        <div class="status-header">
            ✅ 项目「${escapeHtml(data.project_name)}」生成完成！
            共 ${createdCount + 1} 个文件
        </div>
        <div class="file-list">
            <div class="file-item">开发文档.md</div>
    `;

    if (data.files_created) {
        data.files_created.forEach(f => {
            html += `<div class="file-item">${escapeHtml(f)}</div>`;
        });
    }

    if (data.errors && data.errors.length > 0) {
        data.errors.forEach(e => {
            html += `<div class="error-item">${escapeHtml(e.path)}: ${escapeHtml(e.error)}</div>`;
        });
    }

    html += `
        </div>
        <button class="btn-view-files" onclick="openProjectFiles('${escapeHtml(data.project_name)}')">
            📂 查看项目文件
        </button>
    `;

    statusDiv.innerHTML = html;
    elements.chatMessages.appendChild(statusDiv);
    scrollToBottom();
}

// ========================================
// 项目列表
// ========================================

function openProjectsModal() {
    elements.projectsModal.classList.remove("hidden");
    loadProjectsList();
}

function closeProjectsModal() {
    elements.projectsModal.classList.add("hidden");
}

async function loadProjectsList() {
    elements.projectsList.innerHTML = '<p class="loading-text">加载中...</p>';

    try {
        const res = await fetch("/api/project/list");
        const data = await res.json();

        if (!data.projects || data.projects.length === 0) {
            elements.projectsList.innerHTML = '<p class="loading-text">暂无项目，点击「📦 生成项目」创建</p>';
            return;
        }

        elements.projectsList.innerHTML = data.projects.map(p => `
            <div class="project-card" onclick="openProjectFiles('${escapeHtml(p.name)}'); closeProjectsModal();">
                <div class="project-info">
                    <div class="name">📁 ${escapeHtml(p.name)}</div>
                    <div class="meta">${p.file_count} 个文件 · ${p.created_at}</div>
                </div>
            </div>
        `).join("");
    } catch (err) {
        elements.projectsList.innerHTML = `<p class="loading-text">加载失败: ${err.message}</p>`;
    }
}

// ========================================
// 文件面板
// ========================================

function toggleFilePanel(show) {
    if (show === undefined) {
        show = elements.filePanel.classList.contains("hidden");
    }
    if (show) {
        elements.filePanel.classList.remove("hidden");
        elements.btnTogglePanel.style.display = "block";
    } else {
        elements.filePanel.classList.add("hidden");
    }
}

function showFilePanel(projectName, fileTree) {
    state.currentProject = projectName;
    elements.filePanelProjectName.textContent = projectName;
    elements.btnTogglePanel.style.display = "block";
    elements.filePanel.classList.remove("hidden");

    if (fileTree && fileTree.length > 0) {
        renderFileTree(fileTree);
    } else {
        elements.fileTreeContainer.innerHTML = '<div class="file-tree-empty">项目中暂无文件</div>';
    }

    closePreview();
}

async function openProjectFiles(projectName) {
    try {
        const res = await fetch(`/api/project/files?project=${encodeURIComponent(projectName)}`);
        const data = await res.json();
        showFilePanel(projectName, data.file_tree);
    } catch (err) {
        console.error("加载项目文件失败:", err);
    }
}

function renderFileTree(items, depth = 0) {
    if (depth === 0) {
        elements.fileTreeContainer.innerHTML = "";
    }

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "tree-item";
        div.style.paddingLeft = `${16 + depth * 18}px`;

        if (item.type === "dir") {
            div.innerHTML = `
                <span class="tree-icon">📁</span>
                <span class="tree-name">${escapeHtml(item.name)}</span>
            `;
            elements.fileTreeContainer.appendChild(div);
            if (item.children) {
                renderFileTree(item.children, depth + 1);
            }
        } else {
            const icon = getFileIcon(item.name);
            const size = formatFileSize(item.size);
            div.innerHTML = `
                <span class="tree-icon">${icon}</span>
                <span class="tree-name">${escapeHtml(item.name)}</span>
                <span class="tree-size">${size}</span>
            `;
            div.addEventListener("click", () => previewFile(item.path));
            elements.fileTreeContainer.appendChild(div);
        }
    });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        py: "🐍", js: "📜", ts: "📘", html: "🌐", css: "🎨",
        json: "📋", md: "📝", txt: "📄", yml: "⚙️", yaml: "⚙️",
        sql: "🗃️", sh: "🖥️", bat: "🖥️", xml: "📰", env: "🔑",
        gitignore: "🙈", dockerfile: "🐳", toml: "⚙️", cfg: "⚙️",
        ini: "⚙️", vue: "💚", jsx: "⚛️", tsx: "⚛️", java: "☕",
        go: "🔵", rs: "🦀", rb: "💎", php: "🐘", swift: "🍎"
    };
    return iconMap[ext] || "📄";
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function previewFile(filePath) {
    if (!state.currentProject) return;

    // 高亮当前文件
    elements.fileTreeContainer.querySelectorAll(".tree-item").forEach(el => el.classList.remove("active"));
    const items = elements.fileTreeContainer.querySelectorAll(".tree-item");
    items.forEach(el => {
        if (el.querySelector(".tree-name")?.textContent === filePath.split("/").pop()) {
            el.classList.add("active");
        }
    });

    try {
        const res = await fetch(
            `/api/project/file?project=${encodeURIComponent(state.currentProject)}&path=${encodeURIComponent(filePath)}`
        );
        const data = await res.json();

        if (data.error) {
            elements.filePreviewContent.querySelector("code").textContent = `错误: ${data.error}`;
        } else {
            elements.filePreviewContent.querySelector("code").textContent = data.content;
        }

        elements.previewFileName.textContent = filePath;
        elements.filePreviewContainer.classList.remove("hidden");
    } catch (err) {
        elements.filePreviewContent.querySelector("code").textContent = `加载失败: ${err.message}`;
        elements.filePreviewContainer.classList.remove("hidden");
    }
}

function closePreview() {
    elements.filePreviewContainer.classList.add("hidden");
    elements.fileTreeContainer.querySelectorAll(".tree-item").forEach(el => el.classList.remove("active"));
}

// ========================================
// UI 辅助函数
// ========================================

function appendMessage(type, icon, content, label = "") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;

    const formattedContent = type === "agent" ? formatMarkdown(content) : escapeHtml(content);
    const labelHtml = label ? `<div class="agent-label">${escapeHtml(label)}</div>` : "";

    messageDiv.innerHTML = `
        <div class="avatar">${icon}</div>
        <div class="bubble">
            ${labelHtml}
            <div class="content">${formattedContent}</div>
        </div>
    `;

    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showLoading() {
    const id = "loading-" + Date.now();
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message agent";
    loadingDiv.id = id;
    loadingDiv.innerHTML = `
        <div class="avatar">⏳</div>
        <div class="bubble">
            <div class="loading-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    elements.chatMessages.appendChild(loadingDiv);
    scrollToBottom();
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function clearWelcome() {
    const welcome = elements.chatMessages.querySelector(".welcome-message");
    if (welcome) welcome.remove();
}

function setInputEnabled(enabled) {
    elements.userInput.disabled = !enabled;
    elements.btnSend.disabled = !enabled;
    elements.btnAskAll.disabled = !enabled;
    elements.btnGenerate.disabled = !enabled;
}

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// ========================================
// Markdown 简易格式化
// ========================================

function formatMarkdown(text) {
    let html = escapeHtml(text);

    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g,
        '<pre><code class="lang-$1">$2</code></pre>');

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // 粗体和斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');

    // 合并连续的 li 为 ul
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

    // 换行
    html = html.replace(/\n/g, '<br>');

    // 清理多余的 br
    html = html.replace(/<br><\/(h[1-3]|ul|pre)>/g, '</$1>');
    html = html.replace(/<(h[1-3]|ul|pre)><br>/g, '<$1>');

    return html;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// 启动
init();
