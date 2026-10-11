
"use strict";

/* AttendX — browser-based university portal demo */

const SUBJECTS = [
  { id: "ai", name: "Artificial Intelligence", icon: "AI", lab: true },
  { id: "cn", name: "Computer Networks", icon: "CN", lab: true },
  { id: "is", name: "Information Security", icon: "IS", lab: true },
  { id: "mvc", name: "Multivariable Calculus", icon: "MC", lab: false },
  { id: "quran", name: "Holy Quran", icon: "HQ", lab: false },
  { id: "ideology", name: "Ideology", icon: "ID", lab: false }
];

const STORAGE_KEY = "attendx_student_portal_v1";

function defaultState() {
  return {
    profile: {
      name: "Student Name",
      roll: "",
      email: "",
      program: "BS Computer Science",
      semester: "1st Semester",
      university: ""
    },
    attendance: [],
    surveys: [],
    marks: {}
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") {
      const defaults = defaultState();
      return {
        profile: { ...defaults.profile, ...(saved.profile || {}) },
        attendance: Array.isArray(saved.attendance) ? saved.attendance : [],
        surveys: Array.isArray(saved.surveys) ? saved.surveys : [],
        marks: saved.marks && typeof saved.marks === "object"
          ? saved.marks : {}
      };
    }
  } catch (error) {
    console.warn("Could not load saved data.", error);
  }
  return defaultState();
}

let state = loadState();
let toastTimer;

const $ = id => document.getElementById(id);

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Saving failed:", error);
    showToast("Could not save data. Check your browser storage.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function setMessage(id, message, isError = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", isError);
}

function subjectById(id) {
  return SUBJECTS.find(subject => subject.id === id);
}

function safeRecords() {
  return state.attendance.filter(record =>
    subjectById(record.subject) &&
    ["lecture", "lab"].includes(record.type) &&
    ["present", "absent"].includes(record.status) &&
    (record.type !== "lab" || subjectById(record.subject).lab)
  );
}

function recordsFor(subjectId, type) {
  return safeRecords().filter(record =>
    record.subject === subjectId && record.type === type
  );
}

function statsFor(subjectId, type) {
  const records = recordsFor(subjectId, type);
  const present = records.filter(r => r.status === "present").length;
  return {
    total: records.length,
    present,
    absent: records.length - present,
    percent: records.length ? Math.round(present / records.length * 100) : 0
  };
}

function overallStats() {
  const records = safeRecords();
  const present = records.filter(r => r.status === "present").length;
  return {
    total: records.length,
    present,
    absent: records.length - present,
    percent: records.length ? Math.round(present / records.length * 100) : 0
  };
}

function combinedStats(subjectId) {
  const records = safeRecords().filter(r => r.subject === subjectId);
  const present = records.filter(r => r.status === "present").length;
  return {
    total: records.length,
    present,
    percent: records.length ? Math.round(present / records.length * 100) : 0
  };
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some(n => !n)) return dateString;
  return new Date(parts[0], parts[1] - 1, parts[2])
    .toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
}

/* Menu and page navigation */

function closeSidebar() {
  $("sidebar").classList.remove("open");
  $("overlay").classList.remove("show");
}

function openSidebar() {
  $("sidebar").classList.add("open");
  $("overlay").classList.add("show");
}

function showPage(pageName) {
  const validPages = [
    "dashboard", "profile", "attendance", "survey", "result", "subjects"
  ];
  if (!validPages.includes(pageName)) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === `page-${pageName}`);
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageName);
  });

  const labels = {
    dashboard: "Dashboard",
    profile: "Profile",
    attendance: "Total Attendance",
    survey: "Survey",
    result: "Result Card",
    subjects: "Subjects & Labs"
  };

  $("pageLabel").textContent = labels[pageName];
  closeSidebar();

  if (pageName === "dashboard") renderDashboard();
  if (pageName === "profile") fillProfileForm();
  if (pageName === "attendance") renderAttendance();
  if (pageName === "survey") renderSurveys();
  if (pageName === "result") renderResults();
  if (pageName === "subjects") renderAllSubjects();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("openMenu").addEventListener("click", () => {
  $("welcome").classList.add("hidden");
  $("app").classList.remove("hidden");
  showPage("dashboard");

  if (window.innerWidth <= 760) openSidebar();
});

$("menuToggle").addEventListener("click", openSidebar);
$("closeMenu").addEventListener("click", closeSidebar);
$("overlay").addEventListener("click", closeSidebar);

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.goto));
});

/* Subject dropdowns */

function populateSubjectDropdowns() {
  const options = SUBJECTS.map(subject =>
    `<option value="${subject.id}">${escapeHTML(subject.name)}</option>`
  ).join("");

  $("attSubject").innerHTML = options;
  $("surveySubject").innerHTML = options;
  updateClassTypeOptions();
}

function updateClassTypeOptions() {
  const subject = subjectById($("attSubject").value);
  const labOption = [...$("attType").options]
    .find(option => option.value === "lab");

  if (labOption) {
    labOption.disabled = !subject || !subject.lab;
    if (!subject || !subject.lab) $("attType").value = "lecture";
  }
}

$("attSubject").addEventListener("change", updateClassTypeOptions);

/* Dashboard */

function renderDashboard() {
  const profile = state.profile;
  const firstName = (profile.name || "Student").trim().split(/\s+/)[0];

  $("greeting").textContent = `Welcome back, ${firstName}!`;
  $("statSubjects").textContent = SUBJECTS.length;

  const overall = overallStats();
  $("statAttendance").textContent = `${overall.percent}%`;
  $("statPresent").textContent = overall.present;
  $("statSessions").textContent = `Out of ${overall.total} sessions`;

  const alerts = SUBJECTS.filter(subject => {
    const stats = combinedStats(subject.id);
    return stats.total > 0 && stats.percent < 75;
  }).length;

  $("statAlerts").textContent = alerts;

  $("dashboardSubjects").innerHTML = SUBJECTS.map(subject => {
    const stats = statsFor(subject.id, "lecture");
    return `
      <div class="subject-row">
        <div>
          <div class="subject-title">
            <span>${escapeHTML(subject.name)}</span>
            <span>${stats.present}/${stats.total} classes</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${stats.percent}%"></div>
          </div>
        </div>
        <div class="progress-percent">${stats.percent}%</div>
      </div>`;
  }).join("");

  $("donutValue").textContent = `${overall.percent}%`;
  $("attendanceDonut").style.background =
    `conic-gradient(var(--purple) ${overall.percent}%, #edeaf9 ${overall.percent}%)`;

  if (!overall.total) {
    $("dashboardAlert").textContent =
      "No attendance records yet. Open Total Attendance to record your first class.";
  } else if (alerts > 0) {
    $("dashboardAlert").textContent =
      `${alerts} subject(s) are below 75%. Attend upcoming classes to improve your percentage.`;
  } else {
    $("dashboardAlert").textContent =
      "Your recorded attendance is on track. Keep attending your classes!";
  }
}

/* Student profile */

function fillProfileForm() {
  const p = state.profile;
  $("studentName").value = p.name || "";
  $("rollNumber").value = p.roll || "";
  $("studentEmail").value = p.email || "";
  $("studentProgram").value = p.program || "";
  $("studentSemester").value = p.semester || "1st Semester";
  $("studentUniversity").value = p.university || "";
}

function renderProfileHeader() {
  const name = state.profile.name || "Student Name";
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  $("sideName").textContent = name;
  $("sideAvatar").textContent = initial;
  $("topAvatar").textContent = initial;
  $("profileHeading").textContent = name;
  $("profileAvatar").textContent = initial;
}

$("profileForm").addEventListener("submit", event => {
  event.preventDefault();

  state.profile = {
    name: $("studentName").value.trim() || "Student Name",
    roll: $("rollNumber").value.trim(),
    email: $("studentEmail").value.trim(),
    program: $("studentProgram").value.trim(),
    semester: $("studentSemester").value,
    university: $("studentUniversity").value.trim()
  };

  if (saveState()) {
    renderProfileHeader();
    renderDashboard();
    setMessage("profileMessage", "Profile saved successfully.");
    showToast("Profile updated.");
  }
});

/* Attendance management */

$("attendanceForm").addEventListener("submit", event => {
  event.preventDefault();

  const subjectId = $("attSubject").value;
  const type = $("attType").value;
  const status = $("attStatus").value;
  const date = $("attDate").value;
  const subject = subjectById(subjectId);

  if (!subject || !date) {
    setMessage("attendanceMessage", "Please select a subject and date.", true);
    return;
  }

  if (type === "lab" && !subject.lab) {
    setMessage("attendanceMessage", "This subject does not have a lab.", true);
    return;
  }

  // Avoid accidentally recording the same class twice.
  const duplicate = safeRecords().some(record =>
    record.subject === subjectId &&
    record.type === type &&
    record.date === date
  );

  if (duplicate) {
    setMessage(
      "attendanceMessage",
      "A record already exists for this subject, class type and date. Delete it first to change it.",
      true
    );
    return;
  }

  state.attendance.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subject: subjectId,
    type,
    status,
    date
  });

  if (saveState()) {
    renderAttendance();
    renderDashboard();
    renderAllSubjects();
    setMessage("attendanceMessage", "Attendance record saved successfully.");
    showToast("Attendance updated.");
  }
});

function renderAttendance() {
  const overall = overallStats();

  $("attTotal").textContent = overall.total;
  $("attPresent").textContent = overall.present;
  $("attAbsent").textContent = overall.absent;
  $("attPercent").textContent = `${overall.percent}%`;

  $("attendanceTable").innerHTML = SUBJECTS.map(subject => {
    const lecture = statsFor(subject.id, "lecture");
    const lab = subject.lab ? statsFor(subject.id, "lab") : null;
    const combined = combinedStats(subject.id);

    return `
      <tr>
        <td>${escapeHTML(subject.name)}</td>
        <td>${lecture.present}/${lecture.total}</td>
        <td>${lecture.percent}%</td>
        <td>${lab ? `${lab.present}/${lab.total}` : "N/A"}</td>
        <td>${lab ? `${lab.percent}%` : "N/A"}</td>
        <td><strong>${combined.percent}%</strong></td>
      </tr>`;
  }).join("");

  const records = [...safeRecords()].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );

  $("historyTable").innerHTML = records.length ? records.map(record => {
    const subject = subjectById(record.subject);
    return `
      <tr>
        <td>${escapeHTML(formatDate(record.date))}</td>
        <td>${escapeHTML(subject.name)}</td>
        <td>${record.type === "lab" ? "Lab" : "Lecture"}</td>
        <td><span class="status-badge ${record.status === "present" ? "status-present" : "status-absent"}">${record.status === "present" ? "Present" : "Absent"}</span></td>
        <td><button class="delete-btn" data-delete="${escapeHTML(record.id)}">Delete</button></td>
      </tr>`;
  }).join("") : `
    <tr><td colspan="5" class="empty-cell">No attendance records yet. Record your first class above.</td></tr>`;
}

$("historyTable").addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;

  const id = button.dataset.delete;
  const record = state.attendance.find(item => item.id === id);
  if (!record) return;

  if (!confirm("Delete this attendance record?")) return;

  state.attendance = state.attendance.filter(item => item.id !== id);
  if (saveState()) {
    renderAttendance();
    renderDashboard();
    renderAllSubjects();
    showToast("Attendance record deleted.");
  }
});

/* CSV attendance export */

$("exportCsv").addEventListener("click", () => {
  const records = [...safeRecords()].sort((a, b) => a.date.localeCompare(b.date));

  if (!records.length) {
    showToast("Record some attendance before exporting.");
    return;
  }

  const rows = [
    ["Date", "Subject", "Class Type", "Status"],
    ...records.map(record => [
      record.date,
      subjectById(record.subject).name,
      record.type === "lab" ? "Lab" : "Lecture",
      record.status
    ])
  ];

  const csv = rows.map(row => row.map(value =>
    `"${String(value).replace(/"/g, '""')}"`
  ).join(",")).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "attendx-attendance.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast("Attendance CSV exported.");
});

/* Subjects and labs cards */

function renderAllSubjects() {
  $("allSubjects").innerHTML = SUBJECTS.map(subject => {
    const lecture = statsFor(subject.id, "lecture");
    const lab = subject.lab ? statsFor(subject.id, "lab") : null;
    const combined = combinedStats(subject.id);

    return `
      <article class="course-card">
        <div class="course-top">
          <div class="course-icon">${escapeHTML(subject.icon)}</div>
          <div>
            <h2>${escapeHTML(subject.name)}</h2>
            <p>${subject.lab ? "Lecture + Practical Lab" : "Lecture only"}</p>
          </div>
          <div class="course-percent">${combined.percent}%</div>
        </div>
        <div class="course-detail">
          <div>
            <span>Lecture attendance</span>
            <strong>${lecture.present}/${lecture.total} · ${lecture.percent}%</strong>
          </div>
          <div>
            <span>${subject.lab ? "Lab attendance" : "Lab attendance"}</span>
            <strong>${lab ? `${lab.present}/${lab.total} · ${lab.percent}%` : "Not applicable"}</strong>
          </div>
        </div>
        <div style="margin-top:16px" class="progress-track">
          <div class="progress-fill" style="width:${combined.percent}%"></div>
        </div>
        <button class="text-btn" style="margin-top:15px;padding:0" data-goto="attendance">
          Manage attendance →
        </button>
      </article>`;
  }).join("");
}

/* Course survey */

$("surveyForm").addEventListener("submit", event => {
  event.preventDefault();

  const selectedRating = document.querySelector('input[name="rating"]:checked');
  if (!selectedRating) {
    setMessage("surveyMessage", "Please choose a rating.", true);
    return;
  }

  state.surveys.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subject: $("surveySubject").value,
    rating: Number(selectedRating.value),
    positive: $("surveyPositive").value.trim(),
    suggestion: $("surveySuggestion").value.trim(),
    date: new Date().toISOString().slice(0, 10)
  });

  if (saveState()) {
    $("surveyForm").reset();
    renderSurveys();
    setMessage("surveyMessage", "Thank you! Your survey has been saved in this browser.");
    showToast("Survey submitted.");
  }
});

function renderSurveys() {
  $("surveyHistory").innerHTML = state.surveys.length
    ? state.surveys.map(survey => {
        const subject = subjectById(survey.subject);
        if (!subject) return "";

        return `
          <article class="survey-entry">
            <strong>${escapeHTML(subject.name)}</strong>
            <p>Rating: ${"★".repeat(Math.max(0, Math.min(5, survey.rating)))}${"☆".repeat(5 - Math.max(0, Math.min(5, survey.rating)))} · ${escapeHTML(formatDate(survey.date))}</p>
            ${survey.positive ? `<p><b>Working well:</b> ${escapeHTML(survey.positive)}</p>` : ""}
            ${survey.suggestion ? `<p><b>Suggestion:</b> ${escapeHTML(survey.suggestion)}</p>` : ""}
          </article>`;
      }).join("")
    : '<p class="muted">You have not submitted any surveys yet.</p>';
}

/* Result card: editable marks and estimated grades */

function gradeFor(mark) {
  if (mark >= 90) return { grade: "A+", points: 4.00 };
  if (mark >= 85) return { grade: "A", points: 4.00 };
  if (mark >= 80) return { grade: "A-", points: 3.70 };
  if (mark >= 75) return { grade: "B+", points: 3.30 };
  if (mark >= 70) return { grade: "B", points: 3.00 };
  if (mark >= 65) return { grade: "B-", points: 2.70 };
  if (mark >= 60) return { grade: "C+", points: 2.30 };
  if (mark >= 55) return { grade: "C", points: 2.00 };
  if (mark >= 50) return { grade: "D", points: 1.00 };
  return { grade: "F", points: 0.00 };
}

function renderResults() {
  $("resultTable").innerHTML = SUBJECTS.map(subject => {
    const mark = state.marks[subject.id] ?? "";
    const validMark = mark !== "" && Number.isFinite(Number(mark)) &&
      Number(mark) >= 0 && Number(mark) <= 100;
    const grade = validMark ? gradeFor(Number(mark)) : null;

    return `
      <tr>
        <td>${escapeHTML(subject.name)}</td>
        <td><input aria-label="${escapeHTML(subject.name)} marks" type="number" min="0" max="100" step="1" class="mark-input" data-mark="${subject.id}" value="${escapeHTML(mark)}" placeholder="0–100" style="width:100px;padding:9px"></td>
        <td>${grade ? grade.grade : "—"}</td>
        <td>${grade ? grade.points.toFixed(2) : "—"}</td>
      </tr>`;
  }).join("");

  updateResultSummary();
}

function updateResultSummary() {
  const values = SUBJECTS.map(subject => state.marks[subject.id])
    .filter(value => value !== undefined && value !== "" &&
      Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100)
    .map(Number);

  const total = values.reduce((sum, mark) => sum + mark, 0);
  const average = values.length ? total / values.length : 0;
  const gpa = values.length
    ? values.reduce((sum, mark) => sum + gradeFor(mark).points, 0) / values.length
    : 0;

  $("marksTotal").textContent = `${total} / ${SUBJECTS.length * 100}`;
  $("marksAverage").textContent = `${average.toFixed(1)}%`;
  $("marksGpa").textContent = `${gpa.toFixed(2)} / 4.00`;
}

$("saveMarks").addEventListener("click", () => {
  const newMarks = { ...state.marks };
  const inputs = [...document.querySelectorAll("[data-mark]")];

  for (const input of inputs) {
    const value = input.value.trim();

    if (value === "") {
  
