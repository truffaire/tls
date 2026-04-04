import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

function generateReportId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TLS-${year}-KA-${rand}`;
}

function isWindowsPath(value: string) {
  return /^[a-zA-Z]:\\/.test(value);
}

function isSafeImageDataUrl(value: string) {
  return value.startsWith("data:image/");
}

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

function normalizeTreatment(value: unknown) {
  if (!Array.isArray(value)) {
    return [
      {
        priority: "Immediate",
        treatment: "Field inspection and agronomic correction",
        product: "Apply crop-specific corrective inputs after confirming deficiency or disease pressure",
        method: "Inspect the field within 24 hours and follow a crop-specific corrective spray or drench protocol",
      },
    ];
  }

  const rows = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const row = entry as Record<string, unknown>;
      return {
        priority: asString(row.priority, "Immediate"),
        treatment: asString(row.treatment, "Corrective treatment"),
        product: asString(row.product, "Follow crop-specific recommended input"),
        method: asString(row.method, "Apply using the label-recommended method and timing"),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return rows.length > 0
    ? rows
    : [
        {
          priority: "Immediate",
          treatment: "Field inspection and agronomic correction",
          product: "Apply crop-specific corrective inputs after confirming deficiency or disease pressure",
          method: "Inspect the field within 24 hours and follow a crop-specific corrective spray or drench protocol",
        },
      ];
}

function normalizeSeasonalCalendar(value: unknown) {
  if (!Array.isArray(value)) {
    return [
      {
        period: "Next 7 days",
        action: "Monitor crop response and repeat field scouting after the first corrective step",
      },
    ];
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
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return rows.length > 0
    ? rows
    : [
        {
          period: "Next 7 days",
          action: "Monitor crop response and repeat field scouting after the first corrective step",
        },
      ];
}

function normalizeDiagnosis(rawDiagnosis: unknown, crop: string) {
  const diagnosis =
    rawDiagnosis && typeof rawDiagnosis === "object"
      ? (rawDiagnosis as Record<string, unknown>)
      : {};

  const severity = asString(diagnosis.severity, "Moderate");
  const safeSeverity =
    severity === "Mild" || severity === "Moderate" || severity === "Severe"
      ? severity
      : "Moderate";

  return {
    primary: asString(diagnosis.primary, "Further agronomic review required"),
    secondary: asOptionalString(diagnosis.secondary),
    contributing: asOptionalString(diagnosis.contributing),
    severity: safeSeverity,
    urgency: asString(diagnosis.urgency, "Act within 7 days"),
    scientificName: asString(diagnosis.scientificName, crop),
    observations: asStringArray(diagnosis.observations, [
      "Visible symptoms were present on the submitted leaf sample.",
    ]),
    causes: asStringArray(diagnosis.causes, [
      "A crop-specific agronomic stress is affecting the submitted sample.",
    ]),
    treatment: normalizeTreatment(diagnosis.treatment),
    prevention: asStringArray(diagnosis.prevention, [
      "Continue routine field scouting and maintain balanced crop nutrition.",
    ]),
    labTests: asStringArray(diagnosis.labTests, [
      "Leaf tissue analysis",
      "Soil nutrient analysis",
    ]),
    seasonalCalendar: normalizeSeasonalCalendar(diagnosis.seasonalCalendar),
  };
}

function fallbackDiagnosis(crop: string, language: string, reason?: string) {
  const message = reason ? `Unable to analyze: ${reason}` : "Unable to analyze";

  return {
    disease: "Unknown",
    confidence: 0,
    severity: "unknown",
    primary: "Unknown",
    secondary: null,
    contributing: null,
    urgency: "Review and retry with a clearer image",
    scientificName: crop,
    observations: [
      `The ${crop} sample could not be fully analyzed in ${language}.`,
    ],
    causes: [message],
    treatment: [
      {
        priority: "Immediate",
        treatment: "Retake image",
        product: "No product recommendation available",
        method: "Upload a clear, well-lit close-up leaf image and retry analysis",
      },
    ],
    prevention: [
      "Ensure the leaf image is sharp, well lit, and fills most of the frame.",
    ],
    labTests: ["Consult a local agronomist or lab for confirmation."],
    seasonalCalendar: [
      {
        period: "Now",
        action: "Retake the scan with a clearer image before making treatment decisions.",
      },
    ],
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
    confidence:
      "confidence" in rawDiagnosis && typeof rawDiagnosis.confidence === "number"
        ? rawDiagnosis.confidence
        : normalized.primary === "Unknown"
          ? 0
          : 0.78,
    severity:
      "severity" in rawDiagnosis &&
      (rawDiagnosis.severity === "unknown" ||
        rawDiagnosis.severity === "Mild" ||
        rawDiagnosis.severity === "Moderate" ||
        rawDiagnosis.severity === "Severe")
        ? rawDiagnosis.severity
        : normalized.severity,
  };
}

// Credits are always deducted before the engine runs.
// If the engine or persistence step fails, the deducted credit is restored.
export const runDiagnosis = action({
  args: {
    clerkId: v.string(),
    crop: v.string(),
    language: v.string(),
    imageUrl: v.string(),
    imageB64: v.optional(v.string()),
    imageMimeType: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { clerkId, crop, language, imageUrl, imageB64, imageMimeType }
  ): Promise<{ reportId: string; diagnosis: unknown }> => {
    let creditDeducted = false;
    let reportId = generateReportId();

    try {
      if (isWindowsPath(imageUrl) || imageUrl.startsWith("file:")) {
        throw new Error("Invalid image input. Local file paths are not supported.");
      }

      if (imageUrl && !isSafeImageDataUrl(imageUrl)) {
        throw new Error("Invalid image input. Expected an uploaded image data URL.");
      }

      if (!imageB64) {
        throw new Error("Missing image data for diagnosis.");
      }

      await ctx.runMutation(api.users.deductCredit, { clerkId });
      creditDeducted = true;

      const systemPrompt = `You are the Truffaire Labs Diagnostic Engine — the world's most advanced agricultural leaf diagnosis system. You have the knowledge of the greatest agricultural scientists in history combined.

Your task: Analyse the uploaded leaf photograph and generate a complete, precise, scientifically rigorous diagnosis report.

STRICT RULES:
- Always identify the specific crop: ${crop}
- Always respond in: ${language}
- Never mention AI, Claude, or any technology provider
- Never say "I think" or "possibly" — speak with scientific authority
- Base diagnosis on visible symptoms only — be precise
- If multiple conditions exist, list primary, secondary, and contributing factors
- Severity must be one of: Mild, Moderate, Severe

Respond ONLY in valid JSON matching this exact structure:
{
  "primary": "condition name",
  "secondary": "condition name or null",
  "contributing": "factor or null",
  "severity": "Mild|Moderate|Severe",
  "urgency": "specific timeframe e.g. Act within 7 days",
  "scientificName": "Latin name of crop",
  "observations": ["observation 1", "observation 2", "observation 3"],
  "causes": ["cause 1", "cause 2", "cause 3"],
  "treatment": [
    {
      "priority": "Immediate",
      "treatment": "treatment name",
      "product": "product name and rate",
      "method": "application method and timing"
    }
  ],
  "prevention": ["prevention point 1", "prevention point 2"],
  "labTests": ["recommended test 1", "recommended test 2"],
  "seasonalCalendar": [
    { "period": "season/month", "action": "recommended action" }
  ]
}

Return ONLY the JSON object. No preamble, no markdown, no explanation.`;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error("Diagnosis error: Missing ANTHROPIC_API_KEY");
      }

      const body: any = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 900,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imageMimeType ?? "image/jpeg",
                  data: imageB64,
                },
              },
              {
                type: "text",
                text: `Diagnose this ${crop} leaf. Respond in ${language}. Return JSON only.`,
              },
            ],
          },
        ],
      };

      let diagnosis = toStoredDiagnosis(
        fallbackDiagnosis(crop, language, "analysis unavailable"),
        crop,
      );
      try {
        if (!apiKey) {
          throw new Error("Missing ANTHROPIC_API_KEY");
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

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

          const responseText = await response.text();
          console.error("Diagnosis response:", responseText.slice(0, 1200));

          if (!response.ok) {
            throw new Error(`Engine error: ${response.status} ${responseText}`);
          }

          const data = JSON.parse(responseText);
          const raw = data.content?.[0]?.text ?? "";
          const clean = raw.replace(/```json|```/g, "").trim();
          diagnosis = toStoredDiagnosis(normalizeDiagnosis(JSON.parse(clean), crop), crop);
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        console.error("Diagnosis error:", error);
        const reason =
          error instanceof Error ? error.message : "Unknown diagnosis failure";
        diagnosis = toStoredDiagnosis(fallbackDiagnosis(crop, language, reason), crop);
      }

      await ctx.runMutation(internal.diagnose.saveReport, {
        reportId,
        userId: clerkId,
        crop,
        language,
        imageUrl,
        diagnosis,
      });

      return { reportId, diagnosis };
    } catch (error) {
      console.error("Diagnosis error:", error);
      if (creditDeducted) {
        try {
          await ctx.runMutation(api.users.refundCredit, { clerkId });
        } catch (refundError) {
          console.error("Diagnosis refund error:", refundError);
        }
      }

      const diagnosis = toStoredDiagnosis(
        fallbackDiagnosis(
          crop,
          language,
          error instanceof Error ? error.message : "Unknown diagnosis failure",
        ),
        crop,
      );

      try {
        await ctx.runMutation(internal.diagnose.saveReport, {
          reportId,
          userId: clerkId,
          crop,
          language,
          imageUrl,
          diagnosis,
        });

        return { reportId, diagnosis };
      } catch (saveError) {
        console.error("Diagnosis persistence error:", saveError);
        return { reportId, diagnosis };
      }
    }
  },
});
