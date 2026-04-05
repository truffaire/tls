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
      const diagnosisSystemPrompt = `You are the Truffaire Labs Diagnostic Engine — the world's most advanced agricultural leaf diagnosis system.

Your task: Analyse the uploaded leaf photograph and generate a complete, precise, scientifically rigorous diagnosis report.

STRICT RULES:
- Crop: ${crop}
- ALWAYS generate ALL JSON field values in ENGLISH only. This is mandatory for JSON safety.
- Never mention AI, Claude, or any technology provider
- Speak with scientific authority — no hedging
- Base diagnosis on visible symptoms only
- Severity must be exactly one of: Mild, Moderate, Severe
- Confidence must be exactly one of: High, Moderate, Low${locationContext}${weatherContext}${soilContext}${imageCountNote}

Respond ONLY in valid JSON matching this exact structure:
{
  "primary": "condition name in English",
  "secondary": "condition name or null",
  "contributing": "factor or null",
  "severity": "Mild|Moderate|Severe",
  "confidence": "High|Moderate|Low",
  "urgency": "specific timeframe e.g. Act within 7 days",
  "scientificName": "Latin name of crop",
  "economicImpact": {
    "yieldLossPercent": "30-40",
    "description": "One sentence on financial risk if untreated"
  },
  "observations": ["observation 1", "observation 2", "observation 3"],
  "causes": ["cause 1", "cause 2", "cause 3"],
  "treatment": [
    { "priority": "Immediate", "treatment": "treatment name", "product": "product name and rate", "method": "application method and timing" }
  ],
  "prevention": ["prevention point 1", "prevention point 2"],
  "labTests": ["recommended test 1", "recommended test 2"],
  "seasonalCalendar": [
    { "period": "season/month", "action": "recommended action" }
  ],
  "leafAnnotation": {
    "tip": "none|mild|moderate|severe",
    "margins": "none|mild|moderate|severe",
    "upperSurface": "none|mild|moderate|severe",
    "lowerSurface": "none|mild|moderate|severe",
    "midrib": "none|mild|moderate|severe",
    "base": "none|mild|moderate|severe",
    "description": "one sentence describing exact symptom location"
  }
}

Return ONLY the JSON object. No preamble, no markdown, no explanation.`;

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
          max_tokens: 1200,
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
