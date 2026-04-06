import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { pdf } from "@react-pdf/renderer";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import TLSReportPDF from "@/components/TLSReportPDF";

// ── Palette ──────────────────────────────────────────────────────
const C = {
  bg:         "#F7F8F8",
  dark:       "#0C1618",
  teal:       "#004643",
  tealLight:  "#E8F0EF",
  white:      "#FFFFFF",
  border:     "#E8ECEC",
  muted:      "#888E8E",
  amber:      "#92400E",
  amberLight: "#FEF3C7",
  red:        "#991B1B",
  redLight:   "#FEE2E2",
  green:      "#065F46",
  greenLight: "#D1FAE5",
} as const;

function severityStyle(s: string) {
  if (s === "Severe") return { bg: C.redLight,   text: C.red   };
  if (s === "Mild")   return { bg: C.greenLight,  text: C.green };
  return                     { bg: C.amberLight,  text: C.amber };
}
function confidenceStyle(c: string) {
  if (c === "High") return { bg: C.greenLight, text: C.green };
  if (c === "Low")  return { bg: C.redLight,   text: C.red   };
  return                   { bg: C.amberLight, text: C.amber };
}

// ── Main component ───────────────────────────────────────────────
export default function Report() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const report     = useQuery(api.diagnose.getReport, { reportId: id ?? "" });
  const [generating, setGenerating] = useState(false);
  const [feedback,   setFeedback]   = useState<"up" | "down" | null>(null);
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({});

  // ── Loading ───────────────────────────────────────────────────
  if (report === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${C.teal}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (!report || !report.diagnosis) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ color: C.muted, fontSize: 14 }}>Report not found</p>
        <button onClick={() => navigate("/dashboard")} style={primaryBtn}>Back to Dashboard</button>
      </div>
    );
  }

  const dx = (report.diagnosis && typeof report.diagnosis === "object")
    ? (report.diagnosis as Record<string, unknown>)
    : {};

  // ── Extract fields ────────────────────────────────────────────
  const primary      = String(dx.primary     ?? "Not available");
  const secondary    = dx.secondary    ? String(dx.secondary)    : null;
  const contributing = dx.contributing ? String(dx.contributing) : null;
  const severity     = String(dx.severity    ?? "Moderate");
  const confidence   = String(dx.confidence  ?? "Moderate");
  const urgency      = String(dx.urgency     ?? "Act within 7 days");
  const sciName      = String(dx.scientificName ?? report.crop ?? "Unknown");

  // Confidence distribution (new)
  const primaryConf      = typeof dx.primaryConfidence      === "number" ? dx.primaryConfidence      : null;
  const secondaryConf    = typeof dx.secondaryConfidence    === "number" ? dx.secondaryConfidence    : null;
  const contributingConf = typeof dx.contributingConfidence === "number" ? dx.contributingConfidence : null;
  const hasConfBars      = primaryConf !== null;

  // Economic
  const econImpact = (dx.economicImpact && typeof dx.economicImpact === "object")
    ? dx.economicImpact as { yieldLossPercent?: string; description?: string }
    : null;

  // Treatment cost (new)
  const treatmentCost = (dx.treatmentCost && typeof dx.treatmentCost === "object")
    ? dx.treatmentCost as { perAcre?: string; currency?: string; basis?: string }
    : null;

  // Arrays
  const observations     = Array.isArray(dx.observations)     ? (dx.observations     as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const causes           = Array.isArray(dx.causes)           ? (dx.causes           as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const prevention       = Array.isArray(dx.prevention)       ? (dx.prevention       as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const labTests         = Array.isArray(dx.labTests)         ? (dx.labTests         as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const seasonalCalendar = Array.isArray(dx.seasonalCalendar) ? (dx.seasonalCalendar as unknown[]).filter((x): x is Record<string,unknown> => !!x && typeof x === "object") : [];
  const treatmentItems   = Array.isArray(dx.treatment)        ? (dx.treatment        as unknown[]).filter((x): x is Record<string,unknown> => !!x && typeof x === "object") : [];

  const weatherDisplay = (dx.weatherData && typeof dx.weatherData === "object")
    ? dx.weatherData as { temp?: number; humidity?: number; description?: string; rainfall?: number }
    : null;
  const leafAnnotation = (dx.leafAnnotation && typeof dx.leafAnnotation === "object")
    ? dx.leafAnnotation as Record<string, string>
    : null;

  const location  = report.location  ?? null;
  const soilType  = report.soilType  ?? null;
  const imageUrl  = report.imageUrl  || null;
  const hasContext = !!(location || soilType || weatherDisplay);

  const date = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const timelineLabels = ["Day 0–3", "Day 7", "Day 15", "Seasonal"];

  // ── Handlers ──────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    try {
      setGenerating(true);
      const blob = await pdf(<TLSReportPDF report={report} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.target = "_blank";
      link.download = `${report.reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) { console.error("PDF error:", err); }
    finally { setGenerating(false); }
  };

  const handleAddToCalendar = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
    const end = new Date(d.getTime() + 3600000);
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT",
      `DTSTART:${fmt(d)}`,`DTEND:${fmt(end)}`,
      `SUMMARY:TLS Follow-up Scan — ${report.crop}`,
      `DESCRIPTION:Follow-up scan for ${report.crop}. Report: ${report.reportId}`,
      "END:VEVENT","END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `follow-up-${report.reportId}.ics`;
    a.click(); URL.revokeObjectURL(url);
  };

  const toggle = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  // Context paragraph
  const parts: string[] = [];
  if (location)       parts.push(`the conditions of ${location}, India`);
  if (soilType)       parts.push(`${soilType} soil characteristics`);
  if (weatherDisplay) parts.push(`current weather (${weatherDisplay.temp}°C, ${weatherDisplay.humidity}% RH)`);
  const contextParagraph = parts.length > 0
    ? `This diagnosis has been calibrated for ${parts.join(" and ")}. ${weatherDisplay && (weatherDisplay.humidity ?? 0) > 70 ? "Elevated humidity increases fungal spread risk — monitor closely." : "Conditions are factored into treatment urgency and timing."}`
    : "";

  const sevStyle  = severityStyle(severity);
  const confStyle = confidenceStyle(confidence);

  try { return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div style={{ padding: "80px 16px 60px", maxWidth: 600, margin: "0 auto" }}>

        {/* Back */}
        <button onClick={() => navigate("/history")} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 13, marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          All Reports
        </button>

        {/* ── S1: INSTANT IMPACT ── */}
        <div style={{ background: C.dark, borderRadius: 20, padding: "24px 22px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>
                TRUFFAIRE LABS · LEAF DIAGNOSIS
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>{sciName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>{report.crop}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{date}</div>
            </div>
          </div>

          <div style={{ fontSize: "clamp(22px,5.5vw,30px)", fontWeight: 700, color: C.white, lineHeight: 1.1, letterSpacing: "-0.025em", marginBottom: 18 }}>
            {primary}
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 22 }}>
            <Pill label={severity.toUpperCase()}               bg={sevStyle.bg}               text={sevStyle.text} />
            <Pill label={`${confidence.toUpperCase()} CONF.`} bg={confStyle.bg}               text={confStyle.text} />
            <Pill label={urgency}                              bg="rgba(255,255,255,0.07)"    text="rgba(255,255,255,0.7)" />
          </div>

          {econImpact && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: "#FCD34D", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {String(econImpact.yieldLossPercent ?? "—").replace(/%/g, "")}%
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>
                  potential yield loss if untreated
                </span>
              </div>
              {econImpact.description && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8, lineHeight: 1.6, fontWeight: 300, marginBottom: 0 }}>
                  {econImpact.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── S2: VISUAL PROOF ── */}
        {(imageUrl || leafAnnotation) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            {imageUrl && imageUrl.startsWith("data:image/") && (
              <div style={{ flex: "1 1 140px", background: C.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <img src={imageUrl} alt="Submitted leaf" style={{ width: "100%", display: "block", aspectRatio: "1/1", objectFit: "cover" }} />
                <div style={{ padding: "8px 12px", fontSize: 10, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Submitted Sample
                </div>
              </div>
            )}
            {leafAnnotation && (
              <div style={{ flex: "1 1 140px" }}>
                <LeafAnnotationDiagram annotation={leafAnnotation} />
              </div>
            )}
          </div>
        )}

        {/* ── S3: DIAGNOSIS INTELLIGENCE ── */}
        <Card label="CONFIDENCE ANALYSIS" title="Diagnosis Intelligence">
          {hasConfBars ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {([
                { name: primary,       pct: primaryConf!,       label: "Primary" },
                ...(secondary    && secondaryConf    !== null ? [{ name: secondary,    pct: secondaryConf!,    label: "Secondary" }]    : []),
                ...(contributing && contributingConf !== null ? [{ name: contributing, pct: contributingConf!, label: "Contributing" }] : []),
              ] as { name: string; pct: number; label: string }[]).map(({ name, pct, label }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 7 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.dark, marginTop: 2 }}>{name}</div>
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 700, color: C.teal, letterSpacing: "-0.03em", lineHeight: 1 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "#EAEEF0", borderRadius: 100 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: C.teal, borderRadius: 100 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {([
                { label: "Primary",      name: primary,       pill: { bg: confStyle.bg,    text: confStyle.text, val: confidence } },
                ...(secondary    ? [{ label: "Secondary",    name: secondary,    pill: { bg: C.amberLight, text: C.amber,      val: "Possible"     } }] : []),
                ...(contributing ? [{ label: "Contributing", name: contributing, pill: { bg: "#F0F2F2",    text: C.muted,      val: "Factor"       } }] : []),
              ] as { label: string; name: string; pill: { bg: string; text: string; val: string } }[]).map(({ label, name, pill }, i, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted }}>{label}</div>
                    <div style={{ fontSize: 13, color: C.dark, fontWeight: 400, marginTop: 2 }}>{name}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 100, background: pill.bg, color: pill.text, flexShrink: 0 }}>{pill.val}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── S4: ECONOMIC DECISION LAYER ── */}
        {econImpact && (
          <Card label="FINANCIAL IMPACT" title="Economic Decision">
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${treatmentCost ? 3 : 2}, 1fr)`, gap: 8, marginBottom: 14 }}>
              <MetricCard label="Yield Loss"  value={`${String(econImpact.yieldLossPercent ?? "—").replace(/%/g, "")}%`}  sub="if untreated"   highlight="amber" />
              {treatmentCost && (
                <MetricCard label="Treatment Cost" value={treatmentCost.perAcre ? `₹${treatmentCost.perAcre}` : "—"} sub={treatmentCost.basis ?? "per acre"} highlight="teal" />
              )}
              <MetricCard label="Urgency" value={severity === "Severe" ? "Immediate" : severity === "Moderate" ? "This week" : "Monitor"} sub="response needed" highlight="dark" />
            </div>
            <div style={{ background: C.amberLight, borderLeft: `3px solid ${C.amber}`, borderRadius: "0 10px 10px 0", padding: "12px 14px" }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: C.amber, marginBottom: 4 }}>ACTION INSIGHT</div>
              <p style={{ fontSize: 13, color: C.dark, fontWeight: 300, lineHeight: 1.65, margin: 0 }}>
                {econImpact.description ?? "Act promptly to protect your harvest."}
              </p>
            </div>
          </Card>
        )}

        {/* ── S5: ACTION PLAN TIMELINE ── */}
        {treatmentItems.length > 0 && (
          <Card label="TREATMENT TIMELINE" title="Action Plan">
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 13, top: 28, bottom: 14, width: 2, background: C.border }} />
              {treatmentItems.map((item, i) => {
                const label    = timelineLabels[Math.min(i, timelineLabels.length - 1)];
                const priority = String(item.priority ?? "Advisory");
                const urgent   = priority.toLowerCase() === "immediate";
                return (
                  <div key={i} style={{ display: "flex", gap: 16, marginBottom: i < treatmentItems.length - 1 ? 22 : 0 }}>
                    <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: urgent ? C.red : C.teal, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, marginTop: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.white }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: C.teal, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, marginTop: 2 }}>{String(item.treatment ?? "Treatment")}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 100, background: urgent ? C.redLight : C.tealLight, color: urgent ? C.red : C.teal, flexShrink: 0 }}>{priority}</span>
                      </div>
                      {!!item.product && <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}><strong style={{ color: C.dark, fontWeight: 500 }}>Product:</strong> {String(item.product)}</div>}
                      {!!item.method  && <div style={{ fontSize: 12, color: C.muted }}><strong style={{ color: C.dark, fontWeight: 500 }}>Method:</strong> {String(item.method)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── S6: DECISION FLOW ── */}
        <Card label="MONITOR OUTCOMES" title="Decision Flow">
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 14, fontWeight: 300, lineHeight: 1.6 }}>
            After following the treatment plan, monitor your {report.crop} and select:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {([
              { icon: "✓", heading: "Improving",  body: "Symptoms reducing after treatment",   btnLabel: "Stay Course", btnBg: C.greenLight, btnText: C.green, action: () => navigate("/scan")     },
              { icon: "○", heading: "No Change",   body: "No improvement after 7 days",         btnLabel: "Get Expert",  btnBg: C.amberLight, btnText: C.amber, action: () => {}                    },
              { icon: "✗", heading: "Worsening",  body: "Condition spreading or intensifying", btnLabel: "Re-Scan →",   btnBg: C.redLight,   btnText: C.red,   action: () => navigate("/scan")     },
            ] as { icon: string; heading: string; body: string; btnLabel: string; btnBg: string; btnText: string; action: () => void }[]).map(({ icon, heading, body, btnLabel, btnBg, btnText, action }) => (
              <div key={heading} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.dark }}>{heading}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, fontWeight: 300, flexGrow: 1 }}>{body}</div>
                <button onClick={action} style={{ width: "100%", padding: "6px 0", borderRadius: 8, background: btnBg, color: btnText, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{btnLabel}</button>
              </div>
            ))}
          </div>
        </Card>

        {/* ── S7: CONTEXT ENGINE ── */}
        {hasContext && (
          <Card label="FIELD CONDITIONS" title="Context Engine">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {location    && <ContextPill icon="📍" label={location} />}
              {soilType    && <ContextPill icon="🌱" label={soilType} />}
              {weatherDisplay && <ContextPill icon="🌡" label={`${weatherDisplay.temp}°C · ${weatherDisplay.humidity}% RH`} />}
              {weatherDisplay && (weatherDisplay.rainfall ?? 0) > 0 && <ContextPill icon="🌧" label={`${weatherDisplay.rainfall}mm rain`} />}
            </div>
            <p style={{ fontSize: 13, color: C.dark, lineHeight: 1.65, fontWeight: 300, margin: 0 }}>{contextParagraph}</p>
          </Card>
        )}

        {/* ── S8: LEARNING LOOP ── */}
        <Card label="FEEDBACK" title="Learning Loop">
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 12, fontWeight: 300 }}>Was this diagnosis helpful?</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setFeedback("up")}   style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${feedback === "up"   ? C.teal : C.border}`, background: feedback === "up"   ? C.tealLight : C.white, color: feedback === "up"   ? C.teal : C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>👍 Yes, accurate</button>
              <button onClick={() => setFeedback("down")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${feedback === "down" ? C.red  : C.border}`, background: feedback === "down" ? C.redLight  : C.white, color: feedback === "down" ? C.red  : C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>👎 Needs work</button>
            </div>
            {feedback && (
              <p style={{ fontSize: 12, color: feedback === "up" ? C.green : C.amber, marginTop: 8, fontWeight: 300, marginBottom: 0 }}>
                {feedback === "up" ? "Thank you! Your feedback helps improve our model." : "Noted. Your feedback helps improve future diagnoses."}
              </p>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 10, fontWeight: 300 }}>Schedule a follow-up scan in 7 days to track treatment progress.</p>
            <button onClick={handleAddToCalendar} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: `1.5px solid ${C.teal}`, background: C.white, color: C.teal, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Add Follow-up Reminder →
            </button>
          </div>
        </Card>

        {/* ── S9: DETAILED ANALYSIS ── */}
        {observations.length > 0 && (
          <Accordion title={`Leaf Observations (${observations.length})`} open={!!expanded["obs"]} onToggle={() => toggle("obs")}>
            {observations.map((t, i) => <BulletItem key={i} text={t} last={i === observations.length - 1} />)}
          </Accordion>
        )}
        {causes.length > 0 && (
          <Accordion title={`Root Causes (${causes.length})`} open={!!expanded["causes"]} onToggle={() => toggle("causes")}>
            {causes.map((t, i) => <BulletItem key={i} text={t} last={i === causes.length - 1} />)}
          </Accordion>
        )}
        {prevention.length > 0 && (
          <Accordion title={`Prevention Measures (${prevention.length})`} open={!!expanded["prev"]} onToggle={() => toggle("prev")}>
            {prevention.map((t, i) => <BulletItem key={i} text={t} last={i === prevention.length - 1} />)}
          </Accordion>
        )}
        {labTests.length > 0 && (
          <Accordion title={`Recommended Lab Tests (${labTests.length})`} open={!!expanded["labs"]} onToggle={() => toggle("labs")}>
            {labTests.map((t, i) => <BulletItem key={i} text={t} last={i === labTests.length - 1} />)}
          </Accordion>
        )}
        {seasonalCalendar.length > 0 && (
          <Accordion title="Seasonal Calendar" open={!!expanded["cal"]} onToggle={() => toggle("cal")}>
            {seasonalCalendar.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < seasonalCalendar.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.teal, minWidth: 80, flexShrink: 0 }}>{String(entry?.period ?? "—")}</span>
                <span style={{ fontSize: 13, color: C.dark, fontWeight: 300, lineHeight: 1.5 }}>{String(entry?.action ?? "—")}</span>
              </div>
            ))}
          </Accordion>
        )}
        <Accordion title="Report Metadata" open={!!expanded["meta"]} onToggle={() => toggle("meta")}>
          {[
            { k: "Report ID",       v: report.reportId ?? "—"   },
            { k: "Crop",            v: report.crop     ?? "—"   },
            { k: "Date",            v: date                      },
            ...(location  ? [{ k: "Location",  v: location  }] : []),
            ...(soilType  ? [{ k: "Soil Type", v: soilType  }] : []),
            { k: "Scientific Name", v: sciName                   },
          ].map((row, i, arr) => (
            <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: C.muted }}>{row.k}</span>
              <span style={{ fontSize: 13, color: C.dark, fontWeight: 400, textAlign: "right", maxWidth: "58%" }}>{row.v}</span>
            </div>
          ))}
        </Accordion>

        {/* ── PDF DOWNLOAD ── */}
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
          <button onClick={handleDownloadPdf} disabled={generating} style={{ ...primaryBtn, opacity: generating ? 0.7 : 1, cursor: generating ? "wait" : "pointer" }}>
            {generating ? "Generating PDF..." : "Download Full Report PDF"}
          </button>
          <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 10, fontWeight: 300, lineHeight: 1.6 }}>
            Issued by Truffaire Labs Diagnostic Engine. For advisory purposes only.
          </p>
        </div>

      </div>
    </div>
  );
  } catch (e) {
    console.error("Report render error:", e);
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.dark, fontFamily: "'DM Sans', sans-serif" }}>Report failed to render</div>;
  }
}

// ── Sub-components ───────────────────────────────────────────────
function Pill({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: bg, color: text, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Card({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, padding: "18px 16px", marginBottom: 10, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: C.teal, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 14, letterSpacing: "-0.01em" }}>{title}</div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight: "amber" | "teal" | "dark" }) {
  const colors = { amber: { bg: C.amberLight, val: C.amber }, teal: { bg: C.tealLight, val: C.teal }, dark: { bg: "#F0F2F2", val: C.dark } }[highlight];
  return (
    <div style={{ background: colors.bg, borderRadius: 12, padding: "14px 12px" }}>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: colors.val, letterSpacing: "-0.03em", marginBottom: 3, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 300 }}>{sub}</div>
    </div>
  );
}

function ContextPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 400, padding: "5px 12px", borderRadius: 100, background: C.tealLight, color: C.teal, border: "1px solid rgba(0,70,67,0.15)" }}>
      {icon} {label}
    </span>
  );
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, marginBottom: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "15px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

function BulletItem({ text, last }: { text: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: last ? "none" : `1px solid ${C.border}`, alignItems: "flex-start" }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.teal, flexShrink: 0, marginTop: 6 }} />
      <span style={{ fontSize: 13, fontWeight: 300, color: C.dark, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ── Leaf Annotation Diagram ──────────────────────────────────────
function LeafAnnotationDiagram({ annotation }: { annotation: Record<string, string> }) {
  const sevColor = (s: string) => {
    if (s === "severe")   return "#FEE2E2";
    if (s === "moderate") return "#FED7AA";
    if (s === "mild")     return "#FFF3CD";
    return "rgba(255,255,255,0.06)";
  };
  const sevText = (s: string) => {
    if (s === "severe")   return "#DC2626";
    if (s === "moderate") return "#D97706";
    if (s === "mild")     return "#CA8A04";
    return "#9CA3AF";
  };
  const leafPath = "M 100 12 C 138 30 160 78 162 138 C 160 208 138 266 100 305 C 62 266 40 208 38 138 C 40 78 62 30 100 12 Z";
  const midribColor = annotation.midrib && annotation.midrib !== "none"
    ? (annotation.midrib === "severe" ? "#FCA5A5" : annotation.midrib === "moderate" ? "#FCD34D" : "#FDE68A")
    : "rgba(255,255,255,0.15)";
  const zones = [
    { key: "tip",          label: "Leaf Tip" },
    { key: "margins",      label: "Margins" },
    { key: "upperSurface", label: "Upper Surface" },
    { key: "midrib",       label: "Midrib" },
    { key: "lowerSurface", label: "Lower Surface" },
    { key: "base",         label: "Base" },
  ];
  return (
    <div style={{ background: "#0C1618", borderRadius: 16, padding: "14px 14px", border: "1px solid #1E2E2C", height: "100%" }}>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
        Symptom Map
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flexShrink: 0 }}>
          <svg viewBox="0 0 200 318" width="88" height="140">
            <defs><clipPath id="leafClipR"><path d={leafPath} /></clipPath></defs>
            <path d={leafPath} fill="#1A2E2C" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <g clipPath="url(#leafClipR)">
              <rect x="0"   y="0"   width="200" height="52"  fill={sevColor(annotation.tip)}          opacity="0.85" />
              <rect x="0"   y="52"  width="48"  height="205" fill={sevColor(annotation.margins)}       opacity="0.85" />
              <rect x="152" y="52"  width="48"  height="205" fill={sevColor(annotation.margins)}       opacity="0.85" />
              <rect x="48"  y="52"  width="104" height="90"  fill={sevColor(annotation.upperSurface)}  opacity="0.85" />
              <rect x="48"  y="167" width="104" height="90"  fill={sevColor(annotation.lowerSurface)}  opacity="0.85" />
              <rect x="0"   y="257" width="200" height="60"  fill={sevColor(annotation.base)}          opacity="0.85" />
            </g>
            <path d={leafPath} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <line x1="100" y1="12" x2="100" y2="305" stroke={midribColor} strokeWidth={annotation.midrib && annotation.midrib !== "none" ? 3 : 1} clipPath="url(#leafClipR)" />
          </svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {zones.map(({ key, label }) => {
            const s = annotation[key] || "none";
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: s === "none" ? "rgba(255,255,255,0.06)" : sevColor(s), border: `1px solid ${s === "none" ? "rgba(255,255,255,0.12)" : sevColor(s)}` }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", flex: 1 }}>{label}</span>
                <span style={{ fontSize: 9, fontWeight: s !== "none" ? 600 : 300, color: sevText(s), textTransform: "capitalize" }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
      {annotation.description && (
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 10, fontWeight: 300, lineHeight: 1.5, marginBottom: 0 }}>
          {annotation.description}
        </p>
      )}
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const primaryBtn: React.CSSProperties = {
  width: "100%", padding: 16, borderRadius: 14,
  background: "#004643", color: "#FFFFFF",
  border: "none", fontFamily: "'DM Sans', sans-serif",
  fontSize: 15, fontWeight: 500, letterSpacing: "0.01em",
};
