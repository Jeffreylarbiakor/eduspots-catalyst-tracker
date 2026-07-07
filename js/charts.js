/**
 * charts.js — Chart.js wrapper functions for the Catalyst Tracker.
 * Uses Chart.js via CDN (see index.html), same pattern as Project #1.
 */

let stepFunnelChart = null;
let rcClusterChart = null;

const CHART_COLORS = {
  forest: "#123524",
  forestLight: "#1F5C3D",
  gold: "#D9A62E",
  goldSoft: "#F0D89B",
  sky: "#3E7CB1",
  clay: "#B54834",
  muted: "#6B6558",
  paper: "#F6F2E9",
};

function renderStepFunnelChart(catalysts) {
  const canvas = document.getElementById("stepFunnelChart");
  if (!canvas) return;

  const counts = INDUCTION_STEPS.map((step, i) =>
    catalysts.filter((c) => c.status.level !== "graduated" && c.currentStepIndex === i).length
  );
  const graduatedCount = catalysts.filter((c) => c.status.level === "graduated").length;

  const labels = [...INDUCTION_STEPS.map((s) => s.label), "Graduated"];
  const data = [...counts, graduatedCount];

  if (stepFunnelChart) stepFunnelChart.destroy();
  stepFunnelChart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Catalysts",
          data,
          backgroundColor: [
            CHART_COLORS.forestLight,
            CHART_COLORS.forestLight,
            CHART_COLORS.forestLight,
            CHART_COLORS.forestLight,
            CHART_COLORS.forestLight,
            CHART_COLORS.forestLight,
            CHART_COLORS.gold,
          ],
          borderRadius: 4,
          maxBarThickness: 44,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(26,26,22,0.06)" } },
        y: { grid: { display: false } },
      },
    },
  });
}

function renderRcClusterChart(catalysts) {
  const canvas = document.getElementById("rcClusterChart");
  if (!canvas) return;

  const labels = REAL_REGIONAL_COORDINATORS.map((rc) => rc.name.split(" ")[0]);
  const data = REAL_REGIONAL_COORDINATORS.map(
    (rc) => catalysts.filter((c) => c.rcId === rc.id).length
  );

  if (rcClusterChart) rcClusterChart.destroy();
  rcClusterChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            CHART_COLORS.forestLight,
            CHART_COLORS.gold,
            CHART_COLORS.sky,
            CHART_COLORS.clay,
          ],
          borderColor: CHART_COLORS.paper,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { family: "IBM Plex Sans" } } },
      },
      cutout: "62%",
    },
  });
}
