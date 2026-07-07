# Catalyst Onboarding & Induction Pipeline Tracker

**Status: Prototype** — a working demo built on synthetic data, not a shipped product.

Project #2 of 5 in an EduSpots operations automation portfolio, built for the **Head of Programme & Product Operations** application. This one maps directly to:

> "To work with the regional coordinators to ensure the effective recruitment, induction and tracking of Catalysts at local and central levels."

It's a companion to Project #1 (Spot Health & MEL Dashboard) and deliberately shares its design system, file conventions, and honesty-about-data principle — where Project #1 tracked the health of Spots, this one tracks individual Catalysts moving through EduSpots' 6-step induction pathway ("Ignite" phase, ahead of "Catalyse" and "Sustain"):

1. Community engagement
2. Team building
3. Safeguarding (Keeping Spots Safe)
4. Systems development (App/data training)
5. Digital skills
6. Pedagogical training

---

## The core principle

**Automation flags and summarizes; a human (the Regional Coordinator) always decides.**

Every status flag and "what's next" line in this tool is generated from simple, visible threshold rules — there is no hidden scoring model, and nothing here auto-resolves anything. Most importantly: **whether a Catalyst is actually ready to graduate induction is never an automated decision.** The "Graduated" status only means the 6-step checklist is complete — it is a prompt for an RC to have a conversation and sign off, not a substitute for that judgment call. Committee-formation, relationship-building, and readiness assessments stay strictly human, exactly as safeguarding decisions did in Project #1.

## How the status rules work

Computed per Catalyst inside `computeCatalystStatus()` in `js/data.js`, using two independent, visible signals — no black-box scoring:

- **`daysSinceProgress`** — days since the Catalyst's last completed step
- **`daysSinceStart`** — total days since induction began, whether or not they're graduated

| Status | Trigger |
|---|---|
| **Stalled** | No step progress in 30+ days, OR still on the current step 90+ days since induction start |
| **Watch** | No step progress in 14–29 days, OR on the current step 45–89 days since induction start |
| **On-track** | Neither of the above |
| **Graduated** | All 6 steps complete (still requires RC sign-off in real life) |

Every flagged Catalyst carries the specific reason(s) it was flagged, shown plainly in the UI — never just a coloured dot.

## Feature breakdown

**Overview** — KPI row (in induction / graduated / needing follow-up / avg. days to graduate / RC cluster count), a bar chart of where everyone sits across the 6 steps plus Graduated, and a doughnut chart of Catalyst distribution by RC cluster.

**Pipeline board** — a 7-column Kanban (6 induction steps + Graduated), colour-coded by status, filterable by RC cluster. Click any card to open the Catalyst's full detail view.

**RC clusters** — one row per Regional Coordinator: on-track / watch / stalled counts and their cluster's average days-to-graduate.

**Stalled Catalysts** — every Catalyst flagged watch or stalled, with the specific reason spelled out (e.g. *"No step progress in 34 days"*). An **Acknowledge for follow-up** button lets an RC mark that they've taken ownership — it never changes the Catalyst's step or status, it only records that a human is on it.

**Catalyst detail (modal)** — name, Spot, RC, induction start date, days since last progress, the full 6-step checklist with completion dates, an auto-generated "what's next" line, and — if flagged — the exact reason(s) in plain language.

## Design system

Reused exactly from Project #1 so the two prototypes read as a matched set: the same forest/gold/sky/clay palette, the same Space Grotesk / IBM Plex Sans / IBM Plex Mono type stack, the same dark-forest sidebar with a Kente-inspired striped accent bar, and the same three-tier status language (on-track / watch / stalled).

## Stack

Dependency-free HTML/CSS/JS — no build step, no `npm install` required to run it. Chart.js is loaded via CDN for the two charts. Data is generated client-side with a seeded `mulberry32` PRNG so every load produces the same, reproducible demo dataset.

```
eduspots-catalyst-tracker/
  index.html
  css/styles.css
  js/data.js          synthetic generator + status rules
  js/real-data.js      real Spot/RC facts
  js/charts.js         Chart.js wrappers
  js/app.js             rendering, nav, filters, modal
  assets/               logo + favicon
  README.md
  LICENSE
  .gitignore
```

## Roadmap (if this moved past prototype)

- Real data source instead of synthetic generation (EduSpots' actual Catalyst records / app data)
- RC-side note-taking on acknowledged follow-ups, not just a boolean
- Configurable thresholds per region if induction pacing genuinely differs
- Export views (CSV/PDF) for RC check-in meetings

---

## A note on the data

**Real and sourced:** the 49 Spot names and the 4 Regional Coordinators' names and regions, taken from [eduspots.org](https://eduspots.org/) and its [team page](https://eduspots.org/about-us/team/).

**Synthetic:** all ~136 Catalyst names, induction start dates, and step-progress histories. None of that data is public, so it's generated with a seeded random function for a realistic, reproducible demo — it does not represent real people or real induction records.
