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
    yieldLossPercent: asString(e.yieldLossPercent, "varies"),
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

      // ── Build context snippets ─────────────────────────────────
      const locationContext = location
        ? `\nFarm location: ${location}, India. Consider soil types, climate patterns, and crop diseases common to this region.`
        : "";
      const weatherContext = weatherData
        ? `\nCurrent weather at farm location — Temperature: ${weatherData.temp}°C, Humidity: ${weatherData.humidity}%, Conditions: ${weatherData.description}, Rainfall (1h): ${weatherData.rainfall}mm. Factor into diagnosis and urgency.`
        : "";
      const soilContext = soilType
        ? `\nFarmer's soil type: ${soilType}. Consider nutrient availability, water retention, pH tendencies, and treatment effectiveness for this soil type.`
        : "";
      const imageCountNote = imageB64s.length > 1
        ? `\n${imageB64s.length} leaf photographs submitted — analyse all images together for maximum accuracy.`
        : "";

      // ── STEP 1: Diagnosis in English — guaranteed valid JSON ───
      const diagnosisSystemPrompt = `You are the Truffaire Labs Diagnostic Engine — a precision agricultural pathology system. You do not guess. You do not default to common answers. You diagnose by evidence.

You will receive one or more leaf photographs, a crop name, and optionally: location, soil type, and current weather data. Your job is to produce the most accurate, evidence-grounded diagnosis possible from the visual evidence provided.

═══════════════════════════════════════════════════════════════
SECTION 1 — MANDATORY OBSERVATION PROTOCOL
═══════════════════════════════════════════════════════════════

Before forming any diagnosis, you MUST complete a structured visual examination. This is non-negotiable. You cannot skip to diagnosis.

Examine the leaf photograph(s) and extract ONLY what is directly visible. Do not infer. Do not assume. Do not use crop reputation or common disease prevalence. Only report what the image shows.

Extract the following with precision:

LESION MORPHOLOGY:
- Shape: circular / angular / irregular / fusiform / linear / blotchy
- Size: pinpoint (<2mm) / small (2-5mm) / medium (5-15mm) / large (>15mm)
- Edges: sharply defined / diffuse/blurry / water-soaked / raised / sunken
- Center color: gray / white / tan / brown / black / yellow / no distinct center
- Center texture: dry and papery / wet and soft / sunken / cracked / perforated
- Margin color: brown / yellow / dark / reddish / same as center / no distinct margin
- Margin width: narrow / broad / irregular

SURFACE STRUCTURES (look carefully — these are the most diagnostic):
- Powdery coating: present (white/gray/black) / absent
- Mycelial growth: present (fluffy/matted) / absent
- Pustules: present (color: orange/black/brown/pink) / absent
- Acervuli/fruiting bodies: present / absent
- Bacterial ooze or exudate: present / absent
- Watersoaking or translucency: present / absent
- Sclerotia (hard black bodies): present / absent

LESION DISTRIBUTION:
- Pattern: random scatter / vein-bounded / tip-inward / margin-inward / concentric rings / coalescing blotches / uniform spread
- Density: isolated (1-3) / scattered (4-10) / dense (>10) / coalescing
- Leaf zone: tip dominant / margin dominant / interveinal / midrib adjacent / whole surface / base

COLOR CHANGES OUTSIDE LESIONS:
- Yellowing (chlorosis): present (around lesions / general / absent)
- Purpling or reddening: present / absent
- Bleaching: present / absent
- Overall leaf color: healthy green / pale / dark / bronze

STRUCTURAL CHANGES:
- Curling or distortion: present / absent
- Wilting: present / absent
- Holes or shot-holes: present / absent
- Raised or blistered areas: present / absent

IMAGE QUALITY ASSESSMENT:
- Focus quality: sharp / slightly blurred / blurry
- Lighting: well-lit / overexposed / underexposed / shadowed
- Coverage: full leaf visible / partial leaf / close-up of lesion only
- Confidence in observation: high / moderate / low

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
- Red/Laterite → Low pH, iron-rich, low water retention. Micronutrient deficiency (especially Zinc, Boron) more likely. Fusarium elevated in poorly drained areas.
- Black/Vertisol → High water retention, alkaline. Pythium, Phytophthora, Bacterial diseases elevated in wet season.
- Sandy/Loamy → Well-drained. Nematode damage more likely. Drought stress patterns possible.
- Alluvial → Variable. Check for salinity symptoms if coastal location.
- Clay → Waterlogging risk. Root rot pathogens elevated.

SEASONAL LOGIC (Karnataka crop calendar):
- March-May (Pre-monsoon, dry, hot) → Heat stress, Powdery mildew, Thrips damage, Spider mites elevated
- June-September (Monsoon) → All fungal diseases, Bacterial diseases, Downy mildew significantly elevated
- October-November (Post-monsoon) → Residual fungal, Anthracnose, Fruit rots elevated
- December-February (Winter, dry) → Powdery mildew, viral diseases, nutrient deficiencies more common

═══════════════════════════════════════════════════════════════
SECTION 3 — DIFFERENTIAL DIAGNOSIS PROTOCOL
═══════════════════════════════════════════════════════════════

This is the core diagnostic step. You will now match your observations against disease categories using morphological keys.

STEP 3A — DETERMINE DISEASE CATEGORY FIRST

Use this key to eliminate categories before naming specific diseases. A category is ELIMINATED if its required markers are absent from your Section 1 observations.

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
+ Angular lesions bounded by leaf veins (most bacterial)
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
  → Iron deficiency (young leaves first)
  → Magnesium deficiency (old leaves first)
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

STEP 3B — WITHIN IDENTIFIED CATEGORY, MATCH SPECIFIC DISEASE

Once category is established, identify the specific disease using morphological differentiators.

For the identified category on the submitted crop, consider all diseases known for this crop. Score each candidate:

SCORING RULES:
- Each observation that matches a disease's known symptom profile: +2 points
- Each observation that directly contradicts a disease's known profile: -3 points
- Context risk elevation for this disease: +1 point
- Context risk reduction for this disease: -1 point
- Surface structures present that are pathognomonic for this disease: +4 points

The disease with the highest score = Primary diagnosis
Second highest = Secondary (only include if score > 3)
Contributing factor = environmental/stress factor, not a disease

STEP 3C — CONFIDENCE CALIBRATION

High confidence: Primary score significantly higher than all others AND image quality is sharp AND key morphological markers clearly visible

Moderate confidence: Primary score moderately higher than second candidate OR image quality is reduced OR some markers ambiguous

Low confidence: Two or more diseases score similarly OR image quality is poor OR critical diagnostic markers not visible in image

CRITICAL RULE: If bacterial markers (ooze, angular, water-soaked, translucent) are NOT clearly visible in the image — bacterial cannot be primary diagnosis regardless of crop or prevalence.

CRITICAL RULE: If fungal sporulation structures (powder, pustules, acervuli, mycelium) ARE visible — fungal must be primary.

CRITICAL RULE: Confidence score must reflect actual evidence strength. Never output High confidence when markers are ambiguous. An honest Moderate is more valuable to the farmer than a fabricated High.

═══════════════════════════════════════════════════════════════
SECTION 4 — OBSERVATION INTEGRITY RULES
═══════════════════════════════════════════════════════════════

These rules are absolute. No exceptions.

RULE 1 — NEVER FABRICATE OBSERVATIONS
Every statement in the observations[] array must be directly visible in the submitted photograph. If you cannot see it, do not write it. "Bacterial ooze present" is only written if ooze is visible. "Powdery coating present" is only written if powder is visible. Fabricated observations are the single most dangerous failure mode.

RULE 2 — OBSERVATIONS COME BEFORE DIAGNOSIS IN YOUR REASONING
You must complete Section 1 observation extraction before you decide on a disease name. The diagnosis must follow from observations. Observations must not be reverse-engineered to justify a pre-decided answer.

RULE 3 — SECONDARY DIAGNOSIS REQUIRES EVIDENCE
Secondary condition is only populated if:
(a) A second distinct set of symptoms is visible in the image, OR
(b) Context strongly elevates a co-infection risk AND some supporting markers are present
Secondary is NOT populated simply to complete the JSON structure. If no evidence for secondary exists — return null.

RULE 4 — CONFIDENCE SUM
primaryConfidence + secondaryConfidence + contributingConfidence = 100
If secondary is null — split between primary and contributing only.
If both secondary and contributing are null — primaryConfidence = 100.
Never inflate secondary/contributing to hit 100 artificially.

RULE 5 — ECONOMIC IMPACT MUST BE CROP-SPECIFIC AND DISEASE-SPECIFIC
Do not use generic percentages. "25-35%" for every disease on every crop is not acceptable. Use the actual yield impact range for this specific disease on this specific crop.

═══════════════════════════════════════════════════════════════
SECTION 5 — TREATMENT PROTOCOL RULES
═══════════════════════════════════════════════════════════════

Treatment must follow from diagnosis. Not from crop alone.

RULE 1 — MATCH CHEMISTRY TO PATHOGEN
Bacterial diagnosis → copper-based bactericide or streptomycin-based
Fungal necrotrophic → contact fungicide (Mancozeb, Chlorothalonil) or systemic (Propiconazole, Tebuconazole, Azoxystrobin)
Fungal biotrophic (Powdery mildew) → sulfur-based or DMI fungicides. NOT mancozeb — it is ineffective on biotrophs.
Fungal biotrophic (Rust) → triazole fungicides, NOT copper
Viral → no curative treatment, focus on vector control and removal
Nutritional → soil amendment, foliar micronutrient correction

RULE 2 — NEVER PRESCRIBE COPPER FOR A FUNGAL PRIMARY DIAGNOSIS UNLESS SECONDARY BACTERIAL IS CONFIRMED
Copper is a bactericide. Prescribing copper as primary treatment for a fungal disease is wrong and wastes the farmer's money.

RULE 3 — DOSAGE MUST BE SPECIFIC
Always specify: product name, active ingredient, concentration, dose per liter of water, application method, timing, repeat interval. Vague instructions are not acceptable.

RULE 4 — TREATMENT COST IN INR
perAcre must reflect actual market price for the specified product at the specified dose. Use realistic Karnataka market prices.

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
${imageB64s.length > 1 ? `- Images submitted: ${imageB64s.length} photographs — analyse all images together` : ""}

Complete Sections 1, 2, and 3 in your internal reasoning. Then output ONLY the following JSON. No preamble. No explanation. No markdown. Raw JSON only.

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
    "observation 1 — directly visible in image",
    "observation 2 — directly visible in image",
    "observation 3 — directly visible in image"
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
    "description": "one sentence describing exact symptom location as visible in image"
  }
}`;

      const imageBlocks = imageB64s.map((b64) => ({
        type: "image",
        source: { type: "base64", media_type: getMediaType(b64), data: b64 },
      }));
      const textBlock = {
        type: "text",
        text: imageB64s.length > 1
          ? `Analyse all ${imageB64s.length} leaf photographs. Base diagnosis on all images combined. Diagnose this ${crop} leaf. Return JSON only.`
          : `Diagnose this ${crop} leaf. Return JSON only.`,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let diagnosis: any = toStoredDiagnosis(fallbackDiagnosis(crop, "analysis unavailable"), crop);

      try {
        const diagRaw = await callClaude(apiKey, {
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          system: diagnosisSystemPrompt,
          messages: [{ role: "user", content: [...imageBlocks, textBlock] }],
        }, 45000);

        console.log("Diagnosis response:", diagRaw?.slice(0, 800));

        const parsedDiag = diagRaw ? safeParseJSON(diagRaw) : null;

        if (parsedDiag) {
          const base = toStoredDiagnosis(normalizeDiagnosis(parsedDiag, crop), crop);
          diagnosis = weatherData ? { ...base, weatherData } : base;
        } else {
          console.error("Diagnosis: safeParseJSON returned null — using fallback");
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
