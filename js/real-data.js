/**
 * real-data.js
 * ---------------------------------------------------------------------------
 * REAL, sourced facts only. No synthetic data lives in this file.
 *
 * Regional Coordinator names & regions: https://eduspots.org/about-us/team/
 * Spot names: https://eduspots.org/ (49 individually named community Spots)
 *
 * Everything else in this application (Catalyst names, induction dates,
 * step-progress history) is synthetically generated — see js/data.js — because
 * that information is not public. See README.md for the full data-honesty note.
 * ---------------------------------------------------------------------------
 */

const REAL_REGIONAL_COORDINATORS = [
  { id: "rc-tetteh",   name: "Cynthia Mawuena Tetteh", region: "Volta Region" },
  { id: "rc-akunlibe", name: "Getrude Akunlibe",        region: "Northern Region" },
  { id: "rc-suleiman", name: "Abdul Wadud Suleiman",    region: "Central/Western Regions" },
  { id: "rc-iddrisu",  name: "Abdul-Malik Iddrisu",     region: "New Spots" },
]; // source: https://eduspots.org/about-us/team/

const REAL_SPOT_NAMES = [
  "Aboabo No.4", "Abofour", "Abutia", "Agbledomi", "Ahenkro", "Akumadan",
  "Ameyaw", "Asemasa", "Atanve", "Banda Kabrono", "Bimbilla", "Bono Manso",
  "Bosomadwe", "Dadwen", "Dodome Awuiasu", "Donkorkrom", "Dulugu",
  "Ejisu-Besease", "Ejura", "Ekawso", "Ekumfi", "Elmina", "Funkoe",
  "Gambibgo", "Gomoa-Manso", "Ho-Kpenoe", "Joska Kenya", "Kalpohin",
  "Katanga-Zuarungu", "Kato Berekum", "Kejabil", "Kotokoli Zongo",
  "Kumbungu Zamigu", "Metsrikasa", "Mpatano", "New Ebu", "Nkonya", "Piisi",
  "Posmonu", "Sakasaka", "Sanzule-Krisan", "Savelugu", "Sefwi Asanteman",
  "Soko", "Takuve", "Teshie", "Wodome", "Yamfo", "Zangbalun",
]; // source: https://eduspots.org/ — 49 individually named Spots

// The 6-step induction pathway (part of EduSpots' "Ignite" phase).
const INDUCTION_STEPS = [
  { key: "community",   label: "Community engagement" },
  { key: "teambuilding", label: "Team building" },
  { key: "safeguarding", label: "Safeguarding (Keeping Spots Safe)" },
  { key: "systems",     label: "Systems development (App/data training)" },
  { key: "digital",     label: "Digital skills" },
  { key: "pedagogical", label: "Pedagogical training" },
];
