let submissions = JSON.parse(localStorage.getItem("studentSubmissions")) || [];

document.addEventListener("DOMContentLoaded", () => {
    initializeNavigation();
    initializeForm();
    initializeFilters();
    renderSubmissions();
    updateStatistics();
});

function initializeNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const section = button.getAttribute("data-section");
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });
    const target = document.getElementById(sectionName);
    if (target) {
        target.classList.add("active");
    }
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
        if (button.getAttribute("data-section") === sectionName) {
            button.classList.add("active");
        }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (sectionName === "dashboard") renderSubmissions();
}

function initializeForm() {
    const form = document.getElementById("submissionForm");
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
        saveData();
        form.reset();
        showToast(`Submission created. Ticket ID: ${submission.id}`);
        updateStatistics();
        renderSubmissions();
        setTimeout(() => showSection("dashboard"), 700);
    });
}

function generateTicketId() {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `SC-${year}-${random}`;
}

function saveData() {
    localStorage.setItem("studentSubmissions", JSON.stringify(submissions));
}

function updateStatistics() {
    const total = submissions.length;
    const pending = submissions.filter(item => item.status === "Pending").length;
    const progress = submissions.filter(item => item.status === "In Progress").length;
    const resolved = submissions.filter(item => item.status === "Resolved").length;
    setText("totalCount", total);
    setText("pendingCount", pending);
    setText("progressCount", progress);
    setText("resolvedCount", resolved);
    setText("homeTotal", total);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderSubmissions() {
    const container = document.getElementById("submissionList");
    if (!container) return;
    const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const status = document.getElementById("filterStatus")?.value || "all";
    const type = document.getElementById("filterType")?.value || "all";
    let filtered = submissions.filter(item => {
        const searchable = `${item.id} ${item.subject} ${item.message} ${item.category} ${item.department} ${item.studentName}`.toLowerCase();
        const matchesSearch = searchable.includes(search);
        const matchesStatus = status === "all" || item.status === status;
        const matchesType = type === "all" || item.type === type;
        return matchesSearch && matchesStatus && matchesType;
    });
    if (filtered.length === 0) {
        container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No submissions found</h3>
            <p>You haven't submitted any matching feedback or complaints.</p>
            <button class="primary-btn" onclick="showSection('submit')">Make a Submission</button>
        </div>`;
        return;
    }
    container.innerHTML = filtered.map(createStudentCard).join("");
}

function createStudentCard(item) {
    const date = formatDate(item.createdAt);
    const typeClass = item.type.toLowerCase();
    const priorityClass = (item.priority || "Normal").toLowerCase();
    const statusClass = getStatusClass(item.status);
    
    // Hide personal info if anonymous
    const displayName = item.anonymous ? "Anonymous" : escapeHTML(item.studentName);

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
                    ${item.anonymous ? '<span class="tag" style="background:#eef2ff; color:#3730a3;">🔒 Anonymous</span>' : ''}
                </div>
            </div>
            <span class="status ${statusClass}">${escapeHTML(item.status)}</span>
        </div>
        <p class="card-message">${escapeHTML(item.message.substring(0, 80))}${item.message.length > 80 ? '...' : ''}</p>
        <div class="card-bottom">
            <span>Submitted ${date} by ${displayName}</span>
            <div class="card-actions">
                <button class="small-btn" onclick="viewSubmission('${item.id}')">View Details</button>
                <button class="small-btn delete" onclick="deleteSubmission('${item.id}')">Delete</button>
            </div>
        </div>
    </div>`;
}

function initializeFilters() {
    const searchInput = document.getElementById("searchInput");
    const filterStatus = document.getElementById("filterStatus");
    const filterType = document.getElementById("filterType");
    if (searchInput) searchInput.addEventListener("input", renderSubmissions);
    if (filterStatus) filterStatus.addEventListener("change", renderSubmissions);
    if (filterType) filterType.addEventListener("change", renderSubmissions);
}

function viewSubmission(id) {
    const item = submissions.find(submission => submission.id === id);
    if (!item) return;
    const modal = document.getElementById("detailsModal");
    const content = document.getElementById("modalContent");

    // Show personal info ONLY to the submitter — or hide if anonymous
    const displayName = item.anonymous ? "Anonymous Student" : escapeHTML(item.studentName);
    const displayId = item.anonymous ? "Hidden" : escapeHTML(item.studentId);
    const displayEmail = item.anonymous ? "Hidden" : escapeHTML(item.email);

    content.innerHTML = `
        <h2 class="modal-title">${escapeHTML(item.subject)}</h2>
        <div class="card-meta">
            <span class="tag">${escapeHTML(item.id)}</span>
            <span class="tag type-${item.type.toLowerCase()}">${escapeHTML(item.type)}</span>
            <span class="status ${getStatusClass(item.status)}">${escapeHTML(item.status)}</span>
            ${item.anonymous ? '<span class="tag" style="background:#eef2ff; color:#3730a3;">🔒 Anonymous</span>' : ''}
        </div>
        <div class="detail-row"><strong>Student</strong><span>${displayName}</span></div>
        <div class="detail-row"><strong>Student ID</strong><span>${displayId}</span></div>
        <div class="detail-row"><strong>Email</strong><span>${displayEmail}</span></div>
        <div class="detail-row"><strong>Department</strong><span>${escapeHTML(item.department)}</span></div>
        <div class="detail-row"><strong>Category</strong><span>${escapeHTML(item.category)}</span></div>
        <div class="detail-row"><strong>Date Submitted</strong><span>${formatDate(item.createdAt)}</span></div>
        <div class="detail-row"><strong>Message</strong><p>${escapeHTML(item.message)}</p></div>
        ${item.response ? `<div class="detail-row"><strong>Admin Response</strong><p>${escapeHTML(item.response)}</p></div>` : ""}
    `;
    modal.classList.add("show");
}

function closeModal() {
    document.getElementById("detailsModal").classList.remove("show");
}

window.addEventListener("click", e => {
    const modal = document.getElementById("detailsModal");
    if (e.target === modal) closeModal();
});

function deleteSubmission(id) {
    const submission = submissions.find(item => item.id === id);
    if (!submission) return;
    if (!confirm(`Delete submission ${id}?\nThis action cannot be undone.`)) return;
    submissions = submissions.filter(item => item.id !== id);
    saveData();
    updateStatistics();
    renderSubmissions();
    showToast("Submission deleted successfully.");
}

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
