// ========== DATA LOAD ==========
let submissions = JSON.parse(localStorage.getItem("studentSubmissions")) || [];
let users = JSON.parse(localStorage.getItem("portalUsers")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// ========== DEFAULT ADMIN ACCOUNT ==========
const DEFAULT_ADMIN = {
    id: "admin-001",
    name: "Admin",
    email: "admin@aics.edu",
    password: "admin123",
    role: "admin",
    studentId: "ADMIN001"
};

// Create admin if not exists
if (!users.find(u => u.email === DEFAULT_ADMIN.email)) {
    users.push(DEFAULT_ADMIN);
    saveUsers();
}

// ========== SAVE FUNCTIONS ==========
function saveUsers() {
    localStorage.setItem("portalUsers", JSON.stringify(users));
}
function saveData() {
    localStorage.setItem("studentSubmissions", JSON.stringify(submissions));
}
function saveSession(user) {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
}
function clearSession() {
    currentUser = null;
    localStorage.removeItem("currentUser");
}

// ========== SESSION & INIT ==========
function checkSession() {
    if (currentUser) {
        const fresh = users.find(u => u.email === currentUser.email);
        if (!fresh) { clearSession(); }
        else { currentUser = fresh; }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    initializeNavigation();
    initializeForm();
    initializeFilters();
    renderSubmissions();
    renderAdmin();
    updateStatistics();
    updateAuthUI();
});

// ========== AUTH UI ==========
function updateAuthUI() {
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const userDisplay = document.getElementById("userDisplay");
    const navAdmin = document.getElementById("navAdmin");

    if (currentUser) {
        if(loginBtn) loginBtn.style.display = "none";
        if(registerBtn) registerBtn.style.display = "none";
        if(logoutBtn) logoutBtn.style.display = "block";
        if(userDisplay) {
            userDisplay.style.display = "block";
            userDisplay.textContent = `${currentUser.name} (${currentUser.role})`;
        }
        if(navAdmin) navAdmin.style.display = currentUser.role === "admin" ? "block" : "none";
    } else {
        if(loginBtn) loginBtn.style.display = "block";
        if(registerBtn) registerBtn.style.display = "block";
        if(logoutBtn) logoutBtn.style.display = "none";
        if(userDisplay) userDisplay.style.display = "none";
        if(navAdmin) navAdmin.style.display = "none";
    }
}

// ========== AUTH MODAL ==========
function openAuth(mode) {
    const modal = document.getElementById("authModal");
    if(modal) modal.classList.add("show");
    renderAuthForm(mode);
}
function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if(modal) modal.classList.remove("show");
}
function renderAuthForm(mode) {
    const container = document.getElementById("authFormContainer");
    if(!container) return;
    container.innerHTML = mode === "login" ? loginFormHTML() : registerFormHTML();
}
function loginFormHTML() {
    return `
        <div class="auth-form">
            <h2>Login</h2>
            <div class="form-group"><label>Email</label><input type="email" id="loginEmail" required></div>
            <div class="form-group"><label>Password</label><input type="password" id="loginPassword" required></div>
            <button class="primary-btn" style="width:100%" onclick="doLogin()">Login</button>
            <p>Don't have an account? <a onclick="renderAuthForm('register')">Register here</a></p>
            <p style="color:var(--muted);font-size:11px;">Admin: admin@aics.edu / admin123</p>
        </div>`;
}
function registerFormHTML() {
    return `
        <div class="auth-form">
            <h2>📝 Register Student Account</h2>
            <div class="form-group"><label>Full Name</label><input type="text" id="regName" required></div>
            <div class="form-group"><label>Student ID</label><input type="text" id="regStudentId" required></div>
            <div class="form-group"><label>Email</label><input type="email" id="regEmail" required></div>
            <div class="form-group"><label>Password</label><input type="password" id="regPassword" required></div>
            <button class="primary-btn" style="width:100%" onclick="doRegister()">Register</button>
            <p>Already have account? <a onclick="renderAuthForm('login')">Login here</a></p>
        </div>`;
}

// ========== LOGIN / REGISTER / LOGOUT ==========
function doLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return showToast("❌ Invalid email or password");
    saveSession(user);
    updateAuthUI();
    closeAuthModal();
    showToast(`✅ Welcome, ${user.name}!`);
    showSection("home");
}
function doRegister() {
    const name = document.getElementById("regName").value.trim();
    const sid = document.getElementById("regStudentId").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPassword").value;

    if (!name || !sid || !email || !pass) return showToast("Fill all fields");
    if (users.find(u => u.email === email)) return showToast("Email already registered");
    if (users.find(u => u.studentId === sid)) return showToast("Student ID already registered");

    const newUser = { 
        id: "u-" + Date.now(), 
        name, studentId: sid, email, password: pass, role: "student" 
    };
    users.push(newUser);
    saveUsers();
    saveSession(newUser);
    updateAuthUI();
    closeAuthModal();
    showToast("✅ Account created & logged in!");
    showSection("home");
}
function logout() {
    clearSession();
    updateAuthUI();
    showSection("home");
    showToast("Logged out successfully");
}

// ========== NAVIGATION ==========
function showSection(sectionName) {
    const protectedSections = ["submit", "dashboard", "admin"];
    const adminOnly = ["admin"];

    if (protectedSections.includes(sectionName)) {
        if (!currentUser) { openAuth("login"); return showToast("Please login first"); }
        if (adminOnly.includes(sectionName) && currentUser.role !== "admin") {
            return showToast("Admin access only");
        }
    }

    document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
    const target = document.getElementById(sectionName);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
        if (button.getAttribute("data-section") === sectionName) button.classList.add("active");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    if (sectionName === "dashboard") renderSubmissions();
    if (sectionName === "admin") renderAdmin();
}
function initializeNavigation() {
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.getAttribute("data-section"));
        });
    });
}

// ========== SUBMISSION FORM ==========
function initializeForm() {
    const form = document.getElementById("submissionForm");
    if(!form) return;
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const submission = {
            id: generateTicketId(),
            studentName: document.getElementById("studentName").value.trim(),
            studentId: document.getElementById("studentId").value.trim(),
            email: document.getElementById("email").value.trim(),
            department: document.getElementById("department").value,
            type: document.getElementById("submissionType").value,
            category: document.getElementById("category").value,
            subject: document.getElementById("subject").value.trim(),
            message: document.getElementById("message").value.trim(),
            anonymous: document.getElementById("anonymous").checked,
            priority: "Normal",
            status: "Pending",
            response: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        submissions.unshift(submission);
        saveData(); // ✅ SAVE — goes to Admin Panel automatically
        form.reset();
        showToast(`Submission created. Ticket ID: ${submission.id}`);
        updateStatistics();
        renderSubmissions();
        renderAdmin(); // ✅ ADMIN PANEL UPDATED INSTANTLY
        setTimeout(() => showSection("dashboard"), 700);
    });
}
function generateTicketId() {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `SC-${year}-${random}`;
}

// ========== STATISTICS ==========
function updateStatistics() {
    const total = submissions.length;
    const pending = submissions.filter(i => i.status === "Pending").length;
    const progress = submissions.filter(i => i.status === "In Progress").length;
    const resolved = submissions.filter(i => i.status === "Resolved").length;

    setText("totalCount", total);
    setText("pendingCount", pending);
    setText("progressCount", progress);
    setText("resolvedCount", resolved);
    setText("adminTotal", total);
    setText("adminPending", pending);
    setText("adminProgress", progress);
    setText("adminResolved", resolved);
    setText("homeTotal", total);
}
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

// ========== STUDENT DASHBOARD ==========
function renderSubmissions() {
    const container = document.getElementById("submissionList");
    if (!container) return;

    const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const status = document.getElementById("filterStatus")?.value || "all";
    const type = document.getElementById("filterType")?.value || "all";

    let filtered = submissions.filter(item => {
        const searchable = `${item.id} ${item.subject} ${item.message} ${item.category} ${item.department} ${item.studentName}`.toLowerCase();
        return searchable.includes(search) && 
               (status === "all" || item.status === status) && 
               (type === "all" || item.type === type);
    });

    // ✅ STUDENTS see ONLY THEIR OWN submissions
    if (currentUser && currentUser.role === "student") {
        filtered = filtered.filter(item => 
            item.email === currentUser.email || item.studentId === currentUser.studentId
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No submissions found</h3><p>You haven't submitted any matching feedback or complaints.</p><button class="primary-btn" onclick="showSection('submit')">Make a Submission</button></div>`;
        return;
    }
    container.innerHTML = filtered.map(createStudentCard).join("");
}
function createStudentCard(item) {
    const date = formatDate(item.createdAt);
    const typeClass = item.type.toLowerCase();
    const priorityClass = (item.priority || "Normal").toLowerCase();
    const statusClass = getStatusClass(item.status);
    const name = item.anonymous ? "Anonymous" : escapeHTML(item.studentName);
    const sid = item.anonymous ? "—" : escapeHTML(item.studentId);
    return `
    <div class="submission-card">
      <div class="card-top">
        <div>
          <div class="card-title">${escapeHTML(item.subject)}</div>
          <div class="card-meta">
            <span class="tag">${escapeHTML(item.id)}</span>
            <span class="tag type-${typeClass}">${escapeHTML(item.type)}</span>
            <span class="tag">${escapeHTML(item.category)}</span>
            <span class="tag priority-${priorityClass}">${escapeHTML(item.priority || "Normal")}</span>
          </div>
        </div>
        <span class="status ${statusClass}">${escapeHTML(item.status)}</span>
      </div>
      <p class="card-message">${escapeHTML(item.message.substring(0, 80))}${item.message.length > 80 ? '...' : ''}</p>
      <div class="card-bottom">
        <span>Submitted ${date}</span>
        <div class="card-actions">
          <button class="small-btn" onclick="viewSubmission('${item.id}')">View Details</button>
          <button class="small-btn delete" onclick="deleteSubmission('${item.id}')">Delete</button>
        </div>
      </div>
    </div>`;
}

// ========== FILTERS ==========
function initializeFilters() {
    const searchInput = document.getElementById("searchInput");
    const filterStatus = document.getElementById("filterStatus");
    const filterType = document.getElementById("filterType");
    if (searchInput) searchInput.addEventListener("input", renderSubmissions);
    if (filterStatus) filterStatus.addEventListener("change", renderSubmissions);
    if (filterType) filterType.addEventListener("change", renderSubmissions);

    const adminSearch = document.getElementById("adminSearch");
    const adminFilter = document.getElementById("adminFilter");
    if (adminSearch) adminSearch.addEventListener("input", renderAdmin);
    if (adminFilter) adminFilter.addEventListener("change", renderAdmin);
}

// ========== ADMIN PANEL — SEES EVERYTHING ==========
function renderAdmin() {
    if (currentUser?.role !== "admin") return;
    const container = document.getElementById("adminList");
    if (!container) return;

    const search = (document.getElementById("adminSearch")?.value || "").toLowerCase();
    const status = document.getElementById("adminFilter")?.value || "all";

    // ✅ ADMIN SEES ALL SUBMISSIONS — NO FILTERS EXCEPT SEARCH & STATUS
    let filtered = submissions.filter(item => {
        const searchable = `${item.id} ${item.studentName} ${item.studentId} ${item.email} ${item.subject} ${item.category} ${item.department}`.toLowerCase();
        return searchable.includes(search) && (status === "all" || item.status === status);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No submissions yet</h3><p>All student submissions will appear here automatically.</p></div>`;
        return;
    }
    container.innerHTML = filtered.map(createAdminCard).join("");
}
function createAdminCard(item) {
    const statusClass = getStatusClass(item.status);
    // ✅ ADMIN SEES REAL INFO EVEN IF STUDENT CHOSE ANONYMOUS
    const displayName = item.anonymous ? `${escapeHTML(item.studentName)} (Hidden from students)` : escapeHTML(item.studentName);
    const displaySid = item.anonymous ? `${escapeHTML(item.studentId)} (Hidden from students)` : escapeHTML(item.studentId);
    const displayEmail = item.anonymous ? `${escapeHTML(item.email)} (Hidden from students)` : escapeHTML(item.email);

    return `
    <div class="admin-card">
      <div class="card-top">
        <div>
          <div class="card-title">${escapeHTML(item.subject)}</div>
          <div class="card-meta">
            <span class="tag">${escapeHTML(item.id)}</span>
            <span class="tag type-${item.type.toLowerCase()}">${escapeHTML(item.type)}</span>
            <span class="tag">${escapeHTML(item.department)}</span>
            ${item.anonymous ? '<span class="tag" style="background:#e3f2fd;color:#1565c0;">🔒 Anonymous</span>' : ''}
          </div>
        </div>
        <span class="status ${statusClass}">${escapeHTML(item.status)}</span>
      </div>
      <div class="admin-info">
        <div class="admin-field">
          <label>Student</label>
          <div>${displayName}</div>
          <small>ID: ${displaySid}</small>
        </div>
        <div class="admin-field">
          <label>Contact / Email</label>
          <div>${displayEmail}</div>
          <small>Submitted: ${formatDate(item.createdAt)}</small>
        </div>
      </div>
      <div class="admin-info">
        <div class="admin-field">
          <label>Change Status</label>
          <select onchange="changeStatus('${item.id}', this.value)">
            <option value="Pending" ${item.status==="Pending"?"selected":""}>Pending</option>
            <option value="In Progress" ${item.status==="In Progress"?"selected":""}>In Progress</option>
            <option value="Resolved" ${item.status==="Resolved"?"selected":""}>Resolved</option>
            <option value="Rejected" ${item.status==="Rejected"?"selected":""}>Rejected</option>
          </select>
        </div>
        <div class="admin-field">
          <label>Admin Response</label>
          <textarea id="response-${item.id}" rows="3" placeholder="Write a response...">${escapeHTML(item.response || "")}</textarea>
          <button class="primary-btn" onclick="saveResponse('${item.id}')">Save Response</button>
        </div>
      </div>
      <div class="card-bottom">
        <span>Last updated: ${formatDate(item.updatedAt)}</span>
        <div class="card-actions">
          <button class="small-btn" onclick="viewSubmission('${item.id}')">View</button>
          <button class="small-btn delete" onclick="deleteSubmission('${item.id}')">Delete</button>
        </div>
      </div>
    </div>`;
}

// ========== ADMIN ACTIONS ==========
function changeStatus(id, newStatus) {
    const submission = submissions.find(item => item.id === id);
    if (!submission) return;
    submission.status = newStatus;
    submission.updatedAt = new Date().toISOString();
    saveData();
    updateStatistics(); renderAdmin(); renderSubmissions();
    showToast(`Ticket ${id} updated to ${newStatus}.`);
}
function saveResponse(id) {
    const submission = submissions.find(item => item.id === id);
    if (!submission) return;
    const textarea = document.getElementById(`response-${id}`);
    submission.response = textarea.value.trim();
    submission.updatedAt = new Date().toISOString();
    saveData();
    renderAdmin(); renderSubmissions();
    showToast("Admin response saved successfully.");
}

// ========== VIEW DETAILS ==========
function viewSubmission(id) {
    const item = submissions.find(s => s.id === id);
    if (!item) return;
    const modal = document.getElementById("detailsModal");
    const content = document.getElementById("modalContent");
    
    // Student view — respects anonymity
    let name, sid, email;
    if (currentUser?.role === "admin") {
        name = escapeHTML(item.studentName);
        sid = escapeHTML(item.studentId);
        email = escapeHTML(item.email);
    } else {
        name = item.anonymous ? "Anonymous Student" : escapeHTML(item.studentName);
        sid = item.anonymous ? "Hidden" : escapeHTML(item.studentId);
        email = item.anonymous ? "Hidden" : escapeHTML(item.email);
    }

    content.innerHTML = `
      <h2 class="modal-title">${escapeHTML(item.subject)}</h2>
      <div class="card-meta">
        <span class="tag">${escapeHTML(item.id)}</span>
        <span class="tag type-${item.type.toLowerCase()}">${escapeHTML(item.type)}</span>
        <span class="status ${getStatusClass(item.status)}">${escapeHTML(item.status)}</span>
        ${item.anonymous ? '<span class="tag">🔒 Anonymous</span>' : ''}
      </div>
      <div class="detail-row"><strong>Student</strong><span>${name}</span></div>
      <div class="detail-row"><strong>Student ID</strong><span>${sid}</span></div>
      <div class="detail-row"><strong>Email</strong><span>${email}</span></div>
      <div class="detail-row"><strong>Department</strong><span>${escapeHTML(item.department)}</span></div>
      <div class="detail-row"><strong>Category</strong><span>${escapeHTML(item.category)}</span></div>
      <div class="detail-row"><strong>Date Submitted</strong><span>${formatDate(item.createdAt)}</span></div>
      <div class="detail-row"><strong>Message</strong><p>${escapeHTML(item.message)}</p></div>
      ${item.response ? `<div class="detail-row"><strong>Admin Response</strong><p>${escapeHTML(item.response)}</p></div>` : ""}
    `;
    if(modal) modal.classList.add("show");
}
function closeModal() { 
    const modal = document.getElementById("detailsModal");
    if(modal) modal.classList.remove("show"); 
}
window.addEventListener("click", e => { 
    const modal = document.getElementById("detailsModal"); 
    if (modal && e.target === modal) closeModal(); 
});

// ========== DELETE SUBMISSION ==========
function deleteSubmission(id) {
    const submission = submissions.find(item => item.id === id);
    if (!submission) return;
    if (!confirm(`Delete submission ${id}?\nThis action cannot be undone.`)) return;
    submissions = submissions.filter(item => item.id !== id);
    saveData();
    updateStatistics(); renderSubmissions(); renderAdmin();
    showToast("Submission deleted successfully.");
}

// ========== UTILITIES ==========
function getStatusClass(status) {
    switch (status) {
        case "Pending": return "status-pending";
        case "In Progress": return "status-progress";
        case "Resolved": return "status-resolved";
        case "Rejected": return "status-rejected";
        default: return "status-pending";
    }
}
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", { 
        year: "numeric", month: "short", day: "numeric" 
    });
}
let toastTimer;
function showToast(message) {
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
}
function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
