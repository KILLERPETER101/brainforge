// app.js — single file that powers simple interactions across pages.

// --- Sample "student" data used by Study Match demo ---
const STUDENTS = [
  { name: "Ana", subjects: ["thermodynamics", "heat transfer"] },
  { name: "Ben", subjects: ["circuits", "electronics"] },
  { name: "Carla", subjects: ["mechanics", "machines"] },
  { name: "Dan", subjects: ["materials", "manufacturing"] },
  { name: "Ella", subjects: ["controls", "robots"] },
];

// Utility: simple match by keyword
function findMatches(keyword) {
  const q = (keyword || "").trim().toLowerCase();
  if (!q) return [];
  return STUDENTS.filter(s => s.subjects.some(sub => sub.includes(q)));
}

// Hook Study Match inputs (on home and products pages)
function setupStudyMatch() {
  const mapping = [
    { inputId: "match-input", btnId: "match-btn", outId: "match-results" },
    { inputId: "match-input-products", btnId: "match-btn-products", outId: "match-results-products" }
  ];
  mapping.forEach(m => {
    const input = document.getElementById(m.inputId);
    const btn = document.getElementById(m.btnId);
    const out = document.getElementById(m.outId);
    if (!input || !btn || !out) return;
    btn.addEventListener("click", () => {
      const results = findMatches(input.value);
      if (!results.length) {
        out.innerHTML = `<p class="small-muted">No matches found. Try a nearby keyword (e.g. circuits, mechanics).</p>`;
      } else {
        out.innerHTML = "<ul>" + results.map(r => `<li><strong>${r.name}</strong> — ${r.subjects.join(", ")}</li>`).join("") + "</ul>";
      }
    });
  });
}

// --- Dashboard functionality (tasks, progress, points) ---
const STORAGE_TASKS = "thesis_tasks_v1";
const STORAGE_POINTS = "thesis_points_v1";

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_TASKS) || "[]");
  } catch {
    return [];
  }
}
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
}
function loadPoints() {
  return Number(localStorage.getItem(STORAGE_POINTS) || 0);
}
function savePoints(n) {
  localStorage.setItem(STORAGE_POINTS, String(n));
}

function renderTasks() {
  const listEl = document.getElementById("tasks-list");
  if (!listEl) return;
  const tasks = loadTasks();
  if (!tasks.length) {
    listEl.innerHTML = `<p class="small-muted">No tasks yet—add one to start earning points.</p>`;
    updateProgress();
    return;
  }
  listEl.innerHTML = tasks.map((t, i) => `
    <div class="tasks-item">
      <div>
        <input type="checkbox" data-idx="${i}" ${t.done ? "checked" : ""}/> 
        <span style="margin-left:8px">${escapeHtml(t.text)}</span>
      </div>
      <div>
        <button data-delete="${i}">Delete</button>
      </div>
    </div>
  `).join("");
  // attach listeners
  listEl.querySelectorAll("input[type=checkbox]").forEach(cb => cb.addEventListener("change", (e) => {
    const idx = Number(e.target.getAttribute("data-idx"));
    const tasks = loadTasks();
    tasks[idx].done = e.target.checked;
    saveTasks(tasks);
    // award points when completing a task
    if (e.target.checked) {
      const pts = loadPoints() + 10; // each task = 10 points
      savePoints(pts);
    }
    updatePointsUI();
    updateProgress();
    renderTasks();
  }));
  listEl.querySelectorAll("button[data-delete]").forEach(btn => btn.addEventListener("click", (e) => {
    const idx = Number(e.target.getAttribute("data-delete"));
    const tasks = loadTasks();
    tasks.splice(idx, 1);
    saveTasks(tasks);
    renderTasks();
    updateProgress();
  }));
}

function addTask(text) {
  if (!text || !text.trim()) return;
  const tasks = loadTasks();
  tasks.push({ text: text.trim(), done: false, created: Date.now() });
  saveTasks(tasks);
  renderTasks();
  updateProgress();
}

function updateProgress() {
  const tasks = loadTasks();
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");
  if (bar) bar.style.width = pct + "%";
  if (text) text.textContent = `${pct}% completed (${done}/${total})`;
}

function updatePointsUI() {
  const el = document.getElementById("points-display");
  if (el) el.textContent = String(loadPoints());
}

function setupDashboard() {
  const addBtn = document.getElementById("add-task-btn");
  const input = document.getElementById("task-input");
  const resetBtn = document.getElementById("reset-btn");
  if (addBtn && input) {
    addBtn.addEventListener("click", () => {
      addTask(input.value);
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { addTask(input.value); input.value = ""; }
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_TASKS);
      localStorage.removeItem(STORAGE_POINTS);
      renderTasks();
      updatePointsUI();
      updateProgress();
    });
  }
  // initial render
  renderTasks();
  updatePointsUI();
  updateProgress();
}

// small helper to avoid HTML injection in demos
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setupStudyMatch();
  // Only initialize dashboard when on that page
  if (document.body.id === "page-dashboard") {
    setupDashboard();
  }
  // provide a quick study-match link on home page via a simple listener
  const homeMatchInput = document.getElementById("match-input");
  const homeMatchBtn = document.getElementById("match-btn");
  if (homeMatchInput && homeMatchBtn) {
    homeMatchBtn.addEventListener("click", () => {
      // mirror results into the shared demo (if available)
      const out = document.getElementById("match-results");
      if (out) {
        const res = findMatches(homeMatchInput.value);
        out.innerHTML = res.length ? "<ul>" + res.map(r => `<li><strong>${r.name}</strong> — ${r.subjects.join(", ")}</li>`).join("") + "</ul>" : `<p class="small-muted">No matches found.</p>`;
      }
    });
  }
});
