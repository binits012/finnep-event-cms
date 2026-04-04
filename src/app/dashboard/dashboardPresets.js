/**
 * Command-center presets: control default API include= and which widgets show first.
 * Full payload is still valid for all presets; include trims bandwidth when set.
 */

export const PRESET_REVENUE = "revenue";
export const PRESET_OPS = "ops";
export const PRESET_MINIMAL = "minimal";

export const PRESET_STORAGE_KEY = "dashboardPreset";

const PRESETS = {
  [PRESET_REVENUE]: {
    id: PRESET_REVENUE,
    label: "Revenue",
    subtitle: "Money, paid demand, and conversion signals first",
    /** Omit include to fetch full summary */
    include: undefined,
    pulsePrimary: "revenue",
    widgetOrder: [
      "brief",
      "pulse",
      "kpis",
      "topEvents",
      "attention",
      "paymentMix",
      "admissions",
      "upcoming",
    ],
  },
  [PRESET_OPS]: {
    id: PRESET_OPS,
    label: "Ops health",
    subtitle: "Pipeline, scans, and data quality",
    include:
      "exportMeta,brief,pulse,kpis,admissions,velocityVsBaseline,attention,dataQuality,upcoming,insights,paymentMix,revenue,topEvents",
    pulsePrimary: "tickets",
    widgetOrder: [
      "brief",
      "pulse",
      "kpis",
      "attention",
      "dataQuality",
      "admissions",
      "velocityVsBaseline",
      "upcoming",
      "topEvents",
      "paymentMix",
    ],
  },
  [PRESET_MINIMAL]: {
    id: PRESET_MINIMAL,
    label: "Minimal",
    subtitle: "Brief, core KPIs, and attention only",
    include: "exportMeta,brief,kpis,attention,insights,revenue",
    pulsePrimary: "tickets",
    widgetOrder: ["brief", "kpis", "attention"],
  },
};

export function getPresetDefinition(id) {
  return PRESETS[id] || PRESETS[PRESET_REVENUE];
}

export function listPresets() {
  return Object.values(PRESETS);
}

export function loadStoredPreset() {
  if (typeof window === "undefined") return PRESET_REVENUE;
  const v = localStorage.getItem(PRESET_STORAGE_KEY);
  if (v && PRESETS[v]) return v;
  return PRESET_REVENUE;
}

export function savePreset(id) {
  if (typeof window === "undefined") return;
  if (PRESETS[id]) localStorage.setItem(PRESET_STORAGE_KEY, id);
}

const DISMISSED_KEY = "dashboardDismissedAttention";

export function loadDismissedAttentionIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveDismissedAttentionIds(ids) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}
