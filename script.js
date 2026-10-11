
/*
  AttendX — Online University Attendance Demo
  All data is illustrative and stored in this script.
  Connect a secure backend before using real university records.
*/

const courses = [
  {id:"db",name:"Database Systems",code:"CS-301",teacher:"Dr. Ayesha Malik",day:"Monday",time:"02:30 PM",duration:"60 min",pct:92,attended:11,total:12,color:"#6588e6",pale:"#edf2ff",icon:"DB",description:"SQL, relational databases and data modelling."},
  {id:"sec",name:"Information Security",code:"CS-305",teacher:"Mr. Hamza Qureshi",day:"Monday",time:"04:00 PM",duration:"60 min",pct:83,attended:10,total:12,color:"#9879d9",pale:"#f3efff",icon:"IS",description:"Cybersecurity principles, threats and risk management."},
  {id:"net",name:"Computer Networks",code:"CS-210",teacher:"Dr. Sara Ahmed",day:"Tuesday",time:"11:00 AM",duration:"90 min",pct:75,attended:9,total:12,color:"#d6a54c",pale:"#fbf5e7",icon:"CN",description:"Network models, routing and communication protocols."},
  {id:"ai",name:"Artificial Intelligence",code:"CS-320",teacher:"Dr. Bilal Shah",day:"Wednesday",time:"01:00 PM",duration:"60 min",pct:91,attended:10,total:11,color:"#4fae91",pale:"#eaf8f2",icon:"AI",description:"AI foundations, intelligent systems and search."},
  {id:"se",name:"Software Engineering",code:"CS-250",teacher:"Ms. Hira Noor",day:"Thursday",time:"10:00 AM",duration:"60 min",pct:82,attended:9,total:11,color:"#d57989",pale:"#fff0f2",icon:"SE",description:"Software lifecycles, requirements and project planning."}
];

const records = [
  {course:"Database Systems",code:"CS-301",date:"2026-10-08",teacher:"Dr. Ayesha Malik",duration:"60 min",status:"Present"},
  {course:"Information Security",code:"CS-305",date:"2026-10-07",teacher:"Mr. Hamza Qureshi",duration:"60 min",status:"Present"},
  {course:"Computer Networks",code:"CS-210",date:"2026-10-06",teacher:"Dr. Sara Ahmed",duration:"90 min",status:"Absent"},
  {course:"Artificial Intelligence",code:"CS-320",date:"2026-10-05",teacher:"Dr. Bilal Shah",duration:"60 min",status:"Present"},
  {course:"Software Engineering",code:"CS-250",date:"2026-10-02",teacher:"Ms. Hira Noor",duration:"60 min",status:"Late"},
  {course:"Database Systems",code:"CS-301",date:"2026-10-01",teacher:"Dr. Ayesha Malik",duration:"60 min",status:"Present"},
  {course:"Computer Networks",code:"CS-210",date:"2026-09-29",teacher:"Dr. Sara Ahmed",duration:"90 min",status:"Present"},
  {course:"Information Security",code:"CS-305",date:"2026-09-28",teacher:"Mr. Hamza Qureshi",duration:"60 min",status:"Absent"},
  {course:"Artificial Intelligence",code:"CS-320",date:"2026-09-25",teacher:"Dr. Bilal Shah",duration:"60 min",status:"Present"},
  {course:"Software Engineering",code:"CS-250",date:"2026-09-24",teacher:"Ms. Hira Noor",duration:"60 min",status:"Present"}
];

const schedule = {
  Monday:[
    {name:"Database Systems",time:"02:30 PM",duration:"60 min",color:"#6588e6",pale:"#edf2ff"},
    {name:"Information Security",time:"04:00 PM",duration:"60 min",color:"#9879d9",pale:"#f3efff"}
  ],
  Tuesday:[
    {name:"Computer Networks",time:"11:00 AM",duration:"90 min",color:"#d6a54c",pale:"#fbf5e7"}
  ],
  Wednesday:[
    {name:"Artificial Intelligence",time:"01:00 PM",duration:"60 min",color:"#4fae91",pale:"#eaf8f2"}
  ],
  Thursday:[
    {name:"Software Engineering",time:"10:00 AM",duration:"60 min",color:"#d57989",pale:"#fff0f2"},
    {name:"Database Systems",time:"02:30 PM",duration:"60 min",color:"#6588e6",pale:"#edf2ff"}
  ],
  Friday:[
    {name:"Information Security",time:"12:00 PM",duration:"60 min",color:"#9879d9",pale:"#f3efff"}
  ]
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  '"':"&quot;",
  "'":"&#39;"
}[char]));

function notify(message, icon="✓") {
  const toast = document.createElement("div");
  toast.className = "toast";

  const symbol = document.createElement("b");
  symbol.textContent = icon;

  const text = document.createElement("span");
  text.textContent = message;

  toast.append(symbol, text);
  $("#toastRegion").appendChild(toast);

  setTimeout(() => toast.remove(), 3200);
}

/* Navigation */

function showView(view) {
  const target = $(`#view-${view}`);
  if (!target) return;

  $$(".view").forEach(section => section.classList.remove("active"));
  target.classList.add("active");

  $$(".nav-link[data-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  const titles = {
    overview:"Overview",
    classes:"Online classes",
    attendance:"Attendance records",
    timetable:"Timetable",
    reports:"Reports & analytics",
    settings:"Settings"
  };

  $("#pageTitle").textContent = titles[view] || "Overview";

  $("#greeting").innerHTML = view === "overview"
    ? `Good evening, ${escapeHTML($("#profileName").textContent)} <span class="gold">✦</span>`
    : escapeHTML(titles[view] || "Overview");

  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}

/* Dashboard */

function renderSubjects() {
  $("#subjectList").innerHTML = courses.map(course => `
    <div>
      <div class="subject-top">
        <span class="subject-name">
          <i class="subject-dot" style="background:${course.color}"></i>
          ${escapeHTML(course.name)}
        </span>
        <span class="subject-percent">${course.pct}%</span>
      </div>
      <div class="subject-track">
        <span style="width:${course.pct}%;background:${course.color}"></span>
      </div>
      <div class="subject-caption">
        ${course.attended} of ${course.total} classes attended
        ${course.pct <= 75 ? " · At the example minimum" : ""}
      </div>
    </div>
  `).join("");

  $("#reportCourses").innerHTML = courses.map(course => `
    <div class="report-course">
      <div>
        <strong>${escapeHTML(course.name)}</strong>
        <small>${course.code} · ${course.attended}/${course.total} attended</small>
      </div>
      <div class="report-bar">
        <span style="width:${course.pct}%;background:${course.color}"></span>
      </div>
      <div class="report-percent"
           style="color:${course.pct<=75?"#c05669":"#41475a"}">
        ${course.pct}%
      </div>
    </div>
  `).join("");
}

function renderUpcoming() {
  const upcoming = [
    {course:courses[0],when:"Today"},
    {course:courses[1],when:"Today"},
    {course:courses[2],when:"Tomorrow"}
  ];

  $("#upcomingList").innerHTML = upcoming.map(item => `
    <div class="upcoming-item">
      <div class="course-icon"
           style="background:${item.course.pale};color:${item.course.color}">
        ${item.course.icon}
      </div>
      <div class="course-copy">
        <strong>${escapeHTML(item.course.name)}</strong>
        <small>${escapeHTML(item.course.teacher)} · ${item.when}</small>
      </div>
      <div class="session-time">
        <strong>${item.course.time}</strong>
        <small>Online session</small>
      </div>
      <button class="join-small" data-join="${item.course.id}">Join</button>
    </div>
  `).join("");
}

/* Online classes */

function renderClasses() {
  const search = ($("#classSearch")?.value || "").toLowerCase().trim();

  const filtered = courses.filter(course =>
    `${course.name} ${course.code} ${course.teacher}`
      .toLowerCase().includes(search)
  );

  $("#classGrid").innerHTML = filtered.length
    ? filtered.map(course => `
      <article class="class-card">
        <div class="class-card-top">
          <div class="course-icon"
               style="width:44px;height:44px;background:${course.pale};color:${course.color}">
            ${course.icon}
          </div>
          <span class="tag">ONLINE</span>
        </div>
        <h3>${escapeHTML(course.name)}</h3>
        <span class="course-code">${course.code} · Section A</span>
        <p>${escapeHTML(course.description)}</p>
        <div class="class-card-bottom">
          <div>
            <strong>${course.time}</strong>
            <small>${course.day} · ${course.duration}</small>
          </div>
          <button class="btn btn-primary" data-join="${course.id}">
            Join class ↗
          </button>
        </div>
      </article>
    `).join("")
    : `<article class="panel"><h2>No classes found</h2><p class="muted">Try another search.</p></article>`;
}

/* Attendance table */

function renderAttendance() {
  const filter = $("#statusFilter").value;

  const filtered = records.filter(record =>
    filter === "all" || record.status === filter
  );

  $("#attendanceTable").innerHTML = filtered.map(record => `
    <tr>
      <td>
        <strong>${escapeHTML(record.course)}</strong>
        <small>${record.code}</small>
      </td>
      <td>${new Date(record.date+"T12:00:00").toLocaleDateString("en-GB", {
        day:"2-digit",month:"short",year:"numeric"
      })}</td>
      <td>${escapeHTML(record.teacher)}</td>
      <td>${record.duration}</td>
      <td><span class="status ${record.status.toLowerCase()}">${record.status}</span></td>
    </tr>
  `).join("");

  $("#recordCount").textContent =
    `Showing ${filtered.length} sample record${filtered.length===1?"":"s"}`;
}

/* Weekly timetable */

function renderTimetable() {
  $("#timetableGrid").innerHTML = Object.entries(schedule).map(([day,events]) => `
    <div class="day-column">
      <div class="day-title">${day}<small>${events.length} session${events.length===1?"":"s"}</small></div>
      ${events.map(event => `
        <div class="event"
             style="background:${event.pale};border-color:${event.color};color:#454b60">
          <strong>${escapeHTML(event.name)}</strong>
          <small>${event.time}</small>
          <small>${event.duration} · Online</small>
        </div>
      `).join("")}
    </div>
  `).join("");
}

/* Attendance chart */

function drawChart(range="week") {
  const values = range === "week"
    ? [72,78,75,88,82,91,86]
    : [68,72,70,77,75,81,78,84,80,87,82,86];

  const labels = range === "week"
    ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    : ["Sep 12","Sep 15","Sep 18","Sep 21","Sep 24","Sep 27",
       "Sep 30","Oct 3","Oct 5","Oct 7","Oct 9","Oct 11"];

  const width = 700;
  const height = 220;
  const padding = 8;

  const points = values.map((value,index) => ({
    x:padding + index * (width-2*padding)/(values.length-1),
    y:height - value/100*height
  }));

  const line = points.map((point,index) =>
    `${index===0?"M":"L"} ${point.x} ${point.y}`
  ).join(" ");

  $("#chartLine").setAttribute("d",line);
  $("#chartFill").setAttribute(
    "d",
    `${line} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`
  );

  $("#chartDots").innerHTML = points.map(point => `
    <circle cx="${point.x}" cy="${point.y}" r="4"
      fill="white" stroke="#c5a04d" stroke-width="3"/>
  `).join("");

  $("#chartLabels").innerHTML = labels.map(label =>
    `<span>${label}</span>`
  ).join("");

  const average = values.reduce((sum,value) => sum+value,0)/values.length;
  $("#chartAverage").textContent = `${average.toFixed(1)}%`;
}

/* Modal and class joining */

function openModal(content) {
  $("#modalContent").innerHTML = content;
  $("#modalBackdrop").classList.add("open");
  $("#modalBackdrop").setAttribute("aria-hidden","false");
}

function closeModal() {
  $("#modalBackdrop").classList.remove("open");
  $("#modalBackdrop").setAttribute("aria-hidden","true");
}

function joinClass(id) {
  const course = courses.find(item => item.id === id);
  if (!course) return;

  openModal(`
    <div class="modal-kicker">ONLINE CLASS SESSION</div>
    <h2 id="modalTitle">${escapeHTML(course.name)}</h2>
    <p>${escapeHTML(course.description)}</p>
    <div class="modal-info-grid">
      <div class="modal-info"><small>Instructor</small><strong>${escapeHTML(course.teacher)}</strong></div>
      <div class="modal-info"><small>Schedule</small><strong>${course.day}, ${course.time}</strong></div>
      <div class="modal-info"><small>Sample attendance</small><strong>${course.pct}%</strong></div>
      <div class="modal-info"><small>Session type</small><strong>Online lecture</strong></div>
    </div>
    <p><strong>Demo notice:</strong> This prototype does not connect to Zoom, Teams or a university meeting service. Continuing demonstrates the class-launch flow only.</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="cancelJoin">Cancel</button>
      <button class="btn btn-primary" id="confirmJoin">Continue to demo ↗</button>
    </div>
  `);

  $("#cancelJoin").addEventListener("click",closeModal);

  $("#confirmJoin").addEventListener("click",() => {
    closeModal();
    openModal(`
      <div class="modal-kicker">DEMO SESSION</div>
      <h2 id="modalTitle">You're ready to learn</h2>
      <p>This simulated class launch does not establish attendance. Connect an approved meeting provider and secure attendance verification service for real classes.</p>
      <div class="modal-info">
        <small>Selected course</small>
        <strong>${escapeHTML(course.name)}</strong>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="finishDemo">Got it</button>
      </div>
    `);
    $("#finishDemo").addEventListener("click",closeModal);
  });
}

/* QR attendance preview */

function openQR(id) {
  const course = courses.find(item => item.id === id);

  openModal(`
    <div class="modal-kicker">DEMO CHECK-IN</div>
    <h2 id="modalTitle">Online session check-in</h2>
    <p>This QR preview is illustrative. It does not verify student identity or create an official attendance record.</p>
    <div style="display:grid;place-items:center;padding:24px;background:#fafbfe;border:1px solid #eceef4;border-radius:12px;margin:18px 0">
      <div style="width:140px;height:140px;display:grid;place-items:center;border:8px solid #18213b;background:white;font-size:32px;font-weight:800;color:#18213b">▦ ▦<br>▦ ▦</div>
      <strong style="margin-top:18px">${escapeHTML(course?.name || "Online class")}</strong>
      <small style="margin-top:6px;color:#999">DEMO CODE: AX-2026</small>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="cancelQR">Cancel</button>
      <button class="btn btn-primary" id="simulateQR">Simulate check-in</button>
    </div>
  `);

  $("#cancelQR").addEventListener("click",closeModal);
  $("#simulateQR").addEventListener("click",() => {
    closeModal();
    notify("Demo check-in complete. No official record was created.");
  });
}

/* Attendance goal calculator */

function openCalculator() {
  openModal(`
    <div class="modal-kicker">ATTENDANCE PLANNER</div>
    <h2 id="modalTitle">Calculate your attendance goal</h2>
    <p>Estimate how many consecutive classes you need to attend to reach a target.</p>
    <div class="calculator-fields">
      <label>Classes attended<input id="calcAttended" type="number" min="0" value="18"></label>
      <label>Total classes held<input id="calcTotal" type="number" min="1" value="24"></label>
      <label>Required attendance
        <select id="calcTarget">
          <option value="75">75%</option>
          <option value="80">80%</option>
          <option value="85">85%</option>
          <option value="90">90%</option>
        </select>
      </label>
      <label>Future classes already missed<input id="calcMissed" type="number" min="0" value="0"></label>
    </div>
    <div class="calculator-result">
      <strong id="calcResult">6 classes</strong>
      <p id="calcExplanation"></p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="closeCalculator">Close</button>
      <button class="btn btn-primary" id="recalculate">Calculate</button>
    </div>
  `);

  const calculate = () => {
    const attended = Math.max(0,Number($("#calcAttended").value)||0);
    const total = Math.max(1,Number($("#calcTotal").value)||1);
    const missed = Math.max(0,Number($("#calcMissed").value)||0);
    const target = Number($("#calcTarget").value)/100;

    const validAttended = Math.min(attended,total);
    const effectiveTotal = total+missed;
    const currentPercentage = validAttended/effectiveTotal*100;

    let needed;
    if (target === 1) {
      needed = validAttended >= effectiveTotal ? 0 : Infinity;
    } else {
      needed = Math.max(0,Math.ceil(
        (target*effectiveTotal-validAttended)/(1-target)
      ));
    }

    $("#calcResult").textContent = needed === Infinity
      ? "Target unavailable"
      : needed === 0 ? "Target met" : `${needed} class${needed===1?"":"es"}`;

    $("#calcExplanation").textContent = needed === Infinity
      ? "A 100% target requires every class to be attended; after an absence, it cannot be recovered by attending future classes alone."
      : needed === 0
        ? `Your estimated attendance is ${currentPercentage.toFixed(1)}%, meeting the selected target.`
        : `Attend the next ${needed} classes consecutively to reach ${target*100}% or more, assuming no additional absences.`;
  };

  $("#closeCalculator").addEventListener("click",closeModal);
  $("#recalculate").addEventListener("click",calculate);
  calculate();
}

/* CSV downloads */

function downloadCSV(filename,rows) {
  const csv = rows.map(row =>
    row.map(value => `"${String(value ?? "").replace(/"/g,'""')}"`).join(",")
  ).join("\r\n");

  const blob = new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportAttendance() {
  downloadCSV("attendx-attendance-demo.csv",[
    ["Course","Code","Date","Instructor","Duration","Status"],
    ...records.map(record => [
      record.course,record.code,record.date,
      record.teacher,record.duration,record.status
    ])
  ]);
  notify("Sample attendance CSV downloaded.","↓");
}

function exportTimetable() {
  const rows = [["Day","Course","Time","Duration","Mode"]];

  Object.entries(schedule).forEach(([day,events]) => {
    events.forEach(event => rows.push([
      day,event.name,event.time,event.duration,"Online"
    ]));
  });

  downloadCSV("attendx-timetable-demo.csv",rows);
  notify("Sample timetable CSV downloaded.","↓");
}

/* Demo attendance assistant */

function assistantAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes("low") || q.includes("risk") || q.includes("below")) {
    const low = courses.filter(course => course.pct < 80);

    return low.length
      ? `Keep an eye on ${low.map(course=>`${course.name} (${course.pct}%)`).join(" and ")}. These are illustrative figures. Confirm official attendance and university requirements with your instructor.`
      : "No sample courses are below 80%.";
  }

  if (q.includes("improve") || q.includes("increase") || q.includes("better")) {
    return "Attend every upcoming online class, join on time, and check your records regularly. If you were present but marked absent, use your university's official correction process.";
  }

  if (q.includes("database")) {
    const course = courses[0];
    return `Database Systems currently shows ${course.pct}% in this demo, with ${course.attended} of ${course.total} sample classes attended.`;
  }

  if (q.includes("how many") || q.includes("miss")) {
    return "The number of classes you can miss depends on your course totals and your university's attendance policy. Use the Attendance Planner for an estimate.";
  }

  if (q.includes("attendance") || q.includes("percentage") || q.includes("overall")) {
    const attended = courses.reduce((sum,course)=>sum+course.attended,0);
    const total = courses.reduce((sum,course)=>sum+course.total,0);
    const percentage = attended/total*100;

    return `Across the course sample data
