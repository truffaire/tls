import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { pdf } from "@react-pdf/renderer";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import TLSReportPDF from "@/components/TLSReportPDF";

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const report = useQuery(api.diagnose.getReport, { reportId: id ?? "" });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (report !== undefined) {
      console.log("REPORT DATA:", report);
    }
  }, [report]);

  if (report === undefined) {
    return (
      <div style={loadingScreenStyle}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={emptyScreenStyle}>
        <div style={{ fontSize: 14, color: "#FFFFFF" }}>Loading report...</div>
        <button onClick={() => navigate("/dashboard")} style={backBtnStyle}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!report || !report.diagnosis) {
    return <div style={invalidScreenStyle}>Invalid report data</div>;
  }

  const diagnosis =
    report.diagnosis && typeof report.diagnosis === "object"
      ? (report.diagnosis as Record<string, unknown>)
      : {};

  const treatmentItems = (() => {
    const value = diagnosis.treatment;
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object",
    );
  })();

  const observations = Array.isArray(diagnosis.observations) ? diagnosis.observations : [];
  const causes = Array.isArray(diagnosis.causes) ? diagnosis.causes : [];
  const prevention = Array.isArray(diagnosis.prevention) ? diagnosis.prevention : [];
  const labTests = Array.isArray(diagnosis.labTests) ? diagnosis.labTests : [];
  const seasonalCalendar = Array.isArray(diagnosis.seasonalCalendar)
    ? diagnosis.seasonalCalendar
    : [];

  const weatherDisplay = diagnosis.weatherData && typeof diagnosis.weatherData === "object"
    ? (diagnosis.weatherData as any)
    : null;

  const leafAnnotation = diagnosis.leafAnnotation && typeof diagnosis.leafAnnotation === "object"
    ? (diagnosis.leafAnnotation as Record<string, string>)
    : null;

  const date = report?.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const handleDownloadPdf = async () => {
    if (!report || !report.diagnosis) return;

    try {
      setGenerating(true);
      const blob = await pdf(<TLSReportPDF report={report} />).toBlob();
      const url = URL.createObjectURL(blob);

      // iOS Safari — open in new tab so user can use native share/save
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = `${report.reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke after delay
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setGenerating(false);
    }
  };

  try {
    return (
      <div style={{ background: "#000000", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "80px 28px 48px", maxWidth: 560, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/history")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#FFFFFF",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 13,
              marginBottom: 20,
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Reports
          </button>

          <div
            style={{
              background: "#0C1618",
              borderRadius: 20,
              padding: "22px 20px",
              marginBottom: 12,
              border: "1px solid #004643",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Truffaire Labs
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "monospace",
                    marginTop: 2,
                  }}
                >
                  {report.reportId}
                </div>
              </div>
              <div
                style={{
                  background: "#004643",
                  color: "#FFFFFF",
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 100,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                Certified
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { k: "Crop",     v: report.crop     || "—" },
                ...((report as any).location ? [{ k: "Location", v: (report as any).location as string }] : []),
                ...((report as any).soilType ? [{ k: "Soil Type", v: (report as any).soilType as string }] : []),
                { k: "Date",     v: date },
              ].map((row) => (
                <div key={row.k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.45)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {row.k}
                  </span>
                  <span style={{ fontSize: 12, color: "#FFFFFF", fontWeight: 500 }}>
                    {row.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Section title="Diagnosis">
            <ReportRow k="Primary" v={String(report?.diagnosis?.primary || "Not available")} />
            <ReportRow k="Secondary" v={String(report?.diagnosis?.secondary || "None")} />
            <ReportRow
              k="Contributing"
              v={String(report?.diagnosis?.contributing || "None")}
            />
            <ReportRow
              k="Severity"
              v={<SeverityPill s={String(report?.diagnosis?.severity || "Unknown")} />}
            />
            <ReportRow
              k="Confidence"
              v={<ConfidencePill c={String(report?.diagnosis?.confidence || "Moderate")} />}
            />
            <ReportRow
              k="Urgency"
              v={<UrgencyPill u={String(report?.diagnosis?.urgency || "Not available")} />}
              last
            />
          </Section>

          {/* ── ECONOMIC RISK ── */}
          {diagnosis.economicImpact && typeof diagnosis.economicImpact === "object" && (
            <div style={{
              background: "#FEF3C7", borderLeft: "3px solid #92400E",
              borderRadius: "0 10px 10px 0", padding: "14px 16px", marginBottom: 10,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Economic Risk
              </div>
              <p style={{ fontSize: 13, fontWeight: 300, color: "#0C1618", lineHeight: 1.65, margin: 0 }}>
                Left untreated, this condition can reduce yield by{" "}
                <strong style={{ fontWeight: 600 }}>{String((diagnosis.economicImpact as any).yieldLossPercent ?? "varies")}%</strong>.{" "}
                {String((diagnosis.economicImpact as any).description ?? "Act promptly to protect your harvest.")}
              </p>
            </div>
          )}

          {/* ── LEAF ANNOTATION DIAGRAM ── */}
          {leafAnnotation && (
            <LeafAnnotationDiagram annotation={leafAnnotation} />
          )}

          <Section title="Leaf Observations">
            {observations.length > 0 ? (
              observations.map((obs: string, i: number) => (
                <BulletItem key={i} text={obs} last={i === observations.length - 1} />
              ))
            ) : (
              <BulletItem text="Not available" last />
            )}
          </Section>

          <Section title="Causes">
            {causes.length > 0 ? (
              causes.map((cause: string, i: number) => (
                <BulletItem key={i} text={cause} last={i === causes.length - 1} />
              ))
            ) : (
              <BulletItem text="Not available" last />
            )}
          </Section>

          <Section title="Treatment Protocol">
            {treatmentItems.length > 0 ? (
              treatmentItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    paddingBottom: i < treatmentItems.length - 1 ? 14 : 0,
                    marginBottom: i < treatmentItems.length - 1 ? 14 : 0,
                    borderBottom:
                      i < treatmentItems.length - 1 ? "1px solid #004643" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#FFFFFF" }}>
                      {String(item.treatment ?? "Not available")}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        background: "#004643",
                        color: "#FFFFFF",
                        padding: "2px 8px",
                        borderRadius: 100,
                        fontWeight: 500,
                      }}
                    >
                      {String(item.priority ?? "Advisory")}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#FFFFFF", marginBottom: 3 }}>
                    <strong style={{ color: "#FFFFFF" }}>Product:</strong>{" "}
                    {String(item.product ?? "Not available")}
                  </div>
                  <div style={{ fontSize: 12, color: "#FFFFFF" }}>
                    <strong style={{ color: "#FFFFFF" }}>Method:</strong>{" "}
                    {String(item.method ?? "Not available")}
                  </div>
                </div>
              ))
            ) : (
              <BulletItem text={String(report?.diagnosis?.treatment || "Not available")} last />
            )}
          </Section>

          <Section title="Prevention">
            {prevention.length > 0 ? (
              prevention.map((item: string, i: number) => (
                <BulletItem key={i} text={item} last={i === prevention.length - 1} />
              ))
            ) : (
              <BulletItem text="Not available" last />
            )}
          </Section>

          <Section title="Recommended Lab Tests">
            {labTests.length > 0 ? (
              labTests.map((item: string, i: number) => (
                <BulletItem key={i} text={item} last={i === labTests.length - 1} />
              ))
            ) : (
              <BulletItem text="Not available" last />
            )}
          </Section>

          {seasonalCalendar.length > 0 && (
            <Section title="Seasonal Calendar">
              {seasonalCalendar.map((entry: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom:
                      i < seasonalCalendar.length - 1 ? "1px solid #004643" : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      minWidth: 80,
                      flexShrink: 0,
                    }}
                  >
                    {String(entry?.period ?? "Not available")}
                  </span>
                  <span style={{ fontSize: 12, color: "#FFFFFF", fontWeight: 300 }}>
                    {String(entry?.action ?? "Not available")}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* ── WEATHER ── */}
          {weatherDisplay && (
            <Section title="Environmental Conditions">
              {[
                { k: "Temperature",    v: `${weatherDisplay.temp}°C` },
                { k: "Humidity",       v: `${weatherDisplay.humidity}%` },
                { k: "Conditions",     v: String(weatherDisplay.description) },
                { k: "Rainfall (1h)",  v: `${weatherDisplay.rainfall}mm` },
              ].map((row, i, arr) => (
                <ReportRow key={row.k} k={row.k} v={row.v} last={i === arr.length - 1} />
              ))}
            </Section>
          )}

          <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid #004643" }}>
            <button
              onClick={handleDownloadPdf}
              disabled={generating}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 14,
                background: "#004643",
                color: "#FFFFFF",
                border: "none",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 15,
                fontWeight: 500,
                cursor: generating ? "wait" : "pointer",
                letterSpacing: "0.01em",
                opacity: generating ? 0.8 : 1,
              }}
            >
              {generating ? "Generating PDF..." : "Download Report PDF"}
            </button>

            <p
              style={{
                fontSize: 10,
                color: "#FFFFFF",
                textAlign: "center",
                marginTop: 12,
                fontWeight: 300,
                lineHeight: 1.6,
              }}
            >
              This report is issued by Truffaire Labs Diagnostic Engine for advisory purposes
              only. It does not substitute certified agronomist consultation.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    console.error("REPORT CRASH:", e);
    return <div style={invalidScreenStyle}>Report failed to render</div>;
  }
}

// ── Leaf Annotation Diagram ───────────────────────────────────
function LeafAnnotationDiagram({ annotation }: { annotation: Record<string, string> }) {
  const sevColor = (s: string) => {
    if (s === "severe")   return "#FEE2E2";
    if (s === "moderate") return "#FED7AA";
    if (s === "mild")     return "#FFF3CD";
    return "#1E2E2C"; // dark teal-grey for "none" on dark background
  };
  const sevTextColor = (s: string) => {
    if (s === "severe")   return "#FCA5A5";
    if (s === "moderate") return "#FCD34D";
    if (s === "mild")     return "#FDE68A";
    return "#444";
  };
  const leafPath = "M 100 12 C 138 30 160 78 162 138 C 160 208 138 266 100 305 C 62 266 40 208 38 138 C 40 78 62 30 100 12 Z";
  const midribColor = annotation.midrib !== "none"
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
    <div style={{ background: "#0C1618", borderRadius: 16, padding: "18px 16px", marginBottom: 10, border: "1px solid #004643" }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#FFFFFF", marginBottom: 14 }}>
        Symptom Location Map
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* SVG Leaf */}
        <div style={{ flexShrink: 0 }}>
          <svg viewBox="0 0 200 318" width="100" height="159">
            <defs>
              <clipPath id="leafClipReport">
                <path d={leafPath} />
              </clipPath>
            </defs>
            {/* Leaf background */}
            <path d={leafPath} fill="#1A2E2C" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            {/* Zone overlays */}
            <g clipPath="url(#leafClipReport)">
              {/* Tip */}
              <rect x="0" y="0"   width="200" height="52"  fill={sevColor(annotation.tip)} opacity="0.85" />
              {/* Left margin */}
              <rect x="0" y="52"  width="48"  height="205" fill={sevColor(annotation.margins)} opacity="0.85" />
              {/* Right margin */}
              <rect x="152" y="52" width="48" height="205" fill={sevColor(annotation.margins)} opacity="0.85" />
              {/* Upper surface */}
              <rect x="48" y="52"  width="104" height="90"  fill={sevColor(annotation.upperSurface)} opacity="0.85" />
              {/* Lower surface */}
              <rect x="48" y="167" width="104" height="90"  fill={sevColor(annotation.lowerSurface)} opacity="0.85" />
              {/* Base */}
              <rect x="0"  y="257" width="200" height="60"  fill={sevColor(annotation.base)} opacity="0.85" />
            </g>
            {/* Leaf outline on top */}
            <path d={leafPath} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            {/* Midrib */}
            <line x1="100" y1="12" x2="100" y2="305"
              stroke={midribColor}
              strokeWidth={annotation.midrib !== "none" ? 3 : 1}
              clipPath="url(#leafClipReport)"
            />
          </svg>
        </div>

        {/* Zone list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, paddingTop: 2 }}>
          {zones.map(({ key, label }) => {
            const s = annotation[key] || "none";
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 9, height: 9, borderRadius: 2, flexShrink: 0,
                  background: s === "none" ? "rgba(255,255,255,0.08)" : sevColor(s),
                  border: `1px solid ${s === "none" ? "rgba(255,255,255,0.15)" : sevColor(s)}`,
                }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", flex: 1 }}>{label}</span>
                <span style={{ fontSize: 10, fontWeight: s !== "none" ? 600 : 300, color: sevTextColor(s), textTransform: "capitalize" }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        {[
          { label: "None",     bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)" },
          { label: "Mild",     bg: "#FFF3CD",                border: "#FDE68A" },
          { label: "Moderate", bg: "#FED7AA",                border: "#FCD34D" },
          { label: "Severe",   bg: "#FEE2E2",                border: "#FCA5A5" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.bg, border: `1px solid ${item.border}` }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {annotation.description && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 12, fontWeight: 300, lineHeight: 1.6, margin: "12px 0 0" }}>
          {annotation.description}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#0C1618",
        borderRadius: 16,
        padding: "18px 16px",
        marginBottom: 10,
        border: "1px solid #004643",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#FFFFFF",
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ReportRow({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: last ? "none" : "1px solid #004643",
        gap: 10,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#FFFFFF",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}
      >
        {k}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", color: "#FFFFFF" }}>
        {v}
      </span>
    </div>
  );
}

function BulletItem({ text, last }: { text: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "8px 0",
        borderBottom: last ? "none" : "1px solid #004643",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#FFFFFF",
          flexShrink: 0,
          marginTop: 5,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 300, color: "#FFFFFF", lineHeight: 1.6 }}>
        {text}
      </span>
    </div>
  );
}

function ConfidencePill({ c }: { c: string }) {
  const styles: Record<string, { background: string; color: string }> = {
    High:     { background: "#D1FAE5", color: "#065F46" },
    Moderate: { background: "#FEF3C7", color: "#92400E" },
    Low:      { background: "#FEE2E2", color: "#991B1B" },
  };
  const s = styles[c] ?? styles["Moderate"];
  return (
    <span style={{ ...s, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 100 }}>
      {c}
    </span>
  );
}

function SeverityPill({ s }: { s: string }) {
  return (
    <span
      style={{
        background: "#004643",
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 100,
      }}
    >
      {s}
    </span>
  );
}

function UrgencyPill({ u }: { u: string }) {
  return (
    <span
      style={{
        background: "#004643",
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 100,
      }}
    >
      {u}
    </span>
  );
}

const loadingScreenStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#000000",
};

const spinnerStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  border: "2px solid #FFFFFF",
  borderTopColor: "#004643",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const emptyScreenStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 12,
  background: "#000000",
};

const invalidScreenStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#000000",
  color: "#FFFFFF",
  fontFamily: "'DM Sans',sans-serif",
};

const backBtnStyle: React.CSSProperties = {
  background: "#004643",
  color: "#FFFFFF",
  border: "none",
  borderRadius: 100,
  padding: "10px 20px",
  fontFamily: "'DM Sans',sans-serif",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
