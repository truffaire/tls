import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ── Disease registry (loaded at module init) ──────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cropRegistry: Record<string, Record<string, string[]>> = require("./cropDiseaseRegistry.json");

function getDiseaseList(crop: string, plantPart: string): string[] {
  const cropData = cropRegistry[crop] ?? cropRegistry[crop.toLowerCase()] ?? null;
  if (!cropData) return [];
  // Try exact case, then title-case, then lowercase
  const key =
    cropData[plantPart] ? plantPart :
    cropData[plantPart.charAt(0).toUpperCase() + plantPart.slice(1).toLowerCase()]
      ? plantPart.charAt(0).toUpperCase() + plantPart.slice(1).toLowerCase()
    : Object.keys(cropData).find(k => k.toLowerCase() === plantPart.toLowerCase())
    ?? null;
  if (!key) return [];
  return cropData[key] ?? [];
}

// ── ID generation ──────────────────────────────────────────────
function generateReportId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ARCORA-${year}-KA-${rand}`;
}

// ── Image helpers ──────────────────────────────────────────────
function getMediaType(base64: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (base64.startsWith("/9j/"))    return "image/jpeg";
  if (base64.startsWith("iVBORw")) return "image/png";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  if (base64.startsWith("UklGR"))  return "image/webp";
  return "image/jpeg";
}

function isWindowsPath(value: string) {
  return /^[a-zA-Z]:\\/.test(value);
}

function isSafeImageDataUrl(value: string) {
  return value.startsWith("data:image/");
}

// ── String utilities ───────────────────────────────────────────
function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asConfidenceInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && value >= 0 && value <= 100) return Math.round(value);
  if (typeof value === "string") { const n = parseInt(value, 10); if (!isNaN(n) && n >= 0 && n <= 100) return n; }
  return fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
  return items.length > 0 ? items : fallback;
}

// ── Robust JSON parser ─────────────────────────────────────────
function safeParseJSON(raw: string): Record<string, unknown> | null {
  try {
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch { /* continue */ }
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* continue */ }
  return null;
}

// ── Low-level Claude API call ──────────────────────────────────
async function callClaude(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs = 45000,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      console.error("Claude API error:", response.status, text.slice(0, 500));
      return null;
    }
    const data = JSON.parse(text);
    return (data.content?.[0]?.text as string) ?? null;
  } catch (e) {
    console.error("callClaude error:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Normalizers ────────────────────────────────────────────────
function normalizeTreatment(value: unknown) {
  if (!Array.isArray(value)) {
    return [{
      priority:  "Immediate",
      treatment: "Field inspection and agronomic correction",
      product:   "Apply crop-specific corrective inputs after confirming deficiency or disease pressure",
      method:    "Inspect the field within 24 hours and follow a crop-specific corrective spray or drench protocol",
    }];
  }
  const rows = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        priority:  asString(row.priority,  "Immediate"),
        treatment: asString(row.treatment, "Corrective treatment"),
        product:   asString(row.product,   "Follow crop-specific recommended input"),
        method:    asString(row.method,    "Apply using the label-recommended method and timing"),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
  return rows.length > 0 ? rows : [{
    priority:  "Immediate",
    treatment: "Field inspection and agronomic correction",
    product:   "Apply crop-specific corrective inputs after confirming deficiency or disease pressure",
    method:    "Inspect the field within 24 hours and follow a crop-specific corrective spray or drench protocol",
  }];
}

function normalizeSeasonalCalendar(value: unknown) {
  if (!Array.isArray(value)) {
    return [{ period: "Next 7 days", action: "Monitor crop response and repeat field scouting after the first corrective step" }];
  }
  const rows = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        period: asString(row.period, "Upcoming window"),
        action: asString(row.action, "Inspect and maintain the recommended crop management plan"),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
  return rows.length > 0 ? rows : [{ period: "Next 7 days", action: "Monitor crop response and repeat field scouting after the first corrective step" }];
}

function normalizeEconomicImpact(value: unknown) {
  if (!value || typeof value !== "object") {
    return { yieldLossPercent: "varies", description: "Act promptly to minimise yield loss." };
  }
  const e = value as Record<string, unknown>;
  return {
    yieldLossPercent: asString(e.yieldLossPercent, "varies").replace(/%/g, ""),
    description:      asString(e.description,      "Act promptly to minimise yield loss."),
  };
}

const LEAF_SEVERITIES = ["none", "mild", "moderate", "severe"] as const;
type LeafSeverity = typeof LEAF_SEVERITIES[number];

function safeLeafSeverity(value: unknown): LeafSeverity {
  const s = typeof value === "string" ? value.toLowerCase() : "none";
  return (LEAF_SEVERITIES as readonly string[]).includes(s) ? (s as LeafSeverity) : "none";
}

function normalizeTreatmentCost(value: unknown): { perAcre: string; currency: string; basis: string } | null {
  if (!value || typeof value !== "object") return null;
  const t = value as Record<string, unknown>;
  const perAcre = asOptionalString(t.perAcre);
  if (!perAcre) return null;
  return {
    perAcre,
    currency: asString(t.currency, "INR"),
    basis:    asString(t.basis,    "per acre"),
  };
}

function normalizeLeafAnnotation(value: unknown) {
  if (!value || typeof value !== "object") {
    return {
      tip: "none" as LeafSeverity, margins: "none" as LeafSeverity,
      upperSurface: "none" as LeafSeverity, lowerSurface: "none" as LeafSeverity,
      midrib: "none" as LeafSeverity, base: "none" as LeafSeverity,
      description: "No symptom location data available.",
    };
  }
  const a = value as Record<string, unknown>;
  return {
    tip:          safeLeafSeverity(a.tip),
    margins:      safeLeafSeverity(a.margins),
    upperSurface: safeLeafSeverity(a.upperSurface),
    lowerSurface: safeLeafSeverity(a.lowerSurface),
    midrib:       safeLeafSeverity(a.midrib),
    base:         safeLeafSeverity(a.base),
    description:  asString(a.description, "Symptoms observed on leaf tissue."),
  };
}

function normalizePlantPartDiagnoses(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((e) => e && typeof e === "object")
    .map((e) => {
      const row = e as Record<string, unknown>;
      return {
        part:         asString(row.part,     "Leaf"),
        primary:      asString(row.primary,  "Inconclusive"),
        severity:     asString(row.severity, "Moderate"),
        observations: asStringArray(row.observations, []),
        treatment:    normalizeTreatment(row.treatment),
      };
    });
}

function normalizeDiagnosis(rawDiagnosis: unknown, crop: string) {
  const diagnosis =
    rawDiagnosis && typeof rawDiagnosis === "object"
      ? (rawDiagnosis as Record<string, unknown>)
      : {};

  const severity   = asString(diagnosis.severity,   "Moderate");
  const confidence = asString(diagnosis.confidence, "Moderate");

  // Health score: clamp 5-100, default based on severity
  let healthScore = typeof diagnosis.healthScore === "number" ? Math.round(diagnosis.healthScore) : null;
  if (healthScore === null) {
    healthScore = severity === "Severe" ? 40 : severity === "Mild" ? 72 : 58;
  }
  healthScore = Math.max(5, Math.min(100, healthScore));

  return {
    primary:      asString(diagnosis.primary, "Further agronomic review required"),
    secondary:    asOptionalString(diagnosis.secondary),
    contributing: asOptionalString(diagnosis.contributing),
    severity:     ["Mild","Moderate","Severe"].includes(severity)   ? severity   : "Moderate",
    confidence:   ["High","Moderate","Low"].includes(confidence)    ? confidence : "Moderate",
    urgency:      asString(diagnosis.urgency, "Act within 7 days"),
    scientificName: asString(diagnosis.scientificName, crop),
    healthScore,
    primaryFinding:    asOptionalString(diagnosis.primaryFinding),
    economicImpact:    normalizeEconomicImpact(diagnosis.economicImpact),
    observations:      asStringArray(diagnosis.observations, ["Visible symptoms were present on the submitted sample."]),
    causes:            asStringArray(diagnosis.causes,       ["A crop-specific agronomic stress is affecting the submitted sample."]),
    treatment:         normalizeTreatment(diagnosis.treatment),
    prevention:        asStringArray(diagnosis.prevention, ["Continue routine field scouting and maintain balanced crop nutrition."]),
    labTests:          asStringArray(diagnosis.labTests,   ["Leaf tissue analysis", "Soil nutrient analysis"]),
    seasonalCalendar:  normalizeSeasonalCalendar(diagnosis.seasonalCalendar),
    leafAnnotation:    normalizeLeafAnnotation(diagnosis.leafAnnotation),
    treatmentCost:     normalizeTreatmentCost(diagnosis.treatmentCost),
    plantPartDiagnoses: normalizePlantPartDiagnoses(diagnosis.plantPartDiagnoses),
    primaryConfidence:      asConfidenceInt(diagnosis.primaryConfidence,      75),
    secondaryConfidence:    asConfidenceInt(diagnosis.secondaryConfidence,     18),
    contributingConfidence: asConfidenceInt(diagnosis.contributingConfidence,   7),
  };
}

function fallbackDiagnosis(crop: string, reason?: string) {
  const message = reason ? `Unable to analyze: ${reason}` : "Unable to analyze";
  return {
    disease: "Unknown", confidence: "Low", severity: "unknown",
    primary: "Unknown", secondary: null, contributing: null,
    urgency: "Review and retry with a clearer image",
    scientificName: crop,
    healthScore: 50,
    primaryFinding: "Retake the scan with a clearer, well-lit close-up image to get an accurate diagnosis.",
    economicImpact: { yieldLossPercent: "unknown", description: "Unable to assess economic impact without a successful diagnosis." },
    observations:    [`The ${crop} sample could not be fully analyzed.`],
    causes:          [message],
    treatment:       [{ priority: "Immediate", treatment: "Retake image", product: "No product recommendation available", method: "Upload a clear, well-lit close-up image and retry analysis" }],
    prevention:      ["Ensure the image is sharp, well lit, and fills most of the frame."],
    labTests:        ["Consult a local agronomist or lab for confirmation."],
    seasonalCalendar: [{ period: "Now", action: "Retake the scan with a clearer image before making treatment decisions." }],
    leafAnnotation:   { tip: "none", margins: "none", upperSurface: "none", lowerSurface: "none", midrib: "none", base: "none", description: "Unable to determine symptom location." },
    treatmentCost:    null,
    plantPartDiagnoses: [],
    primaryConfidence:      75,
    secondaryConfidence:    18,
    contributingConfidence:  7,
  };
}

function toStoredDiagnosis(
  rawDiagnosis: ReturnType<typeof normalizeDiagnosis> | ReturnType<typeof fallbackDiagnosis>,
  crop: string,
) {
  const normalized = normalizeDiagnosis(rawDiagnosis, crop);
  return {
    ...normalized,
    disease: "disease" in rawDiagnosis ? rawDiagnosis.disease : normalized.primary,
    severity:
      "severity" in rawDiagnosis &&
      ["unknown","Mild","Moderate","Severe"].includes(rawDiagnosis.severity as string)
        ? rawDiagnosis.severity
        : normalized.severity,
  };
}

// ─────────────────────────────────────────────────────────────
//  observePart — vision-only, adapts by plant part
// ─────────────────────────────────────────────────────────────
function buildPartObservationPrompt(crop: string, part: string): string {
  const partUpper = part.toUpperCase();

  const PART_TARGETS: Record<string, string> = {
    Leaf: `LESION MORPHOLOGY (if lesions are present):
- Shape of lesions (circular, angular, irregular, fusiform, linear, blotchy)
- Size range (pinpoint <2mm, small 2-5mm, medium 5-15mm, large >15mm)
- Edge character (sharply defined, diffuse/blurry, water-soaked, raised, sunken)
- Center color and texture (gray/white/tan/brown/black, dry-papery/wet-soft/cracked/perforated)
- Margin color and width (brown/yellow/dark/reddish, narrow/broad)

SURFACE STRUCTURES:
- Powdery coating (color: white/gray/black, or absent)
- Mycelial growth (fluffy/matted, or absent)
- Pustules (color if present: orange/black/brown/pink, or absent)
- Bacterial ooze or exudate (present/absent)
- Watersoaking or translucency (present/absent)
- Hard dark bodies or sclerotia (present/absent)

LESION DISTRIBUTION:
- Pattern (random scatter, vein-bounded, tip-inward, margin-inward, concentric rings, coalescing)
- Density (isolated 1-3, scattered 4-10, dense >10, coalescing)
- Leaf zone affected (tip, margins, interveinal, midrib, whole surface, base)

COLOR CHANGES:
- Yellowing/chlorosis (around lesions, general, or absent)
- Purpling or reddening (present/absent)
- Overall leaf color (healthy green, pale, dark, bronze)

STRUCTURAL CHANGES:
- Curling or distortion (present/absent)
- Holes or shot-holes (present/absent)
- Raised or blistered areas (present/absent)

IMPORTANT — for pale or low-contrast lesions:
Distinguish carefully between:
(a) DRY pale lesions — center appears bleached, papery, or chalky. Tissue feels dry. Edges are defined. This is NOT water-soaked.
(b) WET pale lesions — center appears translucent when held to light, greasy or glass-like texture, margins fade into healthy tissue. This IS water-soaked.
Do not describe a lesion as water-soaked unless translucency or greasiness is clearly visible.`,

    Stem: `CANKER AND BARK DAMAGE:
- Canker presence (sunken/raised, discolored bark area vs healthy)
- Size and shape of canker (circular, elongated, irregular)
- Bark texture at affected site (cracked, peeling, water-soaked, dry)
- Girdling extent (partial one side / complete around stem)

EXUDATE AND DISCHARGE:
- Gummy exudate (amber/dark, fresh/dried/crystallised)
- Resinous discharge (color, quantity)
- Bacterial ooze (slimy, watery, presence/absence)
- No exudate visible

DISCOLORATION:
- Pattern (one side only / all around / from wound site)
- Color of affected bark (brown/black/dark/orange/yellowed)
- Extent above and below canker zone

ENTRY WOUNDS:
- Insect boring holes visible (diameter, frass present/absent)
- Mechanical damage visible
- Pruning wound infection (present/absent)
- Clean stem with no visible entry point

VASCULAR / INTERNAL:
- If cross-section visible: vascular discoloration (brown streaking vs healthy white)
- Pith condition (hollow/discolored/normal)`,

    Fruit: `SURFACE SYMPTOMS:
- Lesion type (sunken spots / raised pustules / discolored patches / surface mold)
- Lesion size and color (brown/black/orange/white, mm range)
- Margin character (defined/diffuse/water-soaked/halo)
- Fungal sporulation visible (color: pink/gray/black/white, powdery/fluffy)
- Bacterial ooze from surface (present/absent, color)

STRUCTURAL DAMAGE:
- Cracking or splitting (radial/irregular/none)
- Mummification (shriveled/hard/none)
- Insect entry holes (present/absent, frass)
- Mechanical damage vs disease origin

INTERNAL INDICATORS (if visible):
- Rot visible at surface-interior interface (soft/dry/watery)
- Color change in flesh near surface
- Mycelial threads internal (visible/not visible)

STAGE AT DAMAGE:
- Fruit development stage (immature/mature/post-harvest)
- % of surface affected (estimate: <10%, 10-30%, >30%)
- Single spot vs multiple coalescing spots`,

    Flower: `PETAL CONDITION:
- Discoloration pattern (tip/base/whole petal, color: brown/black/white/purple)
- Necrosis extent (tip burn / whole petal / central disk only)
- Water-soaking (translucent soggy petals, present/absent)

ATTACHMENT AND DROP:
- Flowers staying attached or dropping prematurely
- Drop stage (bud / open flower / post-pollination)
- Pedicel condition (healthy/discolored/wilted)

FUNGAL / PATHOGEN STRUCTURES:
- Gray fuzzy mold on petals (Botrytis indicator)
- Powdery coating on petals
- Dark spots or acervuli on petals
- Bacterial ooze on flower tissue

INSECT PRESENCE:
- Visible thrips (tiny elongated insects in flowers)
- Feeding damage (silvering, distortion of petals)
- Pollen beetle or other insect damage

DEVELOPMENTAL ABNORMALITIES:
- Distorted or misshapen flowers
- Blasting (buds die before opening)
- Abnormal petal color from base`,

    Root: `COLOR AND APPEARANCE:
- Healthy root color (white/cream expected, actual color observed)
- Discoloration pattern (brown/black/dark, partial vs whole root)
- Extent of affected roots vs healthy roots visible

ROT TYPE:
- Soft rot (waterlogged, mushy, foul smell indicators)
- Dry rot (shriveled, firm, brown or black)
- Crown rot vs fine root rot
- Root tip dieback vs whole root involved

SURFACE STRUCTURES:
- Mycelial growth on root surface (white cottony / dark strands / rhizomorphs)
- Nematode galls or knots (spherical swellings, present/absent, count estimate)
- Lesions or necrotic patches on root surface

STRUCTURAL INTEGRITY:
- Root cortex slipping off central stele (indicates Pythium/Phytophthora)
- Root fragility (breaks easily / firm and intact)
- Branching roots affected vs main roots`,
  };

  const targets = PART_TARGETS[part] ?? PART_TARGETS["Leaf"];

  return `You are a precision agricultural pathology imaging system. Your only task is visual observation of the submitted ${partUpper} photograph(s).

Examine the image carefully. Describe ONLY what you can directly see. Do not name any disease. Do not provide any diagnosis. Do not suggest treatments. Do not infer causes.

OBSERVATION TARGETS FOR ${partUpper}:

${targets}

IMAGE QUALITY:
- Focus (sharp/slightly blurred/blurry)
- Lighting (well-lit/overexposed/underexposed)
- Coverage (full view / partial / close-up of affected area only)

Crop being examined: ${crop}
Plant part: ${partUpper}

Write your observations as a structured plain-text report. Be precise and factual. No diagnosis. No disease names. Only what you can see.`;
}

async function observePart(
  apiKey: string,
  imageB64s: string[],
  crop: string,
  part: string,
): Promise<string> {
  const systemPrompt = buildPartObservationPrompt(crop, part);
  const imageBlocks = imageB64s.map((b64) => ({
    type: "image",
    source: { type: "base64", media_type: getMediaType(b64), data: b64 },
  }));
  const textBlock = {
    type: "text",
    text: imageB64s.length > 1
      ? `Examine all ${imageB64s.length} ${part.toLowerCase()} photographs of this ${crop} crop. Describe only what you see. No diagnosis.`
      : `Examine this ${crop} ${part.toLowerCase()} photograph. Describe only what you see. No diagnosis.`,
  };

  const raw = await callClaude(apiKey, {
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: "user", content: [...imageBlocks, textBlock] }],
  }, 40000);

  if (!raw) {
    console.error(`observePart [${part}]: callClaude returned null`);
    throw new Error(`Observation step failed for ${part}.`);
  }
  return raw;
}

// ─────────────────────────────────────────────────────────────
//  diagnoseFromObservations — text-only, full protocol
// ─────────────────────────────────────────────────────────────
async function diagnoseFromObservations(
  apiKey: string,
  observationsByPart: Array<{ part: string; text: string }>,
  crop: string,
  location: string | null,
  soilType: string | null,
  growthStage: string | null,
  symptomDuration: string | null,
  spreadExtent: string | null,
  recentActivity: string[],
  weatherData: { temp: number; humidity: number; description: string; rainfall: number } | null,
  weatherHistory: { avgTemp: number; totalRainfall: number } | null,
  districtHistory: Array<{ disease: string; count: number }>,
): Promise<Record<string, unknown> | null> {

  // Build the observations block
  const observationsBlock = observationsByPart
    .map(({ part, text }) => `${part.toUpperCase()} OBSERVATIONS:\n${text}`)
    .join("\n\n─────────────────────────────────────────\n\n");

  // Build permitted disease list for submitted parts
  const submittedParts = [...new Set(observationsByPart.map((o) => o.part))];
  const diseaseLines = submittedParts.map((part) => {
    const diseases = getDiseaseList(crop, part);
    return diseases.length > 0
      ? `${part.toUpperCase()}: ${diseases.join(" | ")}`
      : `${part.toUpperCase()}: [No registry data — use general agronomic knowledge for ${crop}]`;
  });
  const permittedDiseasesBlock = diseaseLines.length > 0
    ? `PERMITTED DIAGNOSES FOR ${crop}:
You MUST select primary from this list only. Output exactly as written. No variations.
If no match is found: output "Unknown".

${diseaseLines.join("\n")}`
    : "";

  // Build district history block
  const districtBlock = districtHistory.length > 0
    ? `District disease activity (last 30 days): ${districtHistory.map((d) => `${d.disease} (${d.count} reports)`).join(", ")}`
    : "";

  // Build weather block
  const weatherBlock = [
    weatherData
      ? `Current weather: ${weatherData.temp}°C, humidity ${weatherData.humidity}%, ${weatherData.description}, rainfall ${weatherData.rainfall}mm last hour`
      : "",
    weatherHistory
      ? `Weather 7-day avg: ${weatherHistory.avgTemp}°C, total rainfall ${weatherHistory.totalRainfall}mm`
      : "",
  ].filter(Boolean).join("\n");

  const systemPrompt = `You are the Truffaire Labs Diagnostic Engine — a precision agricultural pathology system. You do not guess. You do not default to common answers. You diagnose by evidence.

You have received structured visual observations from one or more plant part image analysis steps. Your job is to produce the most accurate, evidence-grounded unified diagnosis from those observations and agronomic context.

${permittedDiseasesBlock}

═══════════════════════════════════════════════════════════════
SECTION 1 — VISUAL OBSERVATIONS (ALREADY COMPLETE)
═══════════════════════════════════════════════════════════════

The following observations were extracted directly from the submitted photographs. Treat these as your Section 1 findings. Do not re-derive or contradict them.

${observationsBlock}

═══════════════════════════════════════════════════════════════
SECTION 2 — CONTEXTUAL RISK ASSESSMENT
═══════════════════════════════════════════════════════════════

Use the provided context to set disease probability weights BEFORE running differential diagnosis. Context does not diagnose — it modifies probability of candidate diseases.

AGRONOMIC CONTEXT:
- Crop: ${crop}
${location       ? `- Farm Location: ${location}, India` : ""}
${soilType       ? `- Soil Type: ${soilType}` : ""}
${growthStage    ? `- Growth Stage: ${growthStage}` : ""}
${symptomDuration ? `- Symptoms noticed: ${symptomDuration}` : ""}
${spreadExtent   ? `- Plants affected: ${spreadExtent}` : ""}
${recentActivity.length > 0 ? `- Recent farm activity: ${recentActivity.join(", ")}` : ""}
${weatherBlock ? weatherBlock : ""}
${districtBlock ? districtBlock : ""}

GROWTH STAGE LOGIC:
- Seedling: damping-off, root rots, bacterial wilts, nutrient toxicity elevated
- Vegetative: leaf diseases, bacterial blights, aphid/mite vectors elevated
- Flowering: Botrytis, flower drop diseases, thrips elevated
- Fruiting: fruit rots, anthracnose, bacterial spot, physiological disorders elevated
- Harvest Ready: post-harvest pathogens, secondary rots elevated

SPREAD LOGIC:
- 1-2 plants: isolated — abiotic, insect entry points, mechanical, or early infection
- Part of field: moderate spread — soilborne or splash-dispersed pathogen
- Spreading fast: rapid epidemic — bacterial, downy mildew, or systemic viral likely

SYMPTOM DURATION LOGIC:
- Just noticed: early stage — initial infection or acute stress
- ~1 week: active progression — treatment window still open
- 2+ weeks: advanced infection — secondary spread likely, severe damage possible

WEATHER LOGIC (apply these rules):
- Humidity > 80% + Temp 20-30C → Fungal pressure HIGH (Cercospora, Alternaria, Colletotrichum, Powdery mildew elevated)
- Humidity > 85% + Temp 25-35C + recent rainfall → Downy mildew, Bacterial diseases, Phytophthora elevated
- Humidity < 60% + Temp > 35C → Powdery mildew, Spider mite elevated. Fungal leaf spots reduced.
- Rainfall in last 24-48h → Splash-dispersed pathogens elevated (Colletotrichum, Cercospora, Bacterial)
- Low temp (<15C) → Botrytis, Powdery mildew elevated

SOIL LOGIC:
- Red/Laterite → Low pH, iron-rich. Micronutrient deficiency (Zinc, Boron) more likely. Fusarium elevated in poorly drained areas.
- Black/Vertisol → High water retention, alkaline. Pythium, Phytophthora, Bacterial diseases elevated in wet season.
- Sandy/Loamy → Well-drained. Nematode damage more likely. Drought stress patterns possible.
- Clay → Waterlogging risk. Root rot pathogens elevated.

SEASONAL LOGIC (Karnataka crop calendar):
- March-May (Pre-monsoon, dry, hot) → Heat stress, Powdery mildew, Thrips, Spider mites elevated
- June-September (Monsoon) → All fungal diseases, Bacterial diseases, Downy mildew significantly elevated
- October-November (Post-monsoon) → Residual fungal, Anthracnose, Fruit rots elevated
- December-February (Winter, dry) → Powdery mildew, viral diseases, nutrient deficiencies more common

═══════════════════════════════════════════════════════════════
SECTION 3 — DIFFERENTIAL DIAGNOSIS PROTOCOL
═══════════════════════════════════════════════════════════════

STEP 3A — DETERMINE DISEASE CATEGORY FIRST

Use this key to eliminate categories before naming specific diseases. A category is ELIMINATED if its required markers are absent from the Section 1 observations.

FUNGAL (NECROTROPHIC) — Required markers:
+ Defined lesion margins (sharp or concentric rings)
+ Dry center texture (papery, cracked, or perforated)
+ Sporulation structures often visible
+ Lesion color typically tan/brown/gray/black
- ABSENT: bacterial ooze, water-soaking in fresh lesions, translucency, vein-bounded pattern

FUNGAL (BIOTROPHIC) — Required markers:
+ Powdery white/gray coating (Powdery mildew)
+ OR yellow upper surface + gray/purple fuzz on lower (Downy mildew)
+ OR orange/brown/yellow pustules (Rust)
- ABSENT: dry necrotic spots as primary symptom

BACTERIAL — Required markers:
+ Water-soaked lesions (translucent when held to light)
+ Angular lesions bounded by veins
+ Yellow halo around lesions common
+ Bacterial ooze in humid conditions
- ABSENT: dry papery centers, sporulation, powdery coatings, concentric rings

VIRAL — Required markers:
+ Mosaic pattern (irregular green/yellow patches)
+ OR leaf distortion, curling, stunting
+ OR ring spots
+ Systemic — affects whole plant
- ABSENT: discrete necrotic lesions, sporulation, ooze

ABIOTIC / NUTRITIONAL — Required markers:
+ Interveinal chlorosis
+ OR tip and margin burn without lesion structure
+ OR uniform bleaching/bronzing
+ Symmetrical pattern across leaf
- ABSENT: discrete lesions with defined margins, sporulation

PEST DAMAGE — Required markers:
+ Shot-holes (clean circular holes)
+ OR stippling (tiny pale dots — mites)
+ OR skeletonized areas
+ OR distortion without chlorosis
- ABSENT: lesions with defined color zones, sporulation

STEP 3B — MATCH SPECIFIC DISEASE WITHIN CATEGORY

SCORING RULES:
- Each observation that matches a disease's known symptom profile: +2 points
- Each observation that directly contradicts a disease's known profile: -3 points
- Context risk elevation: +1 point per risk factor
- Context risk reduction: -1 point
- Surface structures pathognomonic for this disease: +4 points

The disease with the highest score = Primary diagnosis
Second highest = Secondary (only if score > 3)
Contributing factor = environmental/stress factor, not a disease

POMEGRANATE-SPECIFIC DIFFERENTIAL KEY:
When crop is pomegranate, apply this key within Step 3B:

Bacterial Blight (Xanthomonas axonopodis pv. punicae): Water-soaked dark-brown angular lesions + yellow halo + ooze in humid conditions + dark streaks on young shoots. High risk: Monsoon, high humidity, overhead irrigation.

Alternaria Leaf Spot (Alternaria alternata): Circular-irregular brown spots 2-8mm + concentric rings + dark sooty sporulation + coalescence. High risk: Humid post-monsoon, 22-28°C.

Cercospora Leaf Spot (Cercospora punicae): Small circular spots 1-4mm + distinct yellow halo + no concentric rings + gray-white powdery lower surface sporulation. High risk: Monsoon, humid.

Anthracnose (Colletotrichum gloeosporioides): Irregular brown-black lesions at tip/margins + pink-salmon spore masses in moist conditions + water-soaked then dry necrosis. High risk: Post-monsoon.

Powdery Mildew (Podosphaera xanthii): White powdery coating + green turgid leaves + young leaves primarily. High risk: March-May dry season.

Phytophthora Blight: Dark water-soaked patches at margins + rapid spread + white cottony mycelium lower surface. High risk: Waterlogged soils, monsoon.

Leaf Scorch / Abiotic Tip Burn: Brown tip/margin burn + sharp boundary + no sporulation + symmetrical. Associated with heat stress, salt injury, drought.

STEP 3C — CONFIDENCE CALIBRATION

High confidence: Primary score significantly higher than all others AND key morphological markers clearly visible
Moderate confidence: Primary score moderately higher OR some markers ambiguous
Low confidence: Two or more diseases score similarly OR critical diagnostic markers not present

CRITICAL RULE: If bacterial markers (ooze, angular, water-soaked) are NOT in observations — bacterial cannot be primary.
CRITICAL RULE: If fungal sporulation (powder, pustules, acervuli, mycelium) IS in observations — fungal must be primary.
CRITICAL RULE: Never output High confidence when markers are ambiguous.

═══════════════════════════════════════════════════════════════
SECTION 4 — OBSERVATION INTEGRITY RULES
═══════════════════════════════════════════════════════════════

RULE 1 — OUTPUT observations[] MUST REFLECT SECTION 1 ONLY. Do not fabricate.
RULE 2 — SECONDARY requires distinct evidence or context-elevated co-infection.
RULE 3 — primaryConfidence + secondaryConfidence + contributingConfidence = 100.
RULE 4 — ECONOMIC IMPACT must be disease-specific and crop-specific.
RULE 5 — If multiple plant parts submitted, produce plantPartDiagnoses[] with one entry per part.

═══════════════════════════════════════════════════════════════
SECTION 5 — TREATMENT PROTOCOL RULES
═══════════════════════════════════════════════════════════════

Bacterial → copper-based bactericide or streptomycin-based
Fungal necrotrophic → Mancozeb, Chlorothalonil (contact) or Propiconazole, Tebuconazole, Azoxystrobin (systemic)
Powdery mildew → sulfur-based or DMI fungicides. NOT mancozeb.
Rust → triazole fungicides, NOT copper
Viral → no curative treatment, vector control and removal only
Nutritional → soil amendment, foliar micronutrient correction

RULE: NEVER PRESCRIBE COPPER FOR FUNGAL PRIMARY UNLESS SECONDARY BACTERIAL IS CONFIRMED.
RULE: Specify product name, active ingredient, concentration, dose per liter, timing, repeat interval.
RULE: treatmentCost perAcre must reflect realistic Karnataka market price.

═══════════════════════════════════════════════════════════════
SECTION 6 — HEALTH SCORE AND PRIMARY FINDING
═══════════════════════════════════════════════════════════════

healthScore: integer 0-100.
100 = fully healthy. Deduct based on severity:
- Severe = -25 points per affected part
- Moderate = -15 points per affected part
- Mild = -8 points per affected part
Multiple parts compound. Minimum score: 5.

primaryFinding: One plain-language sentence. The single most important action the farmer must take today. No jargon. No Latin names. Specific and direct.
Example: "Spray [product] within 48 hours to stop the spread to the rest of the crop."
NOT: "Consider appropriate fungicide application based on pathogen identification."

═══════════════════════════════════════════════════════════════
SECTION 7 — FINAL OUTPUT
═══════════════════════════════════════════════════════════════

All field values MUST be in ENGLISH only. Never mention AI, Claude, or any technology provider.

Output ONLY the following JSON. No preamble. No explanation. No markdown. Raw JSON only.

{
  "primary": "specific disease name",
  "secondary": "disease name or null",
  "contributing": "environmental or stress factor or null",
  "severity": "Mild|Moderate|Severe",
  "confidence": "High|Moderate|Low",
  "primaryConfidence": <integer>,
  "secondaryConfidence": <integer or null>,
  "contributingConfidence": <integer or null>,
  "urgency": "specific actionable timeframe",
  "scientificName": "Latin binomial of crop species",
  "healthScore": <integer 5-100>,
  "primaryFinding": "one plain-language sentence — most important action today",
  "economicImpact": {
    "yieldLossPercent": "crop-specific and disease-specific range",
    "description": "one sentence on financial consequence if untreated"
  },
  "treatmentCost": {
    "perAcre": "realistic INR range",
    "currency": "INR",
    "basis": "one-time application|per spray cycle"
  },
  "observations": ["from Section 1 only", "..."],
  "causes": ["primary pathogen with scientific name", "predisposing factor", "agronomic contributor"],
  "treatment": [
    {
      "priority": "Immediate|Short-term|Medium-term",
      "treatment": "treatment name",
      "product": "specific product with active ingredient and concentration",
      "method": "exact application instructions with dose, timing, coverage"
    }
  ],
  "prevention": ["prevention measure 1", "prevention measure 2", "prevention measure 3"],
  "labTests": ["specific test 1", "specific test 2"],
  "seasonalCalendar": [
    { "period": "season name", "action": "specific action for this crop and disease" }
  ],
  "leafAnnotation": {
    "tip": "none|mild|moderate|severe",
    "margins": "none|mild|moderate|severe",
    "upperSurface": "none|mild|moderate|severe",
    "lowerSurface": "none|mild|moderate|severe",
    "midrib": "none|mild|moderate|severe",
    "base": "none|mild|moderate|severe",
    "description": "one sentence describing symptom location from Section 1"
  },
  "plantPartDiagnoses": [
    {
      "part": "Leaf|Stem|Fruit|Flower|Root",
      "primary": "disease or condition specific to this part",
      "severity": "Mild|Moderate|Severe",
      "observations": ["key observation 1", "key observation 2"],
      "treatment": [
        {
          "priority": "Immediate|Short-term",
          "treatment": "treatment name",
          "product": "product with active ingredient",
          "method": "application instructions"
        }
      ]
    }
  ]
}`;

  const raw = await callClaude(apiKey, {
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: "user", content: "Complete the diagnosis using the Section 1 observations. Return JSON only." }],
  }, 70000);

  if (!raw) {
    console.error("diagnoseFromObservations: callClaude returned null — API error or timeout");
    throw new Error("Diagnosis step failed.");
  }
  console.log("Diagnosis response:", raw.slice(0, 800));
  const parsed = safeParseJSON(raw);
  if (!parsed) {
    console.error("diagnoseFromObservations: JSON parse failed. Raw:", raw.slice(0, 400));
    throw new Error("Diagnosis step failed.");
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────
//  Weather helpers
// ─────────────────────────────────────────────────────────────
type WeatherCurrent = { temp: number; humidity: number; description: string; rainfall: number };
type WeatherHistory = { avgTemp: number; totalRainfall: number };

async function fetchCurrentWeather(
  location: string,
  weatherKey: string,
): Promise<WeatherCurrent | null> {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)},IN&appid=${weatherKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const wd = await res.json();
    return {
      temp:        wd.main?.temp           ?? 0,
      humidity:    wd.main?.humidity       ?? 0,
      description: wd.weather?.[0]?.description ?? "unknown",
      rainfall:    wd.rain?.["1h"]         ?? 0,
    };
  } catch { return null; }
}

async function fetchWeatherHistory(
  location: string,
  weatherKey: string,
): Promise<WeatherHistory | null> {
  // Geocode city → lat/lon, then fetch 7-day forecast as proxy
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)},IN&limit=1&appid=${weatherKey}`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) return null;
    const { lat, lon } = geoData[0];

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherKey}&units=metric&cnt=56`; // 7 days * 8 intervals
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) return null;
    const forecastData = await forecastRes.json();
    const list: Array<{ main: { temp: number }; rain?: { "3h"?: number } }> =
      forecastData.list ?? [];
    if (list.length === 0) return null;

    const avgTemp = list.reduce((sum, item) => sum + (item.main?.temp ?? 0), 0) / list.length;
    const totalRainfall = list.reduce((sum, item) => sum + (item.rain?.["3h"] ?? 0), 0);
    return {
      avgTemp:       Math.round(avgTemp * 10) / 10,
      totalRainfall: Math.round(totalRainfall * 10) / 10,
    };
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────
//  Main action
// ─────────────────────────────────────────────────────────────
export const runDiagnosis = action({
  args: {
    clerkId:         v.string(),
    crop:            v.string(),
    location:        v.optional(v.string()),
    soilType:        v.optional(v.string()),
    imageUrl:        v.string(),
    imageB64s:       v.array(v.string()),
    // new in Priority 3 — parallel arrays, imageB64s[i] ↔ plantParts[i]
    plantParts:      v.optional(v.array(v.string())),
    growthStage:     v.optional(v.string()),
    symptomDuration: v.optional(v.string()),
    spreadExtent:    v.optional(v.string()),
    recentActivity:  v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    { clerkId, crop, location, soilType, imageUrl, imageB64s,
      plantParts, growthStage, symptomDuration, spreadExtent, recentActivity }
  ): Promise<{ reportId: string; diagnosis: unknown }> => {
    let creditDeducted = false;
    const reportId = generateReportId();

    try {
      if (isWindowsPath(imageUrl) || imageUrl.startsWith("file:")) {
        throw new Error("Invalid image input. Local file paths are not supported.");
      }
      if (imageUrl && !isSafeImageDataUrl(imageUrl)) {
        throw new Error("Invalid image input. Expected an uploaded image data URL.");
      }
      if (!imageB64s || imageB64s.length === 0) {
        throw new Error("Missing image data for diagnosis.");
      }

      await ctx.runMutation(api.users.deductCredit, { clerkId });
      creditDeducted = true;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

      // ── Group images by plant part ─────────────────────────────
      // plantParts[i] corresponds to imageB64s[i]; default = "Leaf"
      const parts = imageB64s.map((_, i) =>
        (plantParts?.[i] ?? "Leaf")
      );

      const partGroups: Record<string, string[]> = {};
      for (let i = 0; i < imageB64s.length; i++) {
        const part = parts[i];
        if (!partGroups[part]) partGroups[part] = [];
        partGroups[part].push(imageB64s[i]);
      }
      const uniqueParts = Object.keys(partGroups);
      console.log(`Parts submitted: ${uniqueParts.join(", ")} (${imageB64s.length} images total)`);

      // ── Fetch weather (parallel with observations) ─────────────
      const weatherKey = process.env.OPENWEATHER_API_KEY;
      const weatherPromises: [
        Promise<WeatherCurrent | null>,
        Promise<WeatherHistory | null>,
      ] = location && weatherKey
        ? [
            fetchCurrentWeather(location, weatherKey),
            fetchWeatherHistory(location, weatherKey),
          ]
        : [
            Promise.resolve(null),
            Promise.resolve(null),
          ];

      // ── Fetch district disease history ─────────────────────────
      const districtHistoryPromise = location
        ? ctx.runQuery(api.diagnose.getDistrictHistory, { district: location.split(",")[0].trim() })
        : Promise.resolve([]);

      // ── STEP 1: Parallel visual observation per part ───────────
      const observationPromises = uniqueParts.map((part) =>
        observePart(apiKey, partGroups[part], crop, part)
          .then((text) => ({ part, text }))
          .catch((err) => {
            console.error(`observePart [${part}] failed:`, err);
            throw new Error(`Observation step failed for ${part}.`);
          })
      );

      // Run observations, weather, and district history all in parallel
      const [observationResults, weatherCurrent, weatherHistory, districtHistory] =
        await Promise.all([
          Promise.all(observationPromises),
          weatherPromises[0],
          weatherPromises[1],
          districtHistoryPromise,
        ]);

      console.log(`Observations complete: ${observationResults.map((o) => o.part).join(", ")}`);
      if (weatherCurrent) console.log("Weather:", weatherCurrent);
      if (districtHistory.length > 0) console.log("District history:", districtHistory);

      // ── STEP 2: Single unified diagnosis ──────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let diagnosis: any = toStoredDiagnosis(
        fallbackDiagnosis(crop, "analysis unavailable"),
        crop,
      );

      try {
        const parsedDiag = await diagnoseFromObservations(
          apiKey,
          observationResults,
          crop,
          location ?? null,
          soilType ?? null,
          growthStage ?? null,
          symptomDuration ?? null,
          spreadExtent ?? null,
          recentActivity ?? [],
          weatherCurrent,
          weatherHistory,
          districtHistory as Array<{ disease: string; count: number }>,
        );

        if (parsedDiag) {
          const base = toStoredDiagnosis(normalizeDiagnosis(parsedDiag, crop), crop);
          diagnosis = weatherCurrent ? { ...base, weatherData: weatherCurrent } : base;
        } else {
          console.error("Diagnosis: returned null — using fallback");
          const fb = toStoredDiagnosis(fallbackDiagnosis(crop, "JSON parse failed"), crop);
          diagnosis = weatherCurrent ? { ...fb, weatherData: weatherCurrent } : fb;
        }
      } catch (err) {
        console.error("Diagnosis engine error:", err);
        const reason = err instanceof Error ? err.message : "Unknown failure";
        const fb = toStoredDiagnosis(fallbackDiagnosis(crop, reason), crop);
        diagnosis = weatherCurrent ? { ...fb, weatherData: weatherCurrent } : fb;
      }

      await ctx.runMutation(internal.diagnose.saveReport, {
        reportId,
        userId: clerkId,
        crop,
        ...(location        ? { location }        : {}),
        ...(soilType        ? { soilType }         : {}),
        ...(uniqueParts.length > 0 ? { plantParts: uniqueParts } : {}),
        ...(growthStage     ? { growthStage }      : {}),
        ...(symptomDuration ? { symptomDuration }  : {}),
        ...(spreadExtent    ? { spreadExtent }     : {}),
        ...(recentActivity && recentActivity.length > 0 ? { recentActivity } : {}),
        imageUrl,
        diagnosis,
      });

      return { reportId, diagnosis };

    } catch (error) {
      console.error("runDiagnosis outer error:", error);
      if (creditDeducted) {
        try {
          await ctx.runMutation(api.users.refundCredit, { clerkId });
        } catch (refundErr) {
          console.error("Refund error:", refundErr);
        }
      }

      const diagnosis = toStoredDiagnosis(
        fallbackDiagnosis(crop, error instanceof Error ? error.message : "Unknown failure"),
        crop,
      );
      try {
        await ctx.runMutation(internal.diagnose.saveReport, {
          reportId, userId: clerkId, crop, imageUrl, diagnosis,
        });
        return { reportId, diagnosis };
      } catch (saveError) {
        console.error("Persistence error:", saveError);
        return { reportId, diagnosis };
      }
    }
  },
});
