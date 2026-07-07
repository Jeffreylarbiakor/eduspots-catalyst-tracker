/**
 * app.js — rendering, navigation, filters, and modal logic.
 *
 * Reminder of the core principle (see README.md): this app flags and
 * summarizes using visible, threshold-based rules. It never auto-resolves
 * anything, and it never decides that a Catalyst is ready to graduate
 * induction — that stays a human (RC) judgment call.
 */

const ACK_STORAGE_KEY = "eduspots-catalyst-tracker-acknowledged";

function loadAcknowledged() {
  try {
    const raw = localStorage.getItem(ACK_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}
function saveAcknowledged(set) {
  try {
    localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...set]));
  } catch (e) {
    /* ignore quota / privacy-mode errors */
  }
}

const state = {
  view: "overview",
  boardRcFilter: "all",
  stalledRcFilter: "all",
  acknowledged: loadAcknowledged(),
};

function rcById(id) {
  return REAL_REGIONAL_COORDINATORS.find((r) => r.id === id);
}
function rcFirstName(id) {
  const rc = rcById(id);
  return rc ? rc.name.split(" ")[0] : "—";
}

// ---------------------------------------------------------------------------
// NAV
// ---------------------------------------------------------------------------
function setView(view) {
  state.view = view;
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((sec) => {
    sec.hidden = sec.id !== `view-${view}`;
  });
  renderCurrentView();
}

function renderCurrentView() {
  if (state.view === "overview") renderOverview();
  if (state.view === "board") renderBoard();
  if (state.view === "rcs") renderRcClusters();
  if (state.view === "stalled") renderStalled();
}

// ---------------------------------------------------------------------------
// OVERVIEW
// ---------------------------------------------------------------------------
function renderOverview() {
  const inInduction = CATALYSTS.filter((c) => c.status.level !== "graduated").length;
  const graduated = CATALYSTS.filter((c) => c.status.level === "graduated").length;
  const needsFollowUp = CATALYSTS.filter(
    (c) => c.status.level === "watch" || c.status.level === "stalled"
  ).length;

  const graduatedList = CATALYSTS.filter((c) => c.status.level === "graduated");
  const avgDays =
    graduatedList.length > 0
      ? Math.round(
          graduatedList.reduce(
            (sum, c) => sum + daysBetween(c.inductionStartDate, c.lastProgressDate),
            0
          ) / graduatedList.length
        )
      : 0;

  const rcCount = REAL_REGIONAL_COORDINATORS.length;

  const kpis = [
    { label: "In induction", value: inInduction, tone: "sky" },
    { label: "Graduated", value: graduated, tone: "forest" },
    { label: "Needs RC follow-up", value: needsFollowUp, tone: "clay" },
    { label: "Avg. days to graduate", value: `${avgDays}d`, tone: "gold" },
    { label: "RC clusters", value: rcCount, tone: "muted" },
  ];

  document.getElementById("kpiRow").innerHTML = kpis
    .map(
      (k) => `
      <div class="kpi-card kpi-${k.tone}">
        <p class="kpi-value">${k.value}</p>
        <p class="kpi-label">${k.label}</p>
      </div>`
    )
    .join("");

  renderStepFunnelChart(CATALYSTS);
  renderRcClusterChart(CATALYSTS);
}

// ---------------------------------------------------------------------------
// PIPELINE BOARD
// ---------------------------------------------------------------------------
function populateRcFilters() {
  const options =
    `<option value="all">All RC clusters</option>` +
    REAL_REGIONAL_COORDINATORS.map((rc) => `<option value="${rc.id}">${rc.name}</option>`).join("");
  document.getElementById("rcFilterBoard").innerHTML = options;
  document.getElementById("rcFilterStalled").innerHTML = options;
}

function statusDotClass(level) {
  if (level === "stalled") return "dot-stalled";
  if (level === "watch") return "dot-watch";
  if (level === "graduated") return "dot-graduated";
  return "dot-ontrack";
}

function renderBoard() {
  const filtered =
    state.boardRcFilter === "all"
      ? CATALYSTS
      : CATALYSTS.filter((c) => c.rcId === state.boardRcFilter);

  const columns = [...INDUCTION_STEPS.map((s, i) => ({ index: i, label: s.label })), { index: 6, label: "Graduated" }];

  const board = document.getElementById("pipelineBoard");
  board.innerHTML = columns
    .map((col) => {
      const cards = filtered.filter((c) =>
        col.index === 6 ? c.status.level === "graduated" : c.currentStepIndex === col.index && c.status.level !== "graduated"
      );
      return `
        <div class="board-col">
          <div class="board-col-header">
            <span>${col.label}</span>
            <span class="board-col-count">${cards.length}</span>
          </div>
          <div class="board-col-body">
            ${cards
              .map(
                (c) => `
              <button class="cat-card ${statusDotClass(c.status.level)}" data-id="${c.id}">
                <span class="cat-card-dot"></span>
                <span class="cat-card-name">${c.name}</span>
                <span class="cat-card-meta">${c.spotName} · ${rcFirstName(c.rcId)}</span>
              </button>`
              )
              .join("") || `<p class="board-col-empty">No Catalysts here</p>`}
          </div>
        </div>`;
    })
    .join("");

  board.querySelectorAll(".cat-card").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
}

// ---------------------------------------------------------------------------
// RC CLUSTERS
// ---------------------------------------------------------------------------
function renderRcClusters() {
  const tbody = document.querySelector("#rcTable tbody");
  tbody.innerHTML = REAL_REGIONAL_COORDINATORS.map((rc) => {
    const mine = CATALYSTS.filter((c) => c.rcId === rc.id);
    const onTrack = mine.filter((c) => c.status.level === "on-track").length;
    const watch = mine.filter((c) => c.status.level === "watch").length;
    const stalled = mine.filter((c) => c.status.level === "stalled").length;
    const graduated = mine.filter((c) => c.status.level === "graduated");
    const avgDays =
      graduated.length > 0
        ? Math.round(
            graduated.reduce((s, c) => s + daysBetween(c.inductionStartDate, c.lastProgressDate), 0) /
              graduated.length
          )
        : null;

    return `
      <tr>
        <td>${rc.name}</td>
        <td class="muted">${rc.region}</td>
        <td class="mono">${mine.length}</td>
        <td class="mono">${onTrack}</td>
        <td class="mono">${watch}</td>
        <td class="mono">${stalled}</td>
        <td class="mono">${graduated.length}</td>
        <td class="mono">${avgDays !== null ? avgDays + "d" : "–"}</td>
      </tr>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// STALLED CATALYSTS
// ---------------------------------------------------------------------------
function renderStalled() {
  const flagged = CATALYSTS.filter(
    (c) => c.status.level === "watch" || c.status.level === "stalled"
  ).filter((c) => state.stalledRcFilter === "all" || c.rcId === state.stalledRcFilter);

  // update nav badge regardless of filter (always reflects the true total)
  const totalFlagged = CATALYSTS.filter(
    (c) => c.status.level === "watch" || c.status.level === "stalled"
  ).length;
  document.getElementById("navStalledBadge").textContent = totalFlagged;

  const list = document.getElementById("stalledList");
  if (flagged.length === 0) {
    list.innerHTML = `<p class="empty-state">No Catalysts currently flagged in this cluster.</p>`;
    return;
  }

  list.innerHTML = flagged
    .sort((a, b) => (a.status.level === b.status.level ? 0 : a.status.level === "stalled" ? -1 : 1))
    .map((c) => {
      const acked = state.acknowledged.has(c.id);
      return `
      <div class="stalled-row ${statusDotClass(c.status.level)}">
        <div class="stalled-row-main">
          <button class="stalled-row-name" data-id="${c.id}">
            <span class="cat-card-dot"></span> ${c.name}
          </button>
          <p class="stalled-row-meta">${c.spotName} · RC: ${rcFirstName(c.rcId)} · <span class="status-pill status-${c.status.level}">${c.status.level}</span></p>
          <ul class="stalled-reasons">
            ${c.status.reasons.map((r) => `<li>${r}</li>`).join("")}
          </ul>
        </div>
        <div class="stalled-row-action">
          <button class="ack-btn ${acked ? "acked" : ""}" data-id="${c.id}">
            ${acked ? "✓ Acknowledged" : "Acknowledge for follow-up"}
          </button>
        </div>
      </div>`;
    })
    .join("");

  list.querySelectorAll(".stalled-row-name").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.id));
  });
  list.querySelectorAll(".ack-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (state.acknowledged.has(id)) {
        state.acknowledged.delete(id);
      } else {
        state.acknowledged.add(id);
      }
      saveAcknowledged(state.acknowledged);
      renderStalled();
    });
  });
}

// ---------------------------------------------------------------------------
// MODAL
// ---------------------------------------------------------------------------
function openModal(id) {
  const c = CATALYSTS.find((x) => x.id === id);
  if (!c) return;
  const rc = rcById(c.rcId);
  const daysSinceProgress = daysBetween(c.lastProgressDate, TODAY);

  const checklist = INDUCTION_STEPS.map((step, i) => {
    const s = c.steps[i];
    const isCurrent = !s.complete && i === c.currentStepIndex;
    return `
      <li class="checklist-item ${s.complete ? "done" : ""} ${isCurrent ? "current" : ""}">
        <span class="checklist-mark">${s.complete ? "✓" : isCurrent ? "→" : "○"}</span>
        <span class="checklist-label">${step.label}</span>
        <span class="checklist-date mono">${s.complete ? fmtDate(s.date) : ""}</span>
      </li>`;
  }).join("");

  const reasonsBlock =
    c.status.reasons.length > 0
      ? `<div class="modal-flag-box status-${c.status.level}">
           <p class="modal-flag-title">Flagged: ${c.status.level}</p>
           <ul>${c.status.reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
         </div>`
      : "";

  const graduateNote =
    c.status.level === "graduated"
      ? `<p class="modal-note">All 6 steps are complete. This does not by itself mean induction is finished — an RC must still confirm the Catalyst is ready to graduate.</p>`
      : "";

  document.getElementById("modalBody").innerHTML = `
    <h2 id="modalName" class="modal-name">${c.name}</h2>
    <p class="modal-sub">
      <span class="status-pill status-${c.status.level}">${c.status.level}</span>
      Catalyst ID: <span class="mono">${c.id}</span>
    </p>

    <div class="modal-facts">
      <div><span class="fact-label">Spot</span><span class="fact-value">${c.spotName}</span></div>
      <div><span class="fact-label">Regional Coordinator</span><span class="fact-value">${rc.name}</span></div>
      <div><span class="fact-label">Induction start</span><span class="fact-value mono">${fmtDate(c.inductionStartDate)}</span></div>
      <div><span class="fact-label">Days since last progress</span><span class="fact-value mono">${daysSinceProgress}d</span></div>
    </div>

    ${reasonsBlock}

    <h3 class="modal-section-title">Induction checklist</h3>
    <ul class="checklist">${checklist}</ul>

    <div class="whats-next">
      <p class="whats-next-label">What's next</p>
      <p class="whats-next-text">${whatsNext(c)}</p>
    </div>

    ${graduateNote}
  `;

  document.getElementById("modalOverlay").hidden = false;
}

function closeModal() {
  document.getElementById("modalOverlay").hidden = true;
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
function init() {
  populateRcFilters();

  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  document.getElementById("rcFilterBoard").addEventListener("change", (e) => {
    state.boardRcFilter = e.target.value;
    renderBoard();
  });
  document.getElementById("rcFilterStalled").addEventListener("change", (e) => {
    state.stalledRcFilter = e.target.value;
    renderStalled();
  });

  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // nav badge needs the true (unfiltered) count on load
  const totalFlagged = CATALYSTS.filter(
    (c) => c.status.level === "watch" || c.status.level === "stalled"
  ).length;
  document.getElementById("navStalledBadge").textContent = totalFlagged;

  renderCurrentView();
}

document.addEventListener("DOMContentLoaded", init);
