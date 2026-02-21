const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const API_BASE = IS_LOCAL ? "http://127.0.0.1:8000" : "https://securestegochat.onrender.com";
const WS_BASE = IS_LOCAL ? "ws://127.0.0.1:8000" : "wss://securestegochat.onrender.com";

function getToken() {
  return localStorage.getItem("token") || "";
}

function getCurrentUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

function setupAuthPage() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const showLogin = document.getElementById("show-login");
  const showRegister = document.getElementById("show-register");
  const error = document.getElementById("auth-error");

  const activate = (mode) => {
    const loginMode = mode === "login";
    loginForm.classList.toggle("active", loginMode);
    registerForm.classList.toggle("active", !loginMode);
    showLogin.classList.toggle("active", loginMode);
    showRegister.classList.toggle("active", !loginMode);
    error.textContent = "";
  };

  showLogin.addEventListener("click", () => activate("login"));
  showRegister.addEventListener("click", () => activate("register"));

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.textContent = "";
    const form = new FormData(loginForm);
    try {
      const data = await api("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      location.href = "chat.html";
    } catch (err) {
      error.textContent = err.message;
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.textContent = "";
    const form = new FormData(registerForm);
    try {
      const data = await api("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      location.href = "chat.html";
    } catch (err) {
      error.textContent = err.message;
    }
  });
}

function escapeHtml(value) {
  return (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function setupChatPage() {
  const user = getCurrentUser();
  const token = getToken();
  if (!user || !token) {
    location.href = "index.html";
    return;
  }

  const usersList = document.getElementById("users-list");
  const messagesEl = document.getElementById("messages");
  const titleEl = document.getElementById("chat-title");
  const subtitleEl = document.getElementById("chat-subtitle");
  const chatAvatar = document.getElementById("chat-avatar");
  const chatError = document.getElementById("chat-error");
  const textForm = document.getElementById("text-form");
  const textInput = document.getElementById("text-input");
  const imageForm = document.getElementById("image-form");
  const imageInput = document.getElementById("image-input");
  const userSearch = document.getElementById("user-search");
  const noUsersMsg = document.getElementById("no-users");
  const fileNameDisplay = document.getElementById("file-name-display");

  document.getElementById("me-name").textContent = `@${user.username}`;
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    location.href = "index.html";
  });

  // File name display
  imageInput.addEventListener("change", () => {
    fileNameDisplay.textContent = imageInput.files.length ? imageInput.files[0].name : "";
  });

  // Security logs button
  document.getElementById("security-logs-btn").addEventListener("click", openSecurityLogs);

  let activePeer = null;
  let allUsers = [];

  // ═══════ RENDER MESSAGE (WhatsApp style) ═══════
  const renderMessage = (msg) => {
    const mine = msg.sender_id === user.id;
    const isSuspicious = msg.is_suspicious && msg.message_type === "image";
    const time = formatTime(msg.created_at);

    let body;
    if (msg.message_type === "image" && isSuspicious) {
      body = `
        <div class="stego-image-wrap" data-msg-id="${msg.id}">
          <img src="${API_BASE}${msg.content}" alt="image">
          <div class="stego-overlay">
            <div class="stego-badge">
              <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              Suspicious
            </div>
            <div class="stego-hint">Click to inspect</div>
          </div>
        </div>`;
    } else if (msg.message_type === "image") {
      body = `<img src="${API_BASE}${msg.content}" alt="image">`;
    } else {
      body = `<div>${escapeHtml(msg.content)}</div>`;
    }

    const html = `
      <div class="msg ${mine ? "me" : ""}">
        ${body}
        <div class="msg-time">${escapeHtml(time)}</div>
      </div>
    `;
    messagesEl.insertAdjacentHTML("beforeend", html);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Attach click handler for suspicious images
    if (isSuspicious) {
      const wrap = messagesEl.querySelector(`.stego-image-wrap[data-msg-id="${msg.id}"]`);
      if (wrap) {
        wrap.addEventListener("click", () => openStegoDetail(msg.id));
      }
    }
  };

  // ═══════ STEGO DETAIL MODAL ═══════
  const openStegoDetail = async (msgId) => {
    // Create modal immediately with loading state
    const backdrop = document.createElement("div");
    backdrop.className = "stego-modal-backdrop";
    backdrop.innerHTML = `
      <div class="stego-modal">
        <div class="stego-modal-header">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
            Threat Analysis
          </h3>
          <button class="stego-modal-close" title="Close">✕</button>
        </div>
        <div class="stego-modal-body">
          <div class="stego-info-grid">
            <div class="stego-info-card">
              <div class="card-label">Status</div>
              <div class="card-value danger">⚠ Suspicious</div>
            </div>
            <div class="stego-info-card">
              <div class="card-label">Language</div>
              <div class="card-value lang" id="smod-lang">Loading…</div>
            </div>
            <div class="stego-info-card" style="grid-column:span 2">
              <div class="card-label">Detection Confidence</div>
              <div class="card-value" id="smod-conf">—</div>
              <div class="confidence-bar-lg"><div class="confidence-bar-lg-fill" id="smod-conf-bar" style="width:0%"></div></div>
            </div>
          </div>
          <button class="stego-view-code-btn" id="smod-code-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6z"/></svg>
            View Hidden Code
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    // Close handlers
    const closeModal = () => backdrop.remove();
    backdrop.querySelector(".stego-modal-close").addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
    const escHandler = (e) => { if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", escHandler); } };
    document.addEventListener("keydown", escHandler);

    // Fetch data
    try {
      const data = await api(`/api/messages/${msgId}/hidden-code`);
      const langEl = backdrop.querySelector("#smod-lang");
      const confEl = backdrop.querySelector("#smod-conf");
      const confBar = backdrop.querySelector("#smod-conf-bar");
      const codeBtn = backdrop.querySelector("#smod-code-btn");

      if (langEl) langEl.textContent = data.detected_language || "unknown";
      const confMatch = (data.reason || "").match(/detector_confidence=([\d.]+)%/);
      const conf = confMatch ? parseFloat(confMatch[1]) : 0;
      if (confEl) confEl.textContent = `${conf}%`;
      if (confBar) setTimeout(() => confBar.style.width = `${conf}%`, 100);

      codeBtn.addEventListener("click", () => {
        closeModal();
        openCodeModal(data.detected_language, data.extracted_text);
      });
    } catch {
      const langEl = backdrop.querySelector("#smod-lang");
      if (langEl) langEl.textContent = "Error loading";
    }
  };

  // ═══════ CODE MODAL ═══════
  const openCodeModal = (language, code) => {
    const lang = language || "unknown";
    const codeText = code || "(no code extracted)";

    const backdrop = document.createElement("div");
    backdrop.className = "code-modal-backdrop";
    backdrop.innerHTML = `
      <div class="code-modal">
        <div class="code-modal-header">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6z"/></svg>
            Extracted Hidden Code
            <span class="lang-tag">${escapeHtml(lang)}</span>
          </h3>
          <button class="code-modal-close" title="Close">✕</button>
        </div>
        <div class="code-modal-body">
          <pre>${escapeHtml(codeText)}</pre>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const closeModal = () => backdrop.remove();
    backdrop.querySelector(".code-modal-close").addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
    const escHandler = (e) => { if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", escHandler); } };
    document.addEventListener("keydown", escHandler);
  };

  // ═══════ LOAD MESSAGES ═══════
  const loadMessages = async () => {
    if (!activePeer) return;
    messagesEl.innerHTML = "";
    const rows = await api(`/api/messages/${activePeer.id}`);
    rows.forEach(renderMessage);
  };

  // ═══════ RENDER USERS ═══════
  const renderUsers = (users) => {
    usersList.innerHTML = "";
    if (allUsers.length === 0) {
      noUsersMsg.style.display = "block";
    } else {
      noUsersMsg.style.display = "none";
    }
    if (users.length === 0 && allUsers.length > 0) {
      const empty = document.createElement("li");
      empty.style.cssText = "text-align:center;padding:16px;color:var(--text-muted);font-size:13px;";
      empty.textContent = "No matching users";
      usersList.appendChild(empty);
      return;
    }
    users.forEach((u) => {
      const item = document.createElement("li");
      item.className = `user-item ${activePeer && activePeer.id === u.id ? "active" : ""}`;
      item.innerHTML = `
        <div class="user-avatar">${escapeHtml(u.username.charAt(0))}</div>
        <span>${escapeHtml(u.username)}</span>
      `;
      item.addEventListener("click", async () => {
        activePeer = u;
        titleEl.textContent = u.username;
        subtitleEl.textContent = "Online";
        chatAvatar.textContent = u.username.charAt(0).toUpperCase();
        renderUsers(filterUsers());
        await loadMessages();
      });
      usersList.appendChild(item);
    });
  };

  const filterUsers = () => {
    const query = (userSearch.value || "").trim().toLowerCase();
    if (!query) return allUsers;
    return allUsers.filter((u) => u.username.toLowerCase().includes(query));
  };

  userSearch.addEventListener("input", () => {
    renderUsers(filterUsers());
  });

  // ═══════ WEBSOCKET ═══════
  const openWebSocket = () => {
    const ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(token)}`);

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type !== "message.created") return;
      const msg = payload.message;

      const relevant = activePeer && (
        (msg.sender_id === activePeer.id && msg.receiver_id === user.id) ||
        (msg.sender_id === user.id && msg.receiver_id === activePeer.id)
      );

      if (relevant) {
        renderMessage(msg);
      }
    };

    ws.onopen = () => {
      setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 20000);
    };

    return ws;
  };

  // ═══════ SEND TEXT ═══════
  textForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    chatError.textContent = "";
    if (!activePeer) {
      chatError.textContent = "Select a user first.";
      return;
    }
    const content = textInput.value.trim();
    if (!content) return;
    try {
      await api("/api/messages/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: activePeer.id, content }),
      });
      textInput.value = "";
    } catch (err) {
      chatError.textContent = err.message;
    }
  });

  // ═══════ SEND IMAGE ═══════
  imageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    chatError.textContent = "";
    if (!activePeer) {
      chatError.textContent = "Select a user first.";
      return;
    }
    if (!imageInput.files.length) {
      chatError.textContent = "Choose an image first.";
      return;
    }

    const data = new FormData();
    data.append("receiver_id", String(activePeer.id));
    data.append("file", imageInput.files[0]);

    try {
      await api("/api/messages/image", {
        method: "POST",
        body: data,
      });
      imageInput.value = "";
      fileNameDisplay.textContent = "";
    } catch (err) {
      chatError.textContent = err.message;
    }
  });

  // ═══════ SECURITY LOGS ═══════
  async function openSecurityLogs() {
    const backdrop = document.createElement("div");
    backdrop.className = "logs-modal-backdrop";
    backdrop.innerHTML = `
      <div class="logs-modal">
        <div class="logs-modal-header">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
            Security Logs
          </h3>
          <button class="stego-modal-close" title="Close">✕</button>
        </div>
        <div class="logs-tabs">
          <button class="logs-tab active" data-filter="all">All Images</button>
          <button class="logs-tab" data-filter="suspicious">Suspicious</button>
          <button class="logs-tab" data-filter="clean">Clean</button>
        </div>
        <div class="logs-body">
          <div class="logs-empty">Loading...</div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const closeModal = () => backdrop.remove();
    backdrop.querySelector(".stego-modal-close").addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
    const escHandler = (e) => { if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", escHandler); } };
    document.addEventListener("keydown", escHandler);

    // Fetch all image messages
    let allImageMsgs = [];
    try {
      // Get all users and their messages to find all images
      const users = await api("/api/users");
      for (const u of users) {
        const msgs = await api(`/api/messages/${u.id}`);
        for (const m of msgs) {
          if (m.message_type === "image") {
            allImageMsgs.push(m);
          }
        }
      }
    } catch {
      // fallback
    }

    // Also get detection logs for extra detail
    let detectionLogs = [];
    try {
      detectionLogs = await api("/api/security/logs");
    } catch {
      // ignore
    }

    const logsBody = backdrop.querySelector(".logs-body");
    const renderLogs = (filter) => {
      let filtered = allImageMsgs;
      if (filter === "suspicious") filtered = allImageMsgs.filter(m => m.is_suspicious);
      if (filter === "clean") filtered = allImageMsgs.filter(m => !m.is_suspicious);

      if (filtered.length === 0) {
        logsBody.innerHTML = `<div class="logs-empty">No ${filter === "all" ? "" : filter + " "}images found</div>`;
        return;
      }

      let rows = filtered.map(m => {
        const status = m.is_suspicious
          ? `<span class="status-badge suspicious">⚠ Suspicious</span>`
          : `<span class="status-badge clean">✔ Clean</span>`;
        const det = detectionLogs.find(d => d.message_id === m.id);
        const lang = det ? det.detected_language || "—" : "—";
        const imgName = m.content.split("/").pop();
        return `
          <tr>
            <td><img src="${API_BASE}${m.content}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;${m.is_suspicious ? "filter:blur(4px);" : ""}"></td>
            <td>${escapeHtml(imgName)}</td>
            <td>${escapeHtml(m.sender_username || "—")}</td>
            <td>${status}</td>
            <td>${escapeHtml(lang)}</td>
            <td>${escapeHtml(m.created_at || "—")}</td>
          </tr>`;
      }).join("");

      logsBody.innerHTML = `
        <table class="logs-table">
          <thead>
            <tr>
              <th></th>
              <th>Image</th>
              <th>Sender</th>
              <th>Status</th>
              <th>Language</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    };

    renderLogs("all");

    // Tab switching
    backdrop.querySelectorAll(".logs-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        backdrop.querySelectorAll(".logs-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderLogs(tab.dataset.filter);
      });
    });
  }

  // ═══════ INIT ═══════
  (async () => {
    try {
      allUsers = await api("/api/users");
      renderUsers(allUsers);
      if (allUsers.length > 0) {
        activePeer = allUsers[0];
        titleEl.textContent = allUsers[0].username;
        subtitleEl.textContent = "Online";
        chatAvatar.textContent = allUsers[0].username.charAt(0).toUpperCase();
        renderUsers(allUsers);
        await loadMessages();
      }
      openWebSocket();
    } catch (err) {
      chatError.textContent = err.message;
    }
  })();
}

const page = document.body.dataset.page;
if (page === "auth") {
  setupAuthPage();
} else if (page === "chat") {
  setupChatPage();
}
