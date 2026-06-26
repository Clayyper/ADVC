let currentUser = null;

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Erro na requisição.");
  }

  return data;
}

function msg(id, text, type = "ok") {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + type;
}

function showPage(page) {
  ["buscar", "github", "indice", "ia", "sobre", "admin"].forEach(p => {
    $("page-" + p).classList.add("hidden");
  });

  $("page-" + page).classList.remove("hidden");

  document.querySelectorAll(".menu button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  if (page === "admin") loadUsers();
  if (page === "github") loadSettings();
  if (page === "indice") loadSettings();
}

function switchTab(type) {
  $("tab-admin").classList.toggle("active", type === "admin");
  $("tab-user").classList.toggle("active", type === "user");

  $("form-admin").classList.toggle("hidden", type !== "admin");
  $("form-user").classList.toggle("hidden", type !== "user");
}

function openApp(user) {
  currentUser = user;
  $("login-screen").classList.add("hidden");
  $("app-screen").classList.remove("hidden");

  $("logged-as").textContent =
    user.role === "admin" ? "admin (Administrador)" : `${user.name} (${user.code})`;

  $("admin-menu-btn").style.display = user.role === "admin" ? "block" : "none";

  showPage("buscar");
}

async function loginAdmin(e) {
  e.preventDefault();

  try {
    await api("/api/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({
        adminUser: $("admin-user").value.trim(),
        adminPassword: $("admin-pass").value.trim()
      })
    });

    openApp({ role: "admin", name: "Administrador", code: "admin" });
  } catch (err) {
    msg("login-msg", err.message, "error");
  }
}

async function loginUser(e) {
  e.preventDefault();

  try {
    const data = await api("/api/auth/user/login", {
      method: "POST",
      body: JSON.stringify({
        userCode: $("login-user-code").value.trim(),
        userToken: $("login-user-token").value.trim()
      })
    });

    openApp({
      role: "user",
      name: data.user.name,
      code: data.user.userCode
    });
  } catch (err) {
    msg("login-msg", err.message, "error");
  }
}

async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  location.reload();
}

async function createUser() {
  try {
    const data = await api("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        name: $("new-user-name").value.trim(),
        userCode: $("new-user-code").value.trim()
      })
    });

    msg("create-user-msg", `Usuário criado. Token: ${data.user.userToken}`, "ok");
    $("new-user-name").value = "";
    $("new-user-code").value = "";
    loadUsers();
  } catch (err) {
    msg("create-user-msg", err.message, "error");
  }
}

async function loadUsers() {
  if (!currentUser || currentUser.role !== "admin") return;

  try {
    const data = await api("/api/admin/users");
    const box = $("users-container");

    if (data.users.length === 0) {
      box.innerHTML = "Nenhum usuário cadastrado.";
      return;
    }

    box.innerHTML = data.users.map(u => `
      <div class="item">
        <p><strong>${escapeHTML(u.name)}</strong></p>
        <p>Código: <span class="code">${escapeHTML(u.userCode)}</span></p>
        <p>Token: <span class="badge">${escapeHTML(u.userToken)}</span></p>
        <p>GitHub: ${escapeHTML(u.githubLogin || "-")}</p>
        <p>Repo: ${escapeHTML(u.selectedRepo || "-")}</p>
        <p>Índice: ${escapeHTML(u.indexPath || "-")}</p>
        <button class="btn btn-danger" onclick="deleteUser(${u.id})">Excluir</button>
      </div>
    `).join("");
  } catch (err) {
    $("users-container").textContent = err.message;
  }
}

async function deleteUser(id) {
  if (!confirm("Excluir usuário?")) return;

  await api("/api/admin/users/" + id, { method: "DELETE" });
  loadUsers();
}

async function changeAdminPassword() {
  try {
    await api("/api/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ newPassword: $("new-admin-pass").value.trim() })
    });

    $("new-admin-pass").value = "";
    msg("admin-pass-msg", "Senha alterada.", "ok");
  } catch (err) {
    msg("admin-pass-msg", err.message, "error");
  }
}

function connectGithub() {
  location.href = "/auth/github/connect";
}

async function loadSettings() {
  if (!currentUser || currentUser.role !== "user") return;

  try {
    const data = await api("/api/user/settings");

    if (data.github) {
      msg(
        "github-status",
        `GitHub conectado: ${data.github.githubLogin}`,
        "ok"
      );
    }

    $("index-path").value = data.settings.indexPath || "";
  } catch (err) {
    console.error(err);
  }
}

async function loadRepos() {
  try {
    const data = await api("/auth/github/repos");
    const box = $("repos-container");

    if (!data.repos || data.repos.length === 0) {
      box.innerHTML = "Nenhum repositório encontrado.";
      return;
    }

    box.innerHTML = data.repos.map(repo => `
      <div class="item">
        <p><strong>${escapeHTML(repo.fullName)}</strong></p>
        <p>${repo.private ? "Privado" : "Público"}</p>
        <button class="btn" onclick="selectRepo('${escapeAttr(repo.fullName)}','${escapeAttr(repo.htmlUrl)}')">
          Usar este repositório
        </button>
      </div>
    `).join("");
  } catch (err) {
    msg("github-status", err.message, "error");
  }
}

async function selectRepo(fullName, htmlUrl) {
  try {
    await api("/api/user/settings/repository", {
      method: "POST",
      body: JSON.stringify({ repoFullName: fullName, repoUrl: htmlUrl })
    });

    msg("github-status", "Repositório selecionado: " + fullName, "ok");
  } catch (err) {
    msg("github-status", err.message, "error");
  }
}

async function saveIndex() {
  try {
    await api("/api/user/settings/index", {
      method: "POST",
      body: JSON.stringify({ indexPath: $("index-path").value.trim() })
    });

    msg("index-msg", "Índice salvo.", "ok");
  } catch (err) {
    msg("index-msg", err.message, "error");
  }
}

async function rebuildIndex() {
  try {
    const data = await api("/api/user/index/rebuild", { method: "POST" });
    msg("index-msg", data.message, "ok");
  } catch (err) {
    msg("index-msg", err.message, "error");
  }
}

async function search() {
  const q = $("search-input").value.trim();

  try {
    const data = await api("/api/user/search?q=" + encodeURIComponent(q));
    $("results-container").innerHTML = data.results.map(r => `
      <div class="item">
        <p><strong>${escapeHTML(r.title)}</strong></p>
        <p>${escapeHTML(r.snippet)}</p>
        <p class="code">${escapeHTML(r.path)}</p>
        <button class="btn" onclick="window.open('${escapeAttr(r.path)}','_blank')">Abrir</button>
      </div>
    `).join("");
  } catch (err) {
    $("results-container").innerHTML = `<p>${escapeHTML(err.message)}</p>`;
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll("`", "");
}

document.addEventListener("DOMContentLoaded", async () => {
  $("tab-admin").onclick = () => switchTab("admin");
  $("tab-user").onclick = () => switchTab("user");

  $("form-admin").onsubmit = loginAdmin;
  $("form-user").onsubmit = loginUser;

  $("btn-logout").onclick = logout;

  document.querySelectorAll(".menu button").forEach(btn => {
    btn.onclick = () => showPage(btn.dataset.page);
  });

  $("btn-create-user").onclick = createUser;
  $("btn-change-admin-pass").onclick = changeAdminPassword;
  $("btn-connect-github").onclick = connectGithub;
  $("btn-load-repos").onclick = loadRepos;
  $("btn-save-index").onclick = saveIndex;
  $("btn-rebuild-index").onclick = rebuildIndex;
  $("btn-search").onclick = search;

  const params = new URLSearchParams(location.search);
  if (params.get("github") === "connected") {
    history.replaceState({}, "", "/");
  }
});
