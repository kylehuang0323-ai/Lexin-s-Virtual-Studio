/**
 * My Studio - 前端聊天逻辑 + 项目文件管理 + 诡秘之主会议室
 */

// 角色专属色彩系统
const CHARACTER_COLORS = {
    product_manager:     "#c084fc",  // Violet (Audrey)
    requirement_analyst: "#eab308",  // Gold
    architect:           "#a78bfa",  // Purple
    ui_designer:         "#f472b6",  // Rose
    ux_designer:         "#60a5fa",  // Sky
    developer:           "#fb923c",  // Amber
    tester:              "#f87171",  // Red
    arrodes:             "#67e8f9",  // Cyan
};

// 状态管理
const state = {
    currentAgentId: "requirement_analyst",
    agents: [],
    meetingAgents: [],
    isLoading: false,
    currentProject: null,
    inMeeting: false,
    particlesCtx: null,
    particles: [],
    particlesRAF: null,
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
    btnProjectsClose: document.getElementById("btn-projects-close"),
    // 会议室
    meetingRoom: document.getElementById("meeting-room"),
    meetingParticipants: document.getElementById("meeting-participants"),
    meetingMessages: document.getElementById("meeting-messages"),
    meetingInput: document.getElementById("meeting-input"),
    btnMeetingSend: document.getElementById("btn-meeting-send"),
    btnLeaveMeeting: document.getElementById("btn-leave-meeting"),
    // 讨论记录
    btnHistory: document.getElementById("btn-history"),
    historyModal: document.getElementById("history-modal"),
    historyList: document.getElementById("history-list"),
    btnHistoryClose: document.getElementById("btn-history-close"),
    // Markdown 查看
    markdownModal: document.getElementById("markdown-modal"),
    markdownTitle: document.getElementById("markdown-modal-title"),
    markdownContent: document.getElementById("markdown-content"),
    btnMarkdownClose: document.getElementById("btn-markdown-close"),
    btnResumeDiscussion: document.getElementById("btn-resume-discussion"),
    // 设置 & 用户
    userDisplayName: document.getElementById("user-display-name"),
    btnSettings: document.getElementById("btn-settings"),
    btnLogout: document.getElementById("btn-logout"),
    settingsModal: document.getElementById("settings-modal"),
    settingsMaskedKey: document.getElementById("settings-masked-key"),
    settingsApiKey: document.getElementById("settings-apikey"),
    settingsError: document.getElementById("settings-error"),
    settingsSuccess: document.getElementById("settings-success"),
    btnSettingsSave: document.getElementById("btn-settings-save"),
    btnSettingsClose: document.getElementById("btn-settings-close"),
};

// ========================================
// 初始化
// ========================================

async function init() {
    await loadUserInfo();
    await loadAgents();
    await loadMeetingAgents();
    bindEvents();
}

async function loadUserInfo() {
    try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
            window.location.href = "/login";
            return;
        }
        const data = await res.json();
        const user = data.user;
        state.currentUser = user;
        elements.userDisplayName.textContent = user.display_name || user.username;
        if (!user.has_api_key) {
            showApiKeyBanner();
        }
    } catch (err) {
        console.error("加载用户信息失败:", err);
    }
}

function showApiKeyBanner() {
    const existing = document.querySelector(".apikey-banner");
    if (existing) return;
    const banner = document.createElement("div");
    banner.className = "apikey-banner";
    banner.innerHTML = "⚠️ 尚未配置 API Key，点击此处前往设置";
    banner.addEventListener("click", openSettingsModal);
    const sidebar = document.querySelector(".sidebar-actions");
    sidebar.parentNode.insertBefore(banner, sidebar);
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

async function loadMeetingAgents() {
    try {
        const res = await fetch("/api/agents/meeting");
        const data = await res.json();
        state.meetingAgents = data.agents;
    } catch (err) {
        console.error("加载会议角色失败:", err);
    }
}

function bindEvents() {
    elements.btnSend.addEventListener("click", sendMessage);
    elements.btnAskAll.addEventListener("click", enterMeeting);
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

    // 会议室
    elements.btnMeetingSend.addEventListener("click", meetingSend);
    elements.btnLeaveMeeting.addEventListener("click", leaveMeeting);

    // 讨论记录
    elements.btnHistory.addEventListener("click", openHistoryModal);
    elements.btnHistoryClose.addEventListener("click", closeHistoryModal);
    elements.historyModal.querySelector(".modal-overlay").addEventListener("click", closeHistoryModal);
    elements.btnMarkdownClose.addEventListener("click", closeMarkdownModal);
    elements.markdownModal.querySelector(".modal-overlay").addEventListener("click", closeMarkdownModal);
    elements.btnResumeDiscussion.addEventListener("click", resumeCurrentDiscussion);

    // 设置 & 登出
    elements.btnSettings.addEventListener("click", openSettingsModal);
    elements.btnLogout.addEventListener("click", handleLogout);
    elements.btnSettingsSave.addEventListener("click", saveApiKey);
    elements.btnSettingsClose.addEventListener("click", closeSettingsModal);
    elements.settingsModal.querySelector(".modal-overlay").addEventListener("click", closeSettingsModal);

    elements.userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    elements.meetingInput.addEventListener("keydown", (e) => {
        // @ 弹窗打开时让弹窗处理方向键和回车
        const popup = document.getElementById("mention-popup");
        if (!popup.classList.contains("hidden") && ["ArrowUp","ArrowDown"].includes(e.key)) return;
        if (!popup.classList.contains("hidden") && e.key === "Enter" && !e.shiftKey && mentionPopupIndex >= 0) return;
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            meetingSend();
        }
    });

    // 初始化 @ 提及监听
    setupMentionListener();
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
// 消息发送（普通模式）
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

// ========================================
// 诡秘之主 · 灰雾之上会议室
// ========================================

function enterMeeting() {
    state.inMeeting = true;
    elements.meetingRoom.classList.remove("hidden");
    renderMeetingParticipants();
    initParticles();
    renderTableRunes();
    elements.meetingInput.focus();
}

function leaveMeeting() {
    state.inMeeting = false;
    elements.meetingRoom.classList.add("hidden");
    stopParticles();
}

// --- Canvas 粒子系统 ---
function initParticles() {
    const canvas = document.getElementById("particles-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.particlesCtx = ctx;
    state.particles = [];
    
    for (let i = 0; i < 40; i++) {
        state.particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.3,
            dx: (Math.random() - 0.5) * 0.3,
            dy: -Math.random() * 0.4 - 0.1,
            alpha: Math.random() * 0.4 + 0.1,
            color: Math.random() > 0.7 ? "180,160,255" : "160,140,220",
        });
    }
    animateParticles();
}

function animateParticles() {
    const ctx = state.particlesCtx;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    state.particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
    });
    
    state.particlesRAF = requestAnimationFrame(animateParticles);
}

function stopParticles() {
    if (state.particlesRAF) {
        cancelAnimationFrame(state.particlesRAF);
        state.particlesRAF = null;
    }
}

// --- 神秘符文 ---
function renderTableRunes() {
    const runesEl = document.getElementById("table-runes");
    if (!runesEl) return;
    const symbols = ["☿", "♃", "♄", "⚹", "☽", "✦", "⊕", "△", "⟡", "✧", "⬡", "⬢"];
    runesEl.innerHTML = symbols.map((s, i) => {
        const angle = (i / symbols.length) * 360;
        const rad = angle * Math.PI / 180;
        const r = 50;
        const x = 50 + r * Math.cos(rad);
        const y = 50 + r * Math.sin(rad);
        return `<span class="rune" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%)">${s}</span>`;
    }).join("");
}

// --- 环形座席渲染 ---
function renderMeetingParticipants() {
    const container = elements.meetingParticipants;
    const area = document.querySelector(".meeting-table-area");
    if (!container || !area) return;
    
    const agents = state.meetingAgents;
    const n = agents.length;
    
    container.innerHTML = agents.map((agent, i) => {
        const color = CHARACTER_COLORS[agent.id] || "#a78bfa";
        return `
            <div class="seat-card" data-agent-id="${agent.id}" id="seat-${agent.id}"
                 style="--seat-color: ${color}; --seat-index: ${i}">
                <div class="seat-avatar-ring">
                    <div class="seat-avatar">${agent.meeting_icon}</div>
                </div>
                <div class="seat-name">${agent.meeting_name}</div>
                <div class="seat-title">${agent.meeting_title}</div>
                <div class="seat-status-bar">
                    <div class="seat-wave">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span class="seat-status-text" id="seat-status-${agent.id}"></span>
                </div>
            </div>
        `;
    }).join("");
    
    // Position in orbit after render
    requestAnimationFrame(() => positionSeatsInOrbit());
    
    // Reposition on resize
    window.addEventListener("resize", positionSeatsInOrbit);
}

function positionSeatsInOrbit() {
    const area = document.querySelector(".meeting-table-area");
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = Math.min(cx - 60, 155); // horizontal radius
    const ry = Math.min(cy - 55, 155); // vertical radius
    
    const cards = document.querySelectorAll(".seat-card");
    const n = cards.length;
    const startAngle = -90; // top center
    
    cards.forEach((card, i) => {
        const angle = startAngle + (i / n) * 360;
        const rad = angle * Math.PI / 180;
        const x = cx + rx * Math.cos(rad) - card.offsetWidth / 2;
        const y = cy + ry * Math.sin(rad) - card.offsetHeight / 2;
        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
    });
}

function setSeatState(agentId, seatState) {
    const seat = document.getElementById(`seat-${agentId}`);
    const status = document.getElementById(`seat-status-${agentId}`);
    if (!seat || !status) return;

    seat.classList.remove("speaking", "done", "waiting");
    if (seatState === "speaking") {
        seat.classList.add("speaking");
        status.textContent = "";
    } else if (seatState === "done") {
        seat.classList.add("done");
        status.textContent = "✓ 已发言";
    } else if (seatState === "waiting") {
        seat.classList.add("waiting");
        status.textContent = "等待中";
    } else {
        status.textContent = "";
    }
}

function setMeetingStatus(text) {
    const statusEl = document.getElementById("meeting-status");
    if (statusEl) {
        statusEl.querySelector(".status-text").textContent = text;
    }
}

function appendMeetingMsg(type, icon, name, role, content) {
    // Remove welcome if present
    const welcome = elements.meetingMessages.querySelector(".meeting-welcome");
    if (welcome) welcome.remove();

    const div = document.createElement("div");
    div.className = `meeting-msg ${type === "user" ? "user-msg" : ""}`;

    const formattedContent = type === "agent" ? formatMarkdown(content) : escapeHtml(content);
    
    // Find agent color
    const agent = state.meetingAgents.find(a => a.meeting_name === name);
    const color = agent ? (CHARACTER_COLORS[agent.id] || "#a78bfa") : "#818cf8";
    
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

    div.style.setProperty("--msg-color", type === "user" ? "#818cf8" : color);
    div.innerHTML = `
        <div class="msg-avatar">${icon}</div>
        <div class="msg-body">
            <div class="msg-header">
                <span class="msg-name">${escapeHtml(name)}</span>
                ${role ? `<span class="msg-role">${escapeHtml(role)}</span>` : ""}
                <span class="msg-time">${time}</span>
            </div>
            <div class="msg-content">${formattedContent}</div>
        </div>
    `;

    elements.meetingMessages.appendChild(div);
    elements.meetingMessages.scrollTop = elements.meetingMessages.scrollHeight;
}

function showMeetingTyping(name) {
    const id = "meeting-typing-" + Date.now();
    const agent = state.meetingAgents.find(a => a.meeting_name === name);
    const color = agent ? (CHARACTER_COLORS[agent.id] || "#a78bfa") : "#a78bfa";
    
    const div = document.createElement("div");
    div.className = "meeting-typing";
    div.id = id;
    div.style.setProperty("--typing-color", color);
    div.innerHTML = `
        <span>${escapeHtml(name)} 正在发言</span>
        <div class="typing-dots"><span></span><span></span><span></span></div>
    `;
    elements.meetingMessages.appendChild(div);
    elements.meetingMessages.scrollTop = elements.meetingMessages.scrollHeight;
    return id;
}

function removeMeetingTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

async function meetingSend() {
    const rawMessage = elements.meetingInput.value.trim();
    if (!rawMessage || state.isLoading) return;

    state.isLoading = true;
    elements.meetingInput.value = "";
    elements.btnMeetingSend.disabled = true;
    elements.meetingInput.disabled = true;
    hideMentionPopup();

    // 解析 @ 提及
    const { cleanMessage, mentionedIds } = parseMentions(rawMessage);
    const displayMsg = rawMessage;

    // Show user message
    appendMeetingMsg("user", "👤", "你", "", displayMsg);
    setMeetingStatus("路由分析中...");

    // 请求智能路由
    let targetAgents = mentionedIds;
    let routeMode = mentionedIds.length > 0 ? "mention" : "smart";
    if (!targetAgents.length) {
        try {
            const routeRes = await fetch("/api/chat/route", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: cleanMessage, target_agents: [] })
            });
            const routeData = await routeRes.json();
            targetAgents = routeData.routed_agents || [];
            routeMode = routeData.route_mode || "smart";
        } catch (e) {
            // 回退：全员发言
            targetAgents = state.meetingAgents.map(a => a.id).filter(id => id !== "arrodes");
            routeMode = "fallback";
        }
    }

    // 显示路由指示器
    showRouteIndicator(targetAgents, routeMode);

    const msgToSend = cleanMessage || rawMessage;
    const meetingLog = [{
        role: "user", name: "你", icon: "👤", content: displayMsg, meeting_title: ""
    }];

    // 设置座位状态：目标设为 waiting，其余设为 skipped
    state.meetingAgents.forEach(a => {
        if (targetAgents.includes(a.id)) {
            setSeatState(a.id, "waiting");
        } else {
            setSeatState(a.id, "skipped");
        }
    });

    setMeetingStatus(`${targetAgents.length} 位成员发言中...`);

    // 依次调用目标 Agent
    const agentsToCall = state.meetingAgents.filter(a => targetAgents.includes(a.id));
    for (const agent of agentsToCall) {
        setSeatState(agent.id, "speaking");
        const typingId = showMeetingTyping(agent.meeting_name);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msgToSend, agent_id: agent.id })
            });
            const data = await res.json();
            removeMeetingTyping(typingId);

            const reply = data.error ? `⚠️ ${data.error}` : data.reply;
            appendMeetingMsg("agent", agent.meeting_icon, agent.meeting_name, agent.name, reply);
            meetingLog.push({
                role: "agent", name: agent.meeting_name, icon: agent.meeting_icon,
                content: reply, meeting_title: agent.meeting_title, agent_id: agent.id
            });
        } catch (err) {
            removeMeetingTyping(typingId);
            const errMsg = `⚠️ 网络错误: ${err.message}`;
            appendMeetingMsg("agent", agent.meeting_icon, agent.meeting_name, agent.name, errMsg);
            meetingLog.push({
                role: "agent", name: agent.meeting_name, icon: agent.meeting_icon,
                content: errMsg, meeting_title: agent.meeting_title, agent_id: agent.id
            });
        }

        setSeatState(agent.id, "done");
    }

    setMeetingStatus("讨论完成 ✓");

    // Auto-save discussion
    try {
        const saveRes = await fetch("/api/discussion/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: msgToSend, messages: meetingLog })
        });
        const saveData = await saveRes.json();
        state.currentDiscussionId = saveData.id;
        showMeetingSaveBar(saveData.id, msgToSend, meetingLog);
    } catch (err) {
        console.error("自动保存讨论失败:", err);
    }

    // Reset
    state.isLoading = false;
    elements.btnMeetingSend.disabled = false;
    elements.meetingInput.disabled = false;
    elements.meetingInput.focus();

    setTimeout(() => {
        state.meetingAgents.forEach(a => setSeatState(a.id, "idle"));
        setMeetingStatus("等待议题");
    }, 3000);
}

// ========================================
// @ 提及系统
// ========================================

// 角色名称→ID 映射（含别名）
function buildMentionMap() {
    const map = {};
    state.meetingAgents.forEach(a => {
        // 软件角色名
        map[a.name] = a.id;
        // 塔罗会名
        map[a.meeting_name] = a.id;
        // 简称（去掉「」和·前后）
        const short = a.meeting_name.replace(/[「」]/g, "").split("·");
        short.forEach(s => { if (s.length >= 2) map[s] = a.id; });
    });
    return map;
}

function parseMentions(message) {
    const mentionMap = buildMentionMap();
    const mentionedIds = [];
    let cleanMessage = message;
    // 匹配 @xxx 格式（贪婪匹配到空格或末尾）
    const regex = /@([^\s@]+)/g;
    let match;
    while ((match = regex.exec(message)) !== null) {
        const name = match[1];
        // 精确匹配
        if (mentionMap[name]) {
            if (!mentionedIds.includes(mentionMap[name])) {
                mentionedIds.push(mentionMap[name]);
            }
            cleanMessage = cleanMessage.replace(match[0], "").trim();
        } else {
            // 模糊匹配
            for (const [key, id] of Object.entries(mentionMap)) {
                if (key.includes(name) || name.includes(key)) {
                    if (!mentionedIds.includes(id)) mentionedIds.push(id);
                    cleanMessage = cleanMessage.replace(match[0], "").trim();
                    break;
                }
            }
        }
    }
    cleanMessage = cleanMessage.replace(/\s+/g, " ").trim();
    return { cleanMessage: cleanMessage || message, mentionedIds };
}

function showRouteIndicator(agentIds, mode) {
    // Remove existing indicator
    const existing = document.querySelector(".route-indicator");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.className = "route-indicator";

    const label = document.createElement("span");
    label.className = "route-label";
    label.textContent = mode === "mention" ? "📢 指定发言：" : "🧠 智能路由：";
    container.appendChild(label);

    agentIds.forEach(id => {
        const agent = state.meetingAgents.find(a => a.id === id);
        if (!agent) return;
        const tag = document.createElement("span");
        tag.className = "route-tag";
        const color = CHARACTER_COLORS[id] || "#a78bfa";
        tag.style.background = `${color}20`;
        tag.style.color = color;
        tag.style.borderColor = `${color}40`;
        tag.textContent = `${agent.meeting_icon} ${agent.meeting_name}`;
        container.appendChild(tag);
    });

    elements.meetingMessages.appendChild(container);
    elements.meetingMessages.scrollTop = elements.meetingMessages.scrollHeight;
}

// @ 弹窗逻辑
let mentionPopupIndex = -1;

function setupMentionListener() {
    elements.meetingInput.addEventListener("input", handleMentionInput);
    elements.meetingInput.addEventListener("keydown", handleMentionKeydown);
}

function handleMentionInput() {
    const val = elements.meetingInput.value;
    const cursor = elements.meetingInput.selectionStart;
    // 找到光标前最近的 @
    const before = val.substring(0, cursor);
    const atIdx = before.lastIndexOf("@");
    if (atIdx === -1 || (atIdx > 0 && before[atIdx - 1] !== " " && before[atIdx - 1] !== "\n")) {
        hideMentionPopup();
        return;
    }
    const query = before.substring(atIdx + 1).toLowerCase();
    showMentionPopup(query, atIdx);
}

function handleMentionKeydown(e) {
    const popup = document.getElementById("mention-popup");
    if (popup.classList.contains("hidden")) return;
    const items = popup.querySelectorAll(".mention-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        mentionPopupIndex = Math.min(mentionPopupIndex + 1, items.length - 1);
        updateMentionActive(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        mentionPopupIndex = Math.max(mentionPopupIndex - 1, 0);
        updateMentionActive(items);
    } else if (e.key === "Enter" && !e.shiftKey && mentionPopupIndex >= 0) {
        e.preventDefault();
        const selected = items[mentionPopupIndex];
        if (selected) selectMention(selected.dataset.name);
    } else if (e.key === "Escape") {
        hideMentionPopup();
    }
}

function updateMentionActive(items) {
    items.forEach((it, i) => it.classList.toggle("active", i === mentionPopupIndex));
}

function showMentionPopup(query, atIdx) {
    const popup = document.getElementById("mention-popup");
    // 过滤匹配的角色（不含阿罗德斯）
    const candidates = state.meetingAgents.filter(a => {
        if (a.id === "arrodes") return false;
        const q = query.toLowerCase();
        return !q || a.name.toLowerCase().includes(q)
            || a.meeting_name.toLowerCase().includes(q)
            || a.id.toLowerCase().includes(q);
    });

    if (!candidates.length) { hideMentionPopup(); return; }

    popup.innerHTML = candidates.map(a => {
        const color = CHARACTER_COLORS[a.id] || "#a78bfa";
        return `<div class="mention-item" data-name="${a.name}" data-id="${a.id}" onclick="selectMention('${a.name}')">
            <span class="mention-item-icon">${a.meeting_icon}</span>
            <div class="mention-item-info">
                <div class="mention-item-name" style="color:${color}">${a.meeting_name}</div>
                <div class="mention-item-title">${a.name} · ${a.meeting_title}</div>
            </div>
        </div>`;
    }).join("");

    mentionPopupIndex = 0;
    updateMentionActive(popup.querySelectorAll(".mention-item"));
    popup.classList.remove("hidden");
}

function hideMentionPopup() {
    document.getElementById("mention-popup").classList.add("hidden");
    mentionPopupIndex = -1;
}

function selectMention(name) {
    const val = elements.meetingInput.value;
    const cursor = elements.meetingInput.selectionStart;
    const before = val.substring(0, cursor);
    const atIdx = before.lastIndexOf("@");
    const after = val.substring(cursor);
    const newVal = before.substring(0, atIdx) + `@${name} ` + after;
    elements.meetingInput.value = newVal;
    elements.meetingInput.selectionStart = elements.meetingInput.selectionEnd = atIdx + name.length + 2;
    elements.meetingInput.focus();
    hideMentionPopup();
}

function showMeetingSaveBar(discId, topic, messages) {
    // Remove existing save bar
    const existing = document.querySelector(".meeting-save-bar");
    if (existing) existing.remove();

    const bar = document.createElement("div");
    bar.className = "meeting-save-bar";
    bar.innerHTML = `
        <span>✅ 讨论已自动保存</span>
        <button class="btn-small" onclick="viewDiscussionMarkdown('${discId}')">📝 查看纪要</button>
        <button class="btn-small" id="btn-summarize" onclick="requestSummary('${discId}')">🪞 阿罗德斯总结</button>
    `;

    // Insert before the input area
    const inputArea = document.querySelector(".meeting-input-area");
    inputArea.parentNode.insertBefore(bar, inputArea);
}

// ========================================
// 普通全员讨论 (legacy, now redirects to meeting)
// ========================================

async function askAllAgents() {
    enterMeeting();
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
        // Also reset meeting messages
        elements.meetingMessages.innerHTML = `
            <div class="meeting-welcome">
                <div class="welcome-glyph">
                    <span class="glyph-main">🌫️</span>
                    <div class="glyph-rings">
                        <div class="glyph-ring r1"></div>
                        <div class="glyph-ring r2"></div>
                        <div class="glyph-ring r3"></div>
                    </div>
                </div>
                <h3 class="welcome-title">灰雾弥漫，长桌显现</h3>
                <p class="welcome-desc">七位非凡者已就座，等待您的议题</p>
                <div class="welcome-divider">
                    <span></span><span class="divider-gem">◆</span><span></span>
                </div>
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
            if (data.dev_doc) {
                appendMessage("agent", "💻", data.dev_doc, "代码工程师 - 开发文档");
            }
            appendGenerateStatus(data);
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

    let html = `
        <div class="status-header">
            ✅ 项目「${escapeHtml(data.project_name)}」生成完成！共 ${createdCount + 1} 个文件
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
// 讨论记录管理
// ========================================

function openHistoryModal() {
    elements.historyModal.classList.remove("hidden");
    loadHistoryList();
}

function closeHistoryModal() {
    elements.historyModal.classList.add("hidden");
}

async function loadHistoryList() {
    elements.historyList.innerHTML = '<p class="loading-text">加载中...</p>';

    try {
        const res = await fetch("/api/discussion/list");
        const data = await res.json();

        if (!data.discussions || data.discussions.length === 0) {
            elements.historyList.innerHTML = '<p class="loading-text">暂无讨论记录。进入圆桌会议开始第一次讨论吧！</p>';
            return;
        }

        elements.historyList.innerHTML = data.discussions.map(d => `
            <div class="history-card">
                <div class="history-info" onclick="viewDiscussionMarkdown('${d.id}')">
                    <div class="history-topic">🌫️ ${escapeHtml(d.topic)}</div>
                    <div class="history-meta">
                        <span>🕐 ${d.display_time}</span>
                        <span>💬 ${d.message_count} 条发言</span>
                        ${d.has_summary ? '<span>🪞 已总结</span>' : ''}
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-small btn-secondary" onclick="viewDiscussionMarkdown('${d.id}')">📝 查看</button>
                    <button class="btn btn-small btn-primary" onclick="resumeDiscussion('${d.id}')">🔄 回到</button>
                </div>
            </div>
        `).join("");
    } catch (err) {
        elements.historyList.innerHTML = `<p class="loading-text">加载失败: ${err.message}</p>`;
    }
}

async function viewDiscussionMarkdown(discId) {
    state.viewingDiscussionId = discId;
    elements.markdownModal.classList.remove("hidden");
    elements.markdownContent.innerHTML = '<p class="loading-text">加载中...</p>';

    try {
        const res = await fetch(`/api/discussion/markdown?id=${encodeURIComponent(discId)}`);
        const data = await res.json();

        if (data.error) {
            elements.markdownContent.innerHTML = `<p>错误: ${data.error}</p>`;
        } else {
            elements.markdownContent.innerHTML = formatMarkdown(data.content);
        }
    } catch (err) {
        elements.markdownContent.innerHTML = `<p>加载失败: ${err.message}</p>`;
    }
}

function closeMarkdownModal() {
    elements.markdownModal.classList.add("hidden");
}

async function resumeDiscussion(discId) {
    closeHistoryModal();
    closeMarkdownModal();

    try {
        const res = await fetch(`/api/discussion/load?id=${encodeURIComponent(discId)}`);
        const data = await res.json();

        if (data.error) {
            alert("加载讨论失败: " + data.error);
            return;
        }

        // Enter meeting room
        enterMeeting();

        // Clear existing messages
        elements.meetingMessages.innerHTML = "";

        // Replay messages
        for (const msg of data.messages) {
            if (msg.role === "user") {
                appendMeetingMsg("user", "👤", "你", "", msg.content);
            } else {
                appendMeetingMsg("agent", msg.icon, msg.name, "", msg.content);
            }
        }

        // Show summary if exists
        if (data.summary) {
            appendMeetingMsg("agent", "🪞", "阿罗德斯", "魔镜1-42", data.summary);
        }

        state.currentDiscussionId = discId;
    } catch (err) {
        alert("加载失败: " + err.message);
    }
}

function resumeCurrentDiscussion() {
    if (state.viewingDiscussionId) {
        resumeDiscussion(state.viewingDiscussionId);
    }
}

async function requestSummary(discId) {
    const btn = document.getElementById("btn-summarize");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "🪞 总结中...";
    }

    // Show Arrodes typing in meeting
    const arrodes = state.meetingAgents.find(a => a.id === "arrodes");
    const arrodesIcon = arrodes ? arrodes.meeting_icon : "🪞";
    const typingId = showMeetingTyping("阿罗德斯");

    // Set Arrodes seat to speaking
    setSeatState("arrodes", "speaking");

    try {
        const loadRes = await fetch(`/api/discussion/load?id=${encodeURIComponent(discId)}`);
        const disc = await loadRes.json();

        const res = await fetch("/api/discussion/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: discId,
                topic: disc.topic,
                messages: disc.messages
            })
        });
        const data = await res.json();
        removeMeetingTyping(typingId);

        if (data.summary) {
            appendMeetingMsg("agent", arrodesIcon, "阿罗德斯", "魔镜1-42 · 会议总结", data.summary);
        } else {
            appendMeetingMsg("agent", "⚠️", "阿罗德斯", "", data.error || "总结失败");
        }
    } catch (err) {
        removeMeetingTyping(typingId);
        appendMeetingMsg("agent", "⚠️", "阿罗德斯", "", `总结失败: ${err.message}`);
    }

    setSeatState("arrodes", "done");
    if (btn) {
        btn.textContent = "✅ 已总结";
    }
    setTimeout(() => setSeatState("arrodes", "idle"), 3000);
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

// ========================================
// 用户设置 & 登出
// ========================================

async function openSettingsModal() {
    elements.settingsModal.classList.remove("hidden");
    elements.settingsApiKey.value = "";
    elements.settingsError.style.display = "none";
    elements.settingsSuccess.style.display = "none";
    // 刷新当前 key 状态
    try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        elements.settingsMaskedKey.textContent = data.user.masked_key || "未配置";
    } catch (e) {
        elements.settingsMaskedKey.textContent = "获取失败";
    }
}

function closeSettingsModal() {
    elements.settingsModal.classList.add("hidden");
}

async function saveApiKey() {
    const apiKey = elements.settingsApiKey.value.trim();
    if (!apiKey) {
        elements.settingsError.textContent = "请输入 API Key";
        elements.settingsError.style.display = "block";
        elements.settingsSuccess.style.display = "none";
        return;
    }
    try {
        const res = await fetch("/api/auth/apikey", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ api_key: apiKey, provider: "groq" })
        });
        const data = await res.json();
        if (data.ok) {
            elements.settingsMaskedKey.textContent = data.masked_key;
            elements.settingsSuccess.textContent = "✅ API Key 保存成功！";
            elements.settingsSuccess.style.display = "block";
            elements.settingsError.style.display = "none";
            elements.settingsApiKey.value = "";
            // 移除未配置横幅
            const banner = document.querySelector(".apikey-banner");
            if (banner) banner.remove();
        } else {
            elements.settingsError.textContent = data.error || "保存失败";
            elements.settingsError.style.display = "block";
            elements.settingsSuccess.style.display = "none";
        }
    } catch (err) {
        elements.settingsError.textContent = "网络错误: " + err.message;
        elements.settingsError.style.display = "block";
        elements.settingsSuccess.style.display = "none";
    }
}

async function handleLogout() {
    if (!confirm("确定要退出登录吗？")) return;
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    window.location.href = "/login";
}

// 全局 fetch 拦截：如果返回 401 自动跳转到登录
const _origFetch = window.fetch;
window.fetch = async function(...args) {
    const res = await _origFetch.apply(this, args);
    if (res.status === 401 && !args[0].toString().includes("/api/auth/")) {
        window.location.href = "/login";
    }
    return res;
};

// 启动
init();
