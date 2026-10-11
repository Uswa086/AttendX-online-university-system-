
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------
  // 1. Subjects and storage
  // ------------------------------
  const SUBJECTS = [
    { id: "ai", name: "Artificial Intelligence", lab: true },
    { id: "networks", name: "Computer Networks", lab: true },
    { id: "security", name: "Information Security", lab: true },
    { id: "calculus", name: "Multivariable Calculus", lab: false },
    { id: "quran", name: "Holy Quran", lab: false },
    { id: "ideology", name: "Ideology", lab: false }
  ];

  const STORAGE_KEY = "attendx_student_portal_v1";

  const defaultData = {
    profile: {
      name: "Student",
      roll: "",
      email: "",
      department: "",
      semester: "1st Semester",
      university: ""
    },
    attendance: [],
    surveys: [],
    marks: SUBJECTS.map(s => ({
      subjectId: s.id,
      obtained: "",
      maximum: 100
    }))
  };

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return structuredClone(defaultData);

      const parsed = JSON.parse(saved);

      return {
        profile: { ...defaultData.profile, ...(parsed.profile || {}) },
        attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
        surveys: Array.isArray(parsed.surveys) ? parsed.surveys : [],
        marks: Array.isArray(parsed.marks)
          ? SUBJECTS.map(subject => {
              const existing = parsed.marks.find(
                item => item.subjectId === subject.id
              );
              return existing
                ? { subjectId: subject.id, obtained: existing.obtained ?? "",
                    maximum: existing.maximum ?? 100 }
                : { subjectId: subject.id, obtained: "", maximum: 100 };
            })
          : structuredClone(defaultData.marks)
      };
    } catch (error) {
      console.error("Could not load saved data:", error);
      return structuredClone(defaultData);
    }
  }

  let data = loadData();
  let toastTimeout;

  const $ = id => document.getElementById(id);

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Could not save data:", error);
      notify("Could not save data. Check browser storage settings.");
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

  function notify(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function subjectName(id) {
    return SUBJECTS.find(s => s.id === id)?.name || "Unknown subject";
  }

  function todayString() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  }

  // ------------------------------
  // 2. Welcome screen and navigation
  // ------------------------------
  function openPortal() {
    $("welcome")?.classList.add("hidden");
    $("app")?.classList.remove("hidden");
    showPage("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeMobileMenu() {
    $("sidebar")?.classList.remove("open");
    $("overlay")?.classList.remove("show");
  }

  function showPage(pageName) {
    const page = $("page-" + pageName);
    if (!page) {
      notify("This page could not be found.");
      return;
    }

    document.querySelectorAll(".page").forEach(item => {
      item.classList.toggle("active", item === page);
    });

    document.querySelectorAll(".nav-link[data-page]").forEach(button => {
      button.classList.toggle("active", button.dataset.page === pageName);
    });

    const activeButton = document.querySelector(
      '.nav-link[data-page="' + pageName + '"]'
    );
    $("pageTitle").textContent = activeButton
      ? activeButton.textContent.trim()
      : pageName.charAt(0).toUpperCase() + pageName.slice(1);

    closeMobileMenu();
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // One delegated click handler: works for static AND generated buttons.
  document.addEventListener("click", function (event) {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      showPage(pageButton.dataset.page);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      handleAction(actionButton.dataset.action, actionButton.dataset);
    }
  });

  $("openMenu").addEventListener("click", openPortal);

  $("menuToggle").addEventListener("click", function () {
    $("sidebar").classList.add("open");
    $("overlay").classList.add("show");
  });

  $("closeMenu").addEventListener("click", closeMobileMenu);
  $("overlay").addEventListener("click", closeMobileMenu);

  $("backWelcome").addEventListener("click", function () {
    closeMobileMenu();
    $("app").classList.add("hidden");
    $("welcome").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ------------------------------
  // 3. Attendance calculations
  // ------------------------------
  function validAttendanceRecords() {
    return data.attendance.filter(record =>
      SUBJECTS.some(s => s.id === record.subjectId) &&
      ["Lecture", "Lab"].includes(record.type) &&
      ["Present", "Absent", "Leave"].includes(record.status) &&
      (!record.type || record.type !== "Lab" ||
        SUBJECTS.find(s => s.id === record.subjectId)?.lab)
    );
  }

  function getStats(records) {
    const counted = records.filter(r => r.status !== "Leave");
    const present = counted.filter(r => r.status === "Present").length;
    const absent = counted.filter(r => r.status === "Absent").length;
    const rate = counted.length ? (present / counted.length) * 100 : 0;

    return {
      total: counted.length,
      present,
      absent,
      rate,
      leaves: records.filter(r => r.status === "Leave").length
    };
  }

  function getSubjectStats(subjectId, type) {
    let records = validAttendanceRecords().filter(
      r => r.subjectId === subjectId
    );
    if (type) records = records.filter(r => r.type === type);
    return getStats(records);
  }

  function renderSubjectOptions() {
    const options = SUBJECTS.map(s =>
      `<option value="${s.id}">${escapeHTML(s.name)}</option>`
    ).join("");

    $("attendanceSubject").innerHTML = options;
    $("surveySubject").innerHTML = options;
    updateSessionType();
  }

  function updateSessionType() {
    const subject = SUBJECTS.find(
      s => s.id === $("attendanceSubject").value
    );

    const labOption = $("attendanceType").querySelector(
      'option[value="Lab"]'
    );

    labOption.disabled = !subject?.lab;

    if (!subject?.lab && $("attendanceType").value === "Lab") {
      $("attendanceType").value = "Lecture";
    }
  }

  $("attendanceSubject").addEventListener("change", updateSessionType);

  $("attendanceDate").value = todayString();

  $("attendanceForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const subjectId = $("attendanceSubject").value;
    const type = $("attendanceType").value;
    const status = $("attendanceStatus").value;
    const date = $("attendanceDate").value;
    const subject = SUBJECTS.find(s => s.id === subjectId);

    if (!subject || !date) {
      notify("Please select a subject and date.");
      return;
    }

    if (type === "Lab" && !subject.lab) {
      notify("Labs are available only for the first three subjects.");
      return;
    }

    if (date > todayString()) {
      notify("Please select today or a past date.");
      return;
    }

    const duplicate = data.attendance.some(record =>
      record.subjectId === subjectId &&
      record.type === type &&
      record.date === date
    );

    if (duplicate) {
      notify("A record for this subject, session type and date already exists.");
      return;
    }

    data.attendance.push({
      id: (crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + "-" + Math.random().toString(16).slice(2)),
      subjectId,
      type,
      status,
      date
    });

    if (saveData()) {
      renderAll();
      $("attendanceDate").value = todayString();
      notify("Attendance saved successfully.");
    }
  });

  function renderAttendanceStats() {
    const stats = getStats(validAttendanceRecords());
    $("attTotal").textContent = stats.total;
    $("attPresent").textContent = stats.present;
    $("attAbsent").textContent = stats.absent;
    $("attRate").textContent = stats.rate.toFixed(1) + "%";

    $("statAttendance").textContent = stats.rate.toFixed(1) + "%";
    $("statPresent").textContent = stats.present;

    const lowCount = SUBJECTS.filter(subject => {
      const s = getSubjectStats(subject.id);
      return s.total > 0 && s.rate < 75;
    }).length;
    $("statLow").textContent = lowCount;
    $("statSubjects").textContent = SUBJECTS.length;
  }

  function statusBadge(status) {
    const className = status.toLowerCase();
    return `<span class="status status-${className}">${escapeHTML(status)}</span>`;
  }

  function renderAttendanceHistory() {
    const records = [...validAttendanceRecords()].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    if (!records.length) {
      $("attendanceHistory").innerHTML =
        '<div class="empty-state">No attendance records yet.<br>Use the form above to add your first class.</div>';
      return;
    }

    $("attendanceHistory").innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Date</th><th>Subject</th><th>Type</th>
            <th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
            ${records.map(r => `
              <tr>
                <td>${escapeHTML(r.date)}</td>
                <td><strong>${escapeHTML(subjectName(r.subjectId))}</strong></td>
                <td>${escapeHTML(r.type)}</td>
                <td>${statusBadge(r.status)}</td>
                <td><button class="delete-btn" type="button"
                  data-action="delete-attendance" data-id="${escapeHTML(r.id)}">
                  Delete</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function renderRecentRecords() {
    const records = [...validAttendanceRecords()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    if (!records.length) {
      $("recentRecords").innerHTML =
        '<div class="empty-state">Your recent records will appear here after you save attendance.</div>';
      return;
    }

    $("recentRecords").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Subject</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>${records.map(r => `
          <tr><td>${escapeHTML(r.date)}</td>
          <td><strong>${escapeHTML(subjectName(r.subjectId))}</strong></td>
          <td>${escapeHTML(r.type)}</td><td>${statusBadge(r.status)}</td></tr>
        `).join("")}</tbody>
      </table></div>`;
  }

  function renderProgressList() {
    $("dashboardSubjects").innerHTML = SUBJECTS.map(subject => {
      const stats = getSubjectStats(subject.id);
      const width = stats.rate.toFixed(1);
      return `
        <div class="progress-item">
          <div class="progress-top">
            <strong>${escapeHTML(subject.name)}</strong>
            <span>${stats.total ? width + "%" : "No records"}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${width}%"></div>
          </div>
        </div>`;
    }).join("");
  }

  // ------------------------------
  // 4. Subject cards and lab details
  // ------------------------------
  function renderSubjectCards() {
    $("subjectCards").innerHTML = SUBJECTS.map((subject, index) => {
      const stats = getSubjectStats(subject.id);
      const lecture = getSubjectStats(subject.id, "Lecture");
      const lab = getSubjectStats(subject.id, "Lab");

      return `
        <article class="subject-card">
          <div class="subject-card-head">
            <div class="subject-number">${String(index + 1).padStart(2, "0")}</div>
            <div>
              <h3>${escapeHTML(subject.name)}</h3>
              <p>${subject.lab ? "Lecture + Laboratory" : "Lecture only"}</p>
            </div>
            <div class="subject-rate">${stats.total ? stats.rate.toFixed(1) + "%" : "—"}</div>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${stats.rate.toFixed(1)}%"></div>
          </div>
          <div class="subject-metrics">
            <span class="metric-chip">Lecture: ${lecture.present}/${lecture.total} present</span>
            ${subject.lab
              ? `<span class="metric-chip">Lab: ${lab.present}/${lab.total} present</span>`
              : ""}
            <span class="metric-chip">${stats.total} counted sessions</span>
          </div>
          <div class="subject-card-actions">
            <button class="btn btn-secondary" type="button"
              data-action="manage-subject" data-subject="${subject.id}"
              data-type="Lecture">Manage Lecture</button>
            ${subject.lab ? `
              <button class="btn btn-primary" type="button"
                data-action="manage-subject" data-subject="${subject.id}"
                data-type="Lab">Manage Lab</button>` : ""}
          </div>
        </article>`;
    }).join("");
  }

  // ------------------------------
  // 5. Student profile
  // ------------------------------
  function renderProfile() {
    $("profileName").value = data.profile.name || "";
    $("profileRoll").value = data.profile.roll || "";
    $("profileEmail").value = data.profile.email || "";
    $("profileDepartment").value = data.profile.department || "";
    $("profileSemester").value = data.profile.semester || "1st Semester";
    $("profileUniversity").value = data.profile.university || "";

    const name = data.profile.name.trim() || "Student";
    $("headerName").textContent = name;
    $("dashName").textContent = name;
    $("headerAvatar").textContent = name.charAt(0).toUpperCase();
    $("profileAvatar").textContent = name.charAt(0).toUpperCase();
  }

  $("profileForm").addEventListener("submit", function (event) {
    event.preventDefault();

    data.profile = {
      name: $("profileName").value.trim() || "Student",
      roll: $("profileRoll").value.trim(),
      email: $("profileEmail").value.trim(),
      department: $("profileDepartment").value.trim(),
      semester: $("profileSemester").value,
      university: $("profileUniversity").value.trim()
    };

    if (saveData()) {
      renderProfile();
      notify("Profile saved successfully.");
    }
  });

  // ------------------------------
  // 6. Student survey
  // ------------------------------
  $("surveyForm").addEventListener("submit", function (event) {
    event.preventDefault();

    data.surveys.push({
      id: Date.now().toString(),
      subjectId: $("surveySubject").value,
      teaching: $("surveyTeaching").value,
      experience: $("surveyExperience").value,
      material: $("surveyMaterial").value,
      comments: $("surveyComments").value.trim(),
      date: todayString()
    });

    if (saveData()) {
      $("surveyForm").reset();
      renderSurveyHistory();
      notify("Thank you! Your survey has been saved.");
    }
  });

  function renderSurveyHistory() {
    const surveys = [...data.surveys].reverse();

    if (!surveys.length) {
      $("surveyHistory").innerHTML =
        '<div class="empty-state">No surveys submitted yet.</div>';
      return;
    }

    $("surveyHistory").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Subject</th><th>Teaching</th>
        <th>Experience</th><th>Material</th></tr></thead>
        <tbody>${surveys.map(s => `
          <tr><td>${escapeHTML(s.date)}</td>
          <td>${escapeHTML(subjectName(s.subjectId))}</td>
          <td>${escapeHTML(s.teaching)}</td>
          <td>${escapeHTML(s.experience)}</td>
          <td>${escapeHTML(s.material)}</td></tr>
          ${s.comments ? `<tr><td colspan="5"><strong>Comment:</strong> ${escapeHTML(s.comments)}</td></tr>` : ""}
        `).join("")}</tbody>
      </table></div>`;
  }

  // ------------------------------
  // 7. Editable sample result card
  // ------------------------------
  function getMark(subjectId) {
    return data.marks.find(m => m.subjectId === subjectId);
  }

  function validMark(mark) {
    if (mark.obtained === "" || mark.obtained === null) return null;

    const obtained = Number(mark.obtained);
    const maximum = Number(mark.maximum);

    if (!Number.isFinite(obtained) || !Number.isFinite(maximum) ||
        maximum <= 0 || obtained < 0 || obtained > maximum) {
      return null;
    }

    return { obtained, maximum, percent: obtained / maximum * 100 };
  }

  function gradeFor(percent) {
    if (percent >= 90) return "A+";
    if (percent >= 80) return "A";
    if (percent >= 70) return "B";
    if (percent >= 60) return "C";
    if (percent >= 50) return "D";
    return "F";
  }

  function renderResults() {
    $("resultTable").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Subject</th><th>Obtained marks</th>
        <th>Maximum marks</th><th>Percentage</th><th>Grade</th></tr></thead>
        <tbody>${SUBJECTS.map(subject => {
          const mark = getMark(subject.id);
          const result = validMark(mark);
          return `<tr>
            <td><strong>${escapeHTML(subject.name)}</strong></td>
            <td><input type="number" min="0" step="any" max="${Number(mark.maximum) || 100}"
              aria-label="${escapeHTML(subject.name)} obtained marks"
              data-mark-subject="${subject.id}" data-mark-field="obtained"
              value="${escapeHTML(mark.obtained)}" placeholder="—"></td>
            <td><input type="number" min="1" step="any"
              aria-label="${escapeHTML(subject.name)} maximum marks"
              data-mark-subject="${subject.id}" data-mark-field="maximum"
              value="${escapeHTML(mark.maximum)}"></td>
            <td>${result ? result.percent.toFixed(1) + "%" : "—"}</td>
            <td>${result ? gradeFor(result.percent) : "—"}</td>
          </tr>`;
        }).join("")}</tbody>
      </table></div>`;

    const results = data.marks.map(validMark).filter(Boolean);
    const obtained = results.reduce((sum, r) => sum + r.obtained, 0);
    const maximum = results.reduce((sum, r) => sum + r.maximum, 0);
    const average = maximum ? obtained / maximum * 100 : 0;
    const passed = results.filter(r => r.percent >= 50).length;

    $("resultObtained").textContent = obtained.toFixed(1).replace(/\.0$/, "");
    $("resultMaximum").textContent = maximum.toFixed(1).replace(/\.0$/, "");
    $("resultAverage").textContent = average.toFixed(1) + "%";
    $("resultPassed").textContent = passed + "/" + results.length;
  }

  $("resultTable").addEventListener("change", function (event) {
    const input = event.target.closest("[data-mark-subject]");
    if (!input) return;

    const mark = getMark(input.dataset.markSubject);
    if (!mark) return;

    const field = input.dataset.markField;
    const value = input.value;

    if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      notify("Enter a valid non-negative number.");
      renderResults();
      return;
    }

    mark[field] = value === "" ? "" : Number(value);

    const obtained = Nu
