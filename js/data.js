/**
 * data.js
 * ---------------------------------------------------------------------------
 * Seeded synthetic data generator + the status-rule engine for the Catalyst
 * Onboarding & Induction Pipeline Tracker.
 *
 * CORE PRINCIPLE (see README.md): automation flags and summarizes; a human
 * (the RC) always decides. Status flags and "what's next" checklists below
 * are generated from simple, visible threshold rules -- nothing here resolves
 * anything on its own, and whether a Catalyst is truly ready to graduate
 * induction is never an automated decision.
 * ---------------------------------------------------------------------------
 */

// ---- Seeded PRNG (mulberry32) -- same approach as Project #1's js/data.js ----
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20260706; // fixed seed -> reproducible demo data
const rand = mulberry32(SEED);

function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function weightedPick(options) {
  // options: [{ value, weight }]
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = rand() * total;
  for (const o of options) {
    if (r < o.weight) return o.value;
    r -= o.weight;
  }
  return options[options.length - 1].value;
}

// ---- Synthetic Catalyst names (clearly not real people) --------------------
const SYNTH_FIRST_NAMES = [
  "Ama", "Kojo", "Efua", "Kwabena", "Adjoa", "Yaw", "Akosua", "Kofi",
  "Abena", "Kwame", "Afia", "Kwesi", "Akua", "Fiifi", "Esi", "Nana",
  "Adwoa", "Kwadwo", "Aba", "Kobina", "Yaa", "Kwaku", "Afua", "Nii",
  "Abla", "Selorm", "Elikem", "Delali", "Mawuli", "Enam", "Sena", "Elom",
];
const SYNTH_LAST_NAMES = [
  "Osei", "Mensah", "Boateng", "Adjei", "Owusu", "Asante", "Darko", "Appiah",
  "Gyamfi", "Frimpong", "Antwi", "Amoah", "Sarpong", "Yeboah", "Agyeman",
  "Nkrumah", "Sackey", "Tetteh", "Kufuor", "Ofori", "Wiredu", "Kutu",
];

function syntheticName(usedNames) {
  let name;
  do {
    name = `${pick(SYNTH_FIRST_NAMES)} ${pick(SYNTH_LAST_NAMES)}`;
  } while (usedNames.has(name));
  usedNames.add(name);
  return name;
}

// ---- Date helpers ------------------------------------------------------------
const DAY_MS = 24 * 60 * 60 * 1000;
const TODAY = new Date("2026-07-06T00:00:00Z"); // fixed "today" -> reproducible

function daysAgo(n) {
  return new Date(TODAY.getTime() - n * DAY_MS);
}
function addDays(date, n) {
  return new Date(date.getTime() + n * DAY_MS);
}
function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

// ---- Catalyst generation -----------------------------------------------------
const NUM_CATALYSTS = 136;
const NUM_STEPS = INDUCTION_STEPS.length; // 6

/**
 * Distribute a total number of days across `count` step-completion gaps,
 * each gap at least 1 day, roughly even with a little jitter.
 */
function distributeGaps(totalDays, count) {
  if (count <= 0) return [];
  if (totalDays < count) totalDays = count; // guarantee >=1 day per gap
  const base = Math.floor(totalDays / count);
  const gaps = new Array(count).fill(base);
  let remainder = totalDays - base * count;
  for (let i = 0; i < count && remainder > 0; i++) {
    const bonus = Math.min(remainder, randInt(0, 3));
    gaps[i] += bonus;
    remainder -= bonus;
  }
  gaps[gaps.length - 1] += remainder;
  return gaps;
}

/**
 * Each profile controls two independent knobs that feed directly into the
 * status rules, so the generated mix of statuses is predictable:
 *   - daysSinceStart: total tenure in the pipeline (induction start -> today)
 *   - idle: days since the last completed step (today -> last progress)
 * targetComplete is how many of the 6 steps are done.
 */
const PROFILES = [
  {
    value: "graduated",
    weight: 27,
    build: () => {
      const daysSinceStart = randInt(45, 260);
      const idle = randInt(0, 20);
      return { targetComplete: NUM_STEPS, daysSinceStart, idle };
    },
  },
  {
    value: "on_track",
    weight: 53,
    build: () => {
      const daysSinceStart = randInt(6, 44);
      const idle = randInt(0, 10);
      const targetComplete = randInt(0, Math.min(5, Math.floor(daysSinceStart / 9)));
      return { targetComplete, daysSinceStart, idle };
    },
  },
  {
    value: "watch",
    weight: 10,
    build: () => {
      const daysSinceStart = randInt(45, 89);
      const idle = randInt(10, Math.min(29, daysSinceStart));
      const targetComplete = randInt(0, Math.min(4, Math.floor((daysSinceStart - idle) / 10) + 1));
      return { targetComplete, daysSinceStart, idle };
    },
  },
  {
    value: "stalled_recent",
    weight: 5,
    build: () => {
      const daysSinceStart = randInt(35, 89);
      const idle = randInt(30, daysSinceStart);
      const targetComplete = randInt(0, Math.min(3, Math.floor((daysSinceStart - idle) / 10)));
      return { targetComplete, daysSinceStart, idle };
    },
  },
  {
    value: "stalled_longtenure",
    weight: 5,
    build: () => {
      const daysSinceStart = randInt(90, 320);
      const idle = randInt(10, Math.min(120, daysSinceStart));
      const targetComplete = randInt(0, Math.min(4, Math.floor((daysSinceStart - idle) / 12)));
      return { targetComplete, daysSinceStart, idle };
    },
  },
];

function generateCatalyst(index, usedNames) {
  const id = `CAT-${String(index + 1).padStart(4, "0")}`;
  const name = syntheticName(usedNames);
  const spotName = pick(REAL_SPOT_NAMES);
  const rc = pick(REAL_REGIONAL_COORDINATORS);

  const profileOptions = PROFILES.map((p) => ({ value: p, weight: p.weight }));
  const profile = weightedPick(profileOptions);
  const { targetComplete, daysSinceStart, idle } = profile.build();

  const inductionStartDate = daysAgo(daysSinceStart);
  const elapsedForCompleted = Math.max(0, daysSinceStart - idle);

  const steps = INDUCTION_STEPS.map(() => ({ complete: false, date: null }));
  let currentStepIndex = 0;

  // lastProgressDate is always TODAY - idle, regardless of how many steps are
  // done, so the "idle" knob chosen by the profile is what actually drives
  // daysSinceProgress in the status rules (see computeCatalystStatus).
  let lastProgressDate = daysAgo(idle);

  if (targetComplete > 0) {
    const gaps = distributeGaps(elapsedForCompleted, targetComplete);
    let cursor = new Date(inductionStartDate);
    for (let i = 0; i < targetComplete; i++) {
      cursor = addDays(cursor, gaps[i]);
      if (cursor > TODAY) cursor = new Date(TODAY);
      steps[i].complete = true;
      steps[i].date = new Date(cursor);
    }
    currentStepIndex = targetComplete;
  } else {
    currentStepIndex = 0;
  }

  const allComplete = steps.every((s) => s.complete);
  if (allComplete) currentStepIndex = NUM_STEPS;

  if (lastProgressDate > TODAY) lastProgressDate = new Date(TODAY);
  if (lastProgressDate < inductionStartDate) lastProgressDate = new Date(inductionStartDate);

  const catalyst = {
    id,
    name,
    spotName,
    rcId: rc.id,
    inductionStartDate,
    steps,
    currentStepIndex,
    lastProgressDate,
  };

  catalyst.status = computeCatalystStatus(catalyst);
  return catalyst;
}

/**
 * computeCatalystStatus(catalyst)
 * ---------------------------------------------------------------------------
 * Transparent, threshold-based status rules -- no black-box scoring.
 * Returns { level, reasons[] } where level is one of:
 *   "graduated" | "on-track" | "watch" | "stalled"
 *
 * Two independent signals feed the rules:
 *   - daysSinceProgress: days since the last step was completed
 *   - daysSinceStart: total tenure in the pipeline since induction began
 * A Catalyst can be flagged for going quiet recently (daysSinceProgress) or
 * for simply being in the pipeline too long without graduating
 * (daysSinceStart) -- either is enough on its own.
 *
 * NOTE: "graduated" means the 6-step checklist is complete -- it does NOT
 * mean an RC has signed off that the Catalyst is ready. That judgment call
 * is always human. See README.md.
 * ---------------------------------------------------------------------------
 */
function computeCatalystStatus(catalyst) {
  const allComplete = catalyst.steps.every((s) => s.complete);
  if (allComplete) {
    return { level: "graduated", reasons: [] };
  }

  const daysSinceProgress = daysBetween(catalyst.lastProgressDate, TODAY);
  const daysSinceStart = daysBetween(catalyst.inductionStartDate, TODAY);
  const stepLabel = INDUCTION_STEPS[catalyst.currentStepIndex]
    ? INDUCTION_STEPS[catalyst.currentStepIndex].label
    : "the final step";

  const reasons = [];
  let level = "on-track";

  if (daysSinceProgress >= 30) {
    level = "stalled";
    reasons.push(`No step progress in ${daysSinceProgress} days`);
  }
  if (daysSinceStart >= 90) {
    level = "stalled";
    reasons.push(`Still on "${stepLabel}" ${daysSinceStart} days since induction start`);
  }

  if (level !== "stalled") {
    if (daysSinceProgress >= 14) {
      level = "watch";
      reasons.push(`No step progress in ${daysSinceProgress} days`);
    }
    if (daysSinceStart >= 45) {
      level = "watch";
      reasons.push(`Still on "${stepLabel}" ${daysSinceStart} days since induction start`);
    }
  }

  return { level, reasons };
}

function whatsNext(catalyst) {
  if (catalyst.status.level === "graduated") {
    return "All 6 steps complete -- ready for RC sign-off to confirm induction readiness.";
  }
  const next = INDUCTION_STEPS[catalyst.currentStepIndex];
  const rc = REAL_REGIONAL_COORDINATORS.find((r) => r.id === catalyst.rcId);
  return `Next: ${next.label} -- reach out to schedule with ${rc ? rc.name.split(" ")[0] : "your RC"}.`;
}

function buildCatalysts() {
  const usedNames = new Set();
  const list = [];
  for (let i = 0; i < NUM_CATALYSTS; i++) {
    list.push(generateCatalyst(i, usedNames));
  }
  return list;
}

const CATALYSTS = buildCatalysts();
