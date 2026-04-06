import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ── ID generation ──────────────────────────────────────────────
function generateReportId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TLS-${year}-KA-${rand}`;
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

// ── Robust JSON parser — never throws ─────────────────────────
function safeParseJSON(raw: string): Record<string, unknown> | null {
  // Attempt 1: strip markdown fences and parse
  try {
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch { /* continue */ }

  // Attempt 2: extract the outermost {...} block and parse
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* continue */ }

  // Give up — caller will use fallback diagnosis
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
      priority: "Immediate",
      treatment: "Field inspection and agronomic correction",
      product: "Apply crop-specific corrective inputs after confirming deficiency or disease pressure",
      method: "Inspect the field within 24 hours and follow a crop-specific corrective spray or drench protocol",
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
    priority: "Immediate",
    treatment: "Field inspection and agronomic correction",
    product: "Apply crop-specific corrective inputs after confirming deficiency or disease pressure",
    method: "Inspect the field within 24 hours and follow a crop-specific corrective spray or drench protocol",
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

function normalizeDiagnosis(rawDiagnosis: unknown, crop: string) {
  const diagnosis =
    rawDiagnosis && typeof rawDiagnosis === "object"
      ? (rawDiagnosis as Record<string, unknown>)
      : {};

  const severity   = asString(diagnosis.severity,   "Moderate");
  const confidence = asString(diagnosis.confidence, "Moderate");

  return {
    primary:      asString(diagnosis.primary, "Further agronomic review required"),
    secondary:    asOptionalString(diagnosis.secondary),
    contributing: asOptionalString(diagnosis.contributing),
    severity:     ["Mild","Moderate","Severe"].includes(severity)   ? severity   : "Moderate",
    confidence:   ["High","Moderate","Low"].includes(confidence)    ? confidence : "Moderate",
    urgency:      asString(diagnosis.urgency, "Act within 7 days"),
    scientificName: asString(diagnosis.scientificName, crop),
    economicImpact:  normalizeEconomicImpact(diagnosis.economicImpact),
    observations:    asStringArray(diagnosis.observations, ["Visible symptoms were present on the submitted leaf sample."]),
    causes:          asStringArray(diagnosis.causes,       ["A crop-specific agronomic stress is affecting the submitted sample."]),
    treatment:       normalizeTreatment(diagnosis.treatment),
    prevention:      asStringArray(diagnosis.prevention, ["Continue routine field scouting and maintain balanced crop nutrition."]),
    labTests:        asStringArray(diagnosis.labTests,   ["Leaf tissue analysis", "Soil nutrient analysis"]),
    seasonalCalendar: normalizeSeasonalCalendar(diagnosis.seasonalCalendar),
    leafAnnotation:   normalizeLeafAnnotation(diagnosis.leafAnnotation),
    treatmentCost:    normalizeTreatmentCost(diagnosis.treatmentCost),
    primaryConfidence:      asConfidenceInt(diagnosis.primaryConfidence,      75),
    secondaryConfidence:    asConfidenceInt(diagnosis.secondaryConfidence,    18),
    contributingConfidence: asConfidenceInt(diagnosis.contributingConfidence,  7),
  };
}

function fallbackDiagnosis(crop: string, reason?: string) {
  const message = reason ? `Unable to analyze: ${reason}` : "Unable to analyze";
  return {
    disease: "Unknown", confidence: "Low", severity: "unknown",
    primary: "Unknown", secondary: null, contributing: null,
    urgency: "Review and retry with a clearer image",
    scientificName: crop,
    economicImpact: { yieldLossPercent: "unknown", description: "Unable to assess economic impact without a successful diagnosis." },
    observations:    [`The ${crop} sample could not be fully analyzed in English.`],
    causes:          [message],
    treatment:       [{ priority: "Immediate", treatment: "Retake image", product: "No product recommendation available", method: "Upload a clear, well-lit close-up leaf image and retry analysis" }],
    prevention:      ["Ensure the leaf image is sharp, well lit, and fills most of the frame."],
    labTests:        ["Consult a local agronomist or lab for confirmation."],
    seasonalCalendar: [{ period: "Now", action: "Retake the scan with a clearer image before making treatment decisions." }],
    leafAnnotation:   { tip: "none", margins: "none", upperSurface: "none", lowerSurface: "none", midrib: "none", base: "none", description: "Unable to determine symptom location." },
    treatmentCost:    null,
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

// ── Action 1: observeLeaf ──────────────────────────────────
// Vision-only call. No disease names. No diagnosis. Pure visual description.
async function observeLeaf(
  apiKey: string,
  imageB64s: string[],
  crop: string,
): Promise<string> {
  const systemPrompt = `You are a precision agricultural pathology imaging system. Your only task is visual observation.

Examine the submitted leaf photograph(s) carefully. Describe ONLY what you can directly see. Do not name any disease. Do not provide any diagnosis. Do not suggest treatments. Do not infer causes.

Describe the following with precision:

LESION MORPHOLOGY (if lesions are present):
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

IMAGE QUALITY:
- Focus (sharp/slightly blurred/blurry)
- Lighting (well-lit/overexposed/underexposed)
- Leaf coverage (full leaf/partial/close-up of lesion only)

IMPORTANT — for pale or low-contrast lesions:
Distinguish carefully between:
(a) DRY pale lesions — center appears bleached, papery, or chalky. Tissue feels dry. Edges are defined. This is NOT water-soaked.
(b) WET pale lesions — center appears translucent when held to light, greasy or glass-like texture, margins fade into healthy tissue. This IS water-soaked.
Do not describe a lesion as water-soaked unless translucency or greasiness is clearly visible. When in doubt, describe as dry-pale, not water-soaked.

Crop being examined: ${crop}

Write your observations as a structured plain-text report. Be precise and factual. No diagnosis. No disease names. Only what you can see.`;

  const imageBlocks = imageB64s.map((b64) => ({
    type: "image",
    source: { type: "base64", media_type: getMediaType(b64), data: b64 },
  }));
  const textBlock = {
    type: "text",
    text: imageB64s.length > 1
      ? `Examine all ${imageB64s.length} leaf photographs of this ${crop} crop. Describe only what you see. No diagnosis.`
      : `Examine this ${crop} leaf photograph. Describe only what you see. No diagnosis.`,
  };

  const raw = await callClaude(apiKey, {
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: [...imageBlocks, textBlock] }],
  }, 40000);

  if (!raw) {
    console.error("observeLeaf: callClaude returned null — API error or timeout");
    throw new Error("Observation step failed.");
  }
  return raw;
}

// ── Action 2: diagnoseFromObservations ─────────────────────
// Text-only call. No image. Full 6-section protocol + pomegranate keys.
async function diagnoseFromObservations(
  apiKey: string,
  observationText: string,
  crop: string,
  location: string | null,
  soilType: string | null,
  weatherData: { temp: number; humidity: number; description: string; rainfall: number } | null,
): Promise<Record<string, unknown> | null> {
  const systemPrompt = `You are the Truffaire Labs Diagnostic Engine — a precision agricultural pathology system. You do not guess. You do not default to common answers. You diagnose by evidence.

You have received structured visual observations from a leaf image analysis step. Your job is to produce the most accurate, evidence-grounded diagnosis possible from those observations, combined with the provided agronomic context.

═══════════════════════════════════════════════════════════════
SECTION 1 — VISUAL OBSERVATIONS (ALREADY COMPLETE)
═══════════════════════════════════════════════════════════════

The following observations were extracted directly from the leaf photograph(s). Treat these as your Section 1 findings. Do not re-derive or contradict them.

${observationText}

═══════════════════════════════════════════════════════════════
SECTION 2 — CONTEXTUAL RISK ASSESSMENT
═══════════════════════════════════════════════════════════════

Use the provided context to set disease probability weights BEFORE running differential diagnosis. Context does not diagnose — it modifies probability of candidate diseases.

WEATHER LOGIC (apply these rules):
- Humidity > 80% + Temp 20-30C → Fungal pressure HIGH (Cercospora, Alternaria, Colletotrichum, Powdery mildew elevated)
- Humidity > 85% + Temp 25-35C + recent rainfall → Downy mildew, Bacterial diseases, Phytophthora elevated
- Humidity < 60% + Temp > 35C → Powdery mildew, Spider mite elevated. Fungal leaf spots reduced.
- Rainfall in last 24-48h → Splash-dispersed pathogens elevated (Colletotrichum, Cercospora, Bacterial)
- Low temp (<15C) → Botrytis, Powdery mildew elevated

SOIL LOGIC (apply these rules):
- Red/Laterite → Low pH, iron-rich, low water retention. Micronutrient deficiency (Zinc, Boron) more likely. Fusarium elevated in poorly drained areas.
- Black/Vertisol → High water retention, alkaline. Pythium, Phytophthora, Bacterial diseases elevated in wet season.
- Sandy/Loamy → Well-drained. Nematode damage more likely. Drought stress patterns possible.
- Alluvial → Variable. Check for salinity symptoms if coastal location.
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
+ Sporulation structures often visible (powdery, pustules, acervuli, fruiting bodies, mycelium)
+ Lesion color typically tan/brown/gray/black
- ABSENT: bacterial ooze, water-soaking in fresh lesions, translucency, vein-bounded pattern

FUNGAL (BIOTROPHIC) — Required markers:
+ Powdery white/gray coating on leaf surface (Powdery mildew)
+ OR yellow upper surface + gray/purple fuzz on lower surface (Downy mildew)
+ OR orange/brown/yellow pustules (Rust)
+ Leaf remains green and turgid initially
- ABSENT: dry necrotic spots as primary symptom

BACTERIAL — Required markers:
+ Water-soaked lesions (translucent when held to light)
+ Angular lesions bounded by leaf veins
+ Yellow halo around lesions common
+ Bacterial ooze or exudate in humid conditions
+ Lesion margins diffuse or greasy
- ABSENT: dry papery centers, sporulation structures, powdery coatings, concentric rings

VIRAL — Required markers:
+ Mosaic pattern (irregular green/yellow/light patches)
+ OR leaf distortion, curling, stunting
+ OR ring spots (circular chlorotic rings without necrosis)
+ Systemic — affects whole plant, not isolated lesions
- ABSENT: discrete necrotic lesions, sporulation, ooze

ABIOTIC / NUTRITIONAL — Required markers:
+ Interveinal chlorosis (yellowing between veins, veins stay green)
+ OR tip and margin burn without lesion structure
+ OR uniform bleaching/bronzing
+ Symmetrical pattern across leaf
- ABSENT: discrete lesions with defined margins, sporulation, pathogen structures

PEST DAMAGE — Required markers:
+ Shot-holes (clean circular holes in leaf)
+ OR stippling (tiny pale dots across surface — mites)
+ OR skeletonized areas (feeding tracks)
+ OR distortion without chlorosis
- ABSENT: lesions with defined color zones, sporulation

STEP 3B — MATCH SPECIFIC DISEASE WITHIN CATEGORY

SCORING RULES:
- Each observation that matches a disease's known symptom profile: +2 points
- Each observation that directly contradicts a disease's known profile: -3 points
- Context risk elevation for this disease: +1 point
- Context risk reduction for this disease: -1 point
- Surface structures pathognomonic for this disease: +4 points

The disease with the highest score = Primary diagnosis
Second highest = Secondary (only if score > 3)
Contributing factor = environmental/stress factor, not a disease

POMEGRANATE-SPECIFIC DIFFERENTIAL KEY:
When crop is pomegranate, apply this key within Step 3B:

Bacterial Blight (Xanthomonas axonopodis pv. punicae):
+ Water-soaked dark-brown angular lesions bounded by veins
+ Yellow halo common around lesions
+ Bacterial ooze in humid conditions
+ Dark streaks on young shoots
High risk: Monsoon, high humidity, overhead irrigation, Black/Vertisol soils

Alternaria Leaf Spot (Alternaria alternata):
+ Circular to irregular brown spots, 2-8mm
+ Concentric rings or zonate pattern
+ Dark sooty black sporulation visible on lesion center
+ Spots coalesce, causing defoliation
High risk: Humid post-monsoon, moderate temps 22-28C

Cercospora Leaf Spot (Cercospora punicae):
+ Small circular spots, 1-4mm, brown center, distinct yellow halo
+ No concentric rings (key differentiator from Alternaria)
+ Gray-white powdery sporulation on lower surface
+ Random scatter pattern
High risk: Monsoon, humid conditions

Anthracnose (Colletotrichum gloeosporioides):
+ Irregular brown to black lesions, often at tip and margins
+ Pink-salmon spore masses (acervuli) visible in moist conditions
+ Water-soaked initially, then dry papery necrosis
+ Sunken lesions on older tissue
High risk: Post-monsoon, warm humid weather, overhead irrigation

Powdery Mildew (Podosphaera xanthii):
+ White powdery coating on leaf surface
+ Leaves remain green and turgid initially
+ Young leaves and shoots primarily affected
+ No discrete necrotic lesions as primary symptom
High risk: March-May dry season, humidity <60%, temp 25-30C

Phytophthora Blight (Phytophthora sp.):
+ Dark water-soaked patches starting at margins
+ Rapid spread, brown-black necrosis
+ White cottony mycelium on lower surface in high humidity
+ Associated wilting of shoot tips
High risk: Waterlogged soils, monsoon, Black/Clay soils

Leaf Scorch / Abiotic Tip Burn:
+ Brown tip and margin burn with sharp boundary to healthy tissue
+ No discrete lesion morphology or sporulation structures
+ Symmetrical across leaf
Associated with: heat stress, salt injury, drought, Red/Laterite soils

STEP 3C — CONFIDENCE CALIBRATION

High confidence: Primary score significantly higher than all others AND key morphological markers clearly visible in observations
Moderate confidence: Primary score moderately higher than second candidate OR some markers ambiguous
Low confidence: Two or more diseases score similarly OR critical diagnostic markers not described in observations

CRITICAL RULE: If bacterial markers (ooze, angular, water-soaked, translucent) are NOT in the observations — bacterial cannot be primary diagnosis.
CRITICAL RULE: If fungal sporulation structures (powder, pustules, acervuli, mycelium) ARE in observations — fungal must be primary.
CRITICAL RULE: Never output High confidence when markers are ambiguous. An honest Moderate protects the farmer.

═══════════════════════════════════════════════════════════════
SECTION 4 — OBSERVATION INTEGRITY RULES
═══════════════════════════════════════════════════════════════

RULE 1 — OBSERVATIONS ARRAY MUST REFLECT SECTION 1
The observations[] array in your JSON output must reflect only what was described in the Section 1 observations above. Do not add symptoms that were not observed. Do not fabricate evidence.

RULE 2 — SECONDARY DIAGNOSIS REQUIRES EVIDENCE
Secondary condition is only populated if a second distinct set of symptoms appears in the Section 1 observations OR context strongly elevates co-infection risk with some supporting markers present. If no evidence — return null.

RULE 3 — CONFIDENCE SUM
primaryConfidence + secondaryConfidence + contributingConfidence = 100
If secondary is null — split between primary and contributing only.
If both secondary and contributing are null — primaryConfidence = 100.

RULE 4 — ECONOMIC IMPACT MUST BE DISEASE-SPECIFIC AND CROP-SPECIFIC
Use actual yield impact ranges for this specific disease on this specific crop.

═══════════════════════════════════════════════════════════════
SECTION 5 — TREATMENT PROTOCOL RULES
═══════════════════════════════════════════════════════════════

RULE 1 — MATCH CHEMISTRY TO PATHOGEN
Bacterial → copper-based bactericide or streptomycin-based
Fungal necrotrophic → Mancozeb, Chlorothalonil (contact) or Propiconazole, Tebuconazole, Azoxystrobin (systemic)
Powdery mildew → sulfur-based or DMI fungicides. NOT mancozeb.
Rust → triazole fungicides, NOT copper
Viral → no curative treatment, vector control and removal only
Nutritional → soil amendment, foliar micronutrient correction

RULE 2 — NEVER PRESCRIBE COPPER FOR FUNGAL PRIMARY UNLESS SECONDARY BACTERIAL IS CONFIRMED

RULE 3 — DOSAGE MUST BE SPECIFIC
Specify: product name, active ingredient, concentration, dose per liter, application method, timing, repeat interval.

RULE 4 — TREATMENT COST IN INR
perAcre must reflect realistic Karnataka market price for the specified product and dose.

═══════════════════════════════════════════════════════════════
SECTION 6 — FINAL OUTPUT INSTRUCTIONS
═══════════════════════════════════════════════════════════════

INPUTS FOR THIS DIAGNOSIS:
- Crop: ${crop}
- All field values MUST be in ENGLISH only. This is mandatory.
- Never mention AI, Claude, or any technology provider.
${location ? `- Farm Location: ${location}, Karnataka, India` : ""}
${soilType ? `- Soil Type: ${soilType}` : ""}
${weatherData ? `- Current Weather: Temperature ${weatherData.temp}°C, Humidity ${weatherData.humidity}%, Conditions: ${weatherData.description}, Rainfall last hour: ${weatherData.rainfall}mm` : ""}

Complete Sections 2 and 3 in your internal reasoning using the observations from Section 1 above. Then output ONLY the following JSON. No preamble. No explanation. No markdown. Raw JSON only.

{
  "primary": "specific disease name in English",
  "secondary": "specific disease name or null",
  "contributing": "environmental or stress factor or null",
  "severity": "Mild|Moderate|Severe",
  "confidence": "High|Moderate|Low",
  "primaryConfidence": <integer>,
  "secondaryConfidence": <integer or null>,
  "contributingConfidence": <integer or null>,
  "urgency": "specific actionable timeframe e.g. Act within 3-5 days",
  "scientificName": "Latin binomial of crop species",
  "economicImpact": {
    "yieldLossPercent": "disease-specific and crop-specific range",
    "description": "one sentence on specific financial consequence if untreated"
  },
  "treatmentCost": {
    "perAcre": "realistic INR range based on specified product and dose",
    "currency": "INR",
    "basis": "one-time application|per spray cycle"
  },
  "observations": [
    "observation 1 — from Section 1 findings",
    "observation 2 — from Section 1 findings",
    "observation 3 — from Section 1 findings"
  ],
  "causes": [
    "primary pathogen or cause with scientific name if applicable",
    "predisposing environmental factor",
    "agronomic practice contributing to outbreak"
  ],
  "treatment": [
    {
      "priority": "Immediate|Short-term|Medium-term",
      "treatment": "treatment name",
      "product": "specific product with active ingredient and concentration",
      "method": "exact application instructions with dose, timing, coverage"
    }
  ],
  "prevention": [
    "specific prevention measure 1",
    "specific prevention measure 2",
    "specific prevention measure 3"
  ],
  "labTests": [
    "specific test 1 with purpose",
    "specific test 2 with purpose"
  ],
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
    "description": "one sentence describing exact symptom location from Section 1 observations"
  }
}`;

  const raw = await callClaude(apiKey, {
    model: "claude-sonnet-4-20250514",
    max_tokens: 2500,
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

// ── Main action ────────────────────────────────────────────────
// Credits are always deducted before the engine runs.
// If the engine or persistence step fails, the deducted credit is restored.
export const runDiagnosis = action({
  args: {
    clerkId:   v.string(),
    crop:      v.string(),
    location:  v.optional(v.string()),
    soilType:  v.optional(v.string()),
    imageUrl:  v.string(),
    imageB64s: v.array(v.string()),
  },
  handler: async (
    ctx,
    { clerkId, crop, location, soilType, imageUrl, imageB64s }
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

      // ── Optional: fetch weather for farm location ──────────────
      type WeatherData = { temp: number; humidity: number; description: string; rainfall: number };
      let weatherData: WeatherData | null = null;
      if (location) {
        try {
          const weatherKey = process.env.OPENWEATHER_API_KEY;
          if (weatherKey) {
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)},IN&appid=${weatherKey}&units=metric`;
            const weatherRes = await fetch(weatherUrl);
            if (weatherRes.ok) {
              const wd = await weatherRes.json();
              weatherData = {
                temp:        wd.main?.temp           ?? 0,
                humidity:    wd.main?.humidity       ?? 0,
                description: wd.weather?.[0]?.description ?? "unknown",
                rainfall:    wd.rain?.["1h"]         ?? 0,
              };
              console.log("Weather fetched:", weatherData);
            }
          }
        } catch (weatherErr) {
          console.error("Weather fetch failed (non-blocking):", weatherErr);
        }
      }

      // ── STEP 1: Visual observation (image → text) ──────────────
      const observationText = await observeLeaf(apiKey, imageB64s, crop);
      console.log("Observation:", observationText?.slice(0, 300));

      // ── STEP 2: Diagnosis from observations (text → JSON) ──────

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let diagnosis: any = toStoredDiagnosis(fallbackDiagnosis(crop, "analysis unavailable"), crop);

      try {
        const parsedDiag = await diagnoseFromObservations(
          apiKey,
          observationText,
          crop,
          location ?? null,
          soilType ?? null,
          weatherData,
        );

        if (parsedDiag) {
          const base = toStoredDiagnosis(normalizeDiagnosis(parsedDiag, crop), crop);
          diagnosis = weatherData ? { ...base, weatherData } : base;
        } else {
          console.error("Diagnosis: returned null — using fallback");
          const fbBase = toStoredDiagnosis(fallbackDiagnosis(crop, "JSON parse failed"), crop);
          diagnosis = weatherData ? { ...fbBase, weatherData } : fbBase;
        }
      } catch (error) {
        console.error("Diagnosis engine error:", error);
        const reason = error instanceof Error ? error.message : "Unknown failure";
        const fbBase = toStoredDiagnosis(fallbackDiagnosis(crop, reason), crop);
        diagnosis = weatherData ? { ...fbBase, weatherData } : fbBase;
      }

      await ctx.runMutation(internal.diagnose.saveReport, {
        reportId,
        userId: clerkId,
        crop,
        ...(location ? { location } : {}),
        ...(soilType ? { soilType } : {}),
        imageUrl,
        diagnosis,
      });

      return { reportId, diagnosis };

    } catch (error) {
      console.error("runDiagnosis outer error:", error);
      if (creditDeducted) {
        try {
          await ctx.runMutation(api.users.refundCredit, { clerkId });
        } catch (refundError) {
          console.error("Refund error:", refundError);
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
