import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// ── Palette ────────────────────────────────────────────────────
const C = {
  dark:    "#0C1618",
  teal:    "#004643",
  tealBg:  "#E8F0EF",
  white:   "#FFFFFF",
  offWhite:"#F8F9F9",
  border:  "#E2E8E8",
  muted:   "#6B7B7B",
  amber:   "#92400E",
  amberBg: "#FEF3C7",
  red:     "#991B1B",
  redBg:   "#FEE2E2",
  green:   "#065F46",
  greenBg: "#D1FAE5",
};

const S = StyleSheet.create({
  // ── Pages ──
  pageCover: {
    backgroundColor: C.dark,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontFamily: "Helvetica",
    position: "relative",
  },
  page: {
    backgroundColor: C.white,
    paddingTop: 0,
    paddingBottom: 44,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
  },

  // ── Page header band ──
  pageHeaderBand: {
    backgroundColor: C.dark,
    paddingHorizontal: 40,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  pageHeaderBrandText: {
    color: C.white,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  pageHeaderMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
  },

  // ── Page body padding ──
  body: {
    paddingHorizontal: 40,
  },

  // ── Page footer ──
  pageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageFooterText: {
    fontSize: 7.5,
    color: C.muted,
  },

  // ── Section heading ──
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 18,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },

  // ── Cover page styles ──
  coverTopBar: {
    paddingHorizontal: 48,
    paddingTop: 52,
    paddingBottom: 0,
  },
  coverBrand: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 3,
    marginBottom: 8,
  },
  coverDividerLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 72,
  },
  coverCrop: {
    fontSize: 44,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    lineHeight: 1.1,
    marginBottom: 10,
    paddingHorizontal: 48,
  },
  coverSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 48,
    marginBottom: 52,
  },
  coverMetaBlock: {
    paddingHorizontal: 48,
    marginBottom: 40,
  },
  coverMetaRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  coverMetaLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.4,
    width: 90,
    fontFamily: "Helvetica-Bold",
  },
  coverMetaValue: {
    fontSize: 9,
    color: "rgba(255,255,255,0.75)",
  },
  coverReportId: {
    paddingHorizontal: 48,
    marginBottom: 16,
  },
  coverReportIdText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 0.5,
  },
  coverSeverityRow: {
    paddingHorizontal: 48,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  coverBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 48,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverBottomLeft: {
    fontSize: 8,
    color: "rgba(255,255,255,0.3)",
  },
  coverBottomRight: {
    fontSize: 8,
    color: "rgba(255,255,255,0.3)",
  },

  // ── Severity badge ──
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },

  // ── Diagnosis summary ──
  diagPrimaryBox: {
    backgroundColor: C.offWhite,
    borderLeftWidth: 3,
    borderLeftColor: C.teal,
    padding: 16,
    marginBottom: 16,
  },
  diagPrimaryLabel: {
    fontSize: 8,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  diagPrimaryText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    lineHeight: 1.2,
  },
  diagGrid: {
    flexDirection: "row",
    marginBottom: 16,
  },
  diagGridCell: {
    flex: 1,
    backgroundColor: C.offWhite,
    padding: 12,
    marginRight: 8,
  },
  diagGridCellLast: {
    marginRight: 0,
  },
  diagGridLabel: {
    fontSize: 7.5,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginBottom: 5,
  },
  diagGridValue: {
    fontSize: 9.5,
    color: C.dark,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.3,
  },
  diagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  diagRowLast: {
    borderBottomWidth: 0,
  },
  diagRowKey: {
    fontSize: 8.5,
    color: C.muted,
    width: "38%",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  diagRowVal: {
    fontSize: 9,
    color: C.dark,
    width: "62%",
    textAlign: "right",
    lineHeight: 1.4,
  },
  diagRowValItalic: {
    fontSize: 9,
    color: C.dark,
    width: "62%",
    textAlign: "right",
    fontFamily: "Helvetica-Oblique",
    lineHeight: 1.4,
  },

  // ── Observations / bullets ──
  numberedItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  numberedBadge: {
    width: 20,
    height: 20,
    backgroundColor: C.teal,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
    marginTop: 1,
  },
  numberedBadgeText: {
    fontSize: 8,
    color: C.white,
    fontFamily: "Helvetica-Bold",
  },
  numberedText: {
    flex: 1,
    fontSize: 9,
    color: C.dark,
    lineHeight: 1.5,
    paddingTop: 3,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 7,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 5,
    height: 5,
    backgroundColor: C.teal,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 5,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: C.dark,
    lineHeight: 1.5,
  },

  // ── Treatment cards ──
  treatCard: {
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    padding: 14,
  },
  treatCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  treatName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    flex: 1,
    lineHeight: 1.3,
    marginRight: 8,
  },
  treatFieldRow: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "flex-start",
  },
  treatFieldLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    width: 60,
    letterSpacing: 0.3,
    paddingTop: 1,
  },
  treatFieldValue: {
    fontSize: 8.5,
    color: C.dark,
    flex: 1,
    lineHeight: 1.45,
  },

  // ── Seasonal calendar ──
  calTableHeader: {
    flexDirection: "row",
    backgroundColor: C.dark,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 1,
  },
  calRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  calRowAlt: {
    backgroundColor: C.offWhite,
  },
  calCellPeriod: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    width: "30%",
    lineHeight: 1.4,
  },
  calCellAction: {
    fontSize: 8.5,
    color: C.dark,
    width: "70%",
    lineHeight: 1.4,
  },

  // ── Company info block ──
  companyBox: {
    backgroundColor: C.dark,
    padding: 14,
    marginTop: 4,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 5,
  },
  companyLine: {
    fontSize: 8,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 2,
    lineHeight: 1.4,
  },

  // ── Disclaimer ──
  disclaimerBox: {
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    marginBottom: 10,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  disclaimerText: {
    fontSize: 7,
    color: C.muted,
    lineHeight: 1.5,
  },

  // ── Verification box ──
  verifyBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.teal,
    padding: 10,
    marginBottom: 10,
  },
  verifyLeft: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  verifyLine: {
    fontSize: 8,
    color: C.dark,
    lineHeight: 1.6,
  },

  // ── Spacer ──
  spacer8:  { height: 8 },
  spacer16: { height: 16 },
  spacer24: { height: 24 },
  spacer32: { height: 32 },

  // ── Leaf annotation table ──
  annotHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  annotRow: {
    flexDirection: "row" as const,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8E8",
  },
  annotCellZone: {
    fontSize: 9,
    color: "#0C1618",
    width: "35%",
  },
  annotCellSev: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0C1618",
    width: "25%",
    textTransform: "capitalize" as const,
  },
});

// ── Types ──────────────────────────────────────────────────────
type TreatmentItem = {
  priority?: unknown;
  treatment?: unknown;
  product?: unknown;
  method?: unknown;
};
type CalItem = { period?: unknown; action?: unknown };

type ReportLike = {
  reportId?: string;
  crop?: string;
  location?: string;
  soilType?: string;
  imageUrl?: string;
  createdAt?: number;
  diagnosis?: Record<string, unknown> | null;
};

// ── Helper: severity colors ─────────────────────────────────────
function severityColors(s: string): { bg: string; text: string } {
  const v = s?.toLowerCase();
  if (v === "severe")   return { bg: C.redBg,   text: C.red   };
  if (v === "mild")     return { bg: C.greenBg,  text: C.green };
  return                       { bg: C.amberBg,  text: C.amber };
}

// ── Helper: priority colors ─────────────────────────────────────
function priorityColors(p: string): { bg: string; text: string } {
  const v = p?.toLowerCase();
  if (v === "immediate") return { bg: C.redBg,   text: C.red   };
  if (v === "short-term" || v === "short term") return { bg: C.amberBg, text: C.amber };
  return { bg: C.tealBg, text: C.teal };
}

// ── Weather section for page 5 ─────────────────────────────────
function WeatherSection({ wd }: { wd: { temp?: number; humidity?: number; description?: string; rainfall?: number } | null }) {
  if (!wd) return null;
  const rows = [
    { label: "Temperature",   value: `${wd.temp ?? "—"}°C` },
    { label: "Humidity",      value: `${wd.humidity ?? "—"}%` },
    { label: "Conditions",    value: String(wd.description ?? "—") },
    { label: "Rainfall (1h)", value: `${wd.rainfall ?? 0}mm` },
  ];
  return (
    <>
      <View style={S.divider} />
      <View style={S.spacer8} />
      <Text style={S.sectionLabel}>Environmental Conditions</Text>
      <Text style={S.sectionTitle}>Weather at Farm Location</Text>
      {rows.map((row, i) => (
        <View key={row.label} style={i === rows.length - 1 ? { ...S.diagRow, ...S.diagRowLast } : S.diagRow}>
          <Text style={S.diagRowKey}>{row.label}</Text>
          <Text style={S.diagRowVal}>{row.value}</Text>
        </View>
      ))}
    </>
  );
}

// ── Severity bar for leaf annotation table ─────────────────────
function SeverityBar({ severity }: { severity: string }) {
  const total = 8;
  const filled = severity === "severe" ? 8 : severity === "moderate" ? 6 : severity === "mild" ? 4 : 0;
  const color  = severity === "severe" ? C.red : severity === "moderate" ? C.amber : severity === "mild" ? C.green : C.border;
  return (
    <View style={{ flexDirection: "row" }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ width: 7, height: 7, backgroundColor: i < filled ? color : C.border, marginRight: 1 }} />
      ))}
    </View>
  );
}

// ── Shared: page header band ────────────────────────────────────
function PageHeader({ reportId, page }: { reportId: string; page: string }) {
  return (
    <View style={S.pageHeaderBand} fixed>
      <Text style={S.pageHeaderBrandText}>TRUFFAIRE LABS</Text>
      <Text style={S.pageHeaderMeta}>{reportId}  ·  {page}</Text>
    </View>
  );
}

// ── Shared: page footer ─────────────────────────────────────────
function PageFooter({ reportId, page }: { reportId: string; page: string }) {
  return (
    <View style={S.pageFooter} fixed>
      <Text style={S.pageFooterText}>Truffaire Labs  ·  {reportId}</Text>
      <Text style={S.pageFooterText}>{page} of 6</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function TLSReportPDF({ report }: { report: ReportLike }) {
  const diagnosis =
    report?.diagnosis && typeof report.diagnosis === "object"
      ? report.diagnosis
      : {};

  const observations = (Array.isArray(diagnosis.observations)
    ? diagnosis.observations.filter((i): i is string => typeof i === "string")
    : []).slice(0, 4);
  const causes = (Array.isArray(diagnosis.causes)
    ? diagnosis.causes.filter((i): i is string => typeof i === "string")
    : []).slice(0, 4);
  const prevention = (Array.isArray(diagnosis.prevention)
    ? diagnosis.prevention.filter((i): i is string => typeof i === "string")
    : []).slice(0, 5);
  const labTests = (Array.isArray(diagnosis.labTests)
    ? diagnosis.labTests.filter((i): i is string => typeof i === "string")
    : []).slice(0, 4);
  const seasonalCalendar = (Array.isArray(diagnosis.seasonalCalendar)
    ? diagnosis.seasonalCalendar.filter((i): i is CalItem => !!i && typeof i === "object")
    : []).slice(0, 8);
  const treatments = Array.isArray(diagnosis.treatment)
    ? diagnosis.treatment.filter((i): i is TreatmentItem => !!i && typeof i === "object")
    : [];

  const reportId    = report?.reportId ?? "TLS-UNKNOWN";
  const crop        = String(report?.crop     ?? "Unknown Crop");
  const location = report?.location  ? String(report.location)  : null;
  const soilType = report?.soilType  ? String(report.soilType)  : null;
  const primary  = String(diagnosis.primary     ?? "Not available");
  const secondary   = diagnosis.secondary   ? String(diagnosis.secondary)   : null;
  const contributing = diagnosis.contributing ? String(diagnosis.contributing) : null;
  const severity   = String(diagnosis.severity   ?? "Moderate");
  const confidence = String(diagnosis.confidence ?? "Moderate");
  const urgency    = String(diagnosis.urgency    ?? "Act within 7 days");
  const sciName    = String(diagnosis.scientificName ?? crop);
  const econImpact = diagnosis.economicImpact && typeof diagnosis.economicImpact === "object"
    ? diagnosis.economicImpact as { yieldLossPercent?: string; description?: string }
    : null;
  const weatherData = diagnosis.weatherData && typeof diagnosis.weatherData === "object"
    ? diagnosis.weatherData as { temp?: number; humidity?: number; description?: string; rainfall?: number }
    : null;
  const leafAnnotation = diagnosis.leafAnnotation && typeof diagnosis.leafAnnotation === "object"
    ? diagnosis.leafAnnotation as Record<string, string>
    : null;

  const date = report?.createdAt
    ? new Date(report.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  const sevColors = severityColors(severity);

  return (
    <Document title={`TLS Report — ${crop} — ${reportId}`} author="Truffaire Labs">

      {/* ══════════════ PAGE 1 — COVER ══════════════ */}
      <Page size="A4" style={S.pageCover}>

        <View style={S.coverTopBar}>
          <Text style={S.coverBrand}>TRUFFAIRE LABS</Text>
          <View style={S.coverDividerLine} />
        </View>

        <Text style={S.coverCrop}>{crop}</Text>
        <Text style={S.coverSubtitle}>TLS Leaf Diagnosis Report</Text>

        {report?.imageUrl && report.imageUrl.startsWith("data:image/") && (
          <View style={{ paddingHorizontal: 48, marginBottom: 28, flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
            <Image src={report.imageUrl} style={{ width: 88, height: 88 }} />
            <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.28)", paddingBottom: 4 }}>
              Submitted leaf sample
            </Text>
          </View>
        )}

        <View style={S.coverMetaBlock}>
          <View style={S.coverMetaRow}>
            <Text style={S.coverMetaLabel}>REPORT ID</Text>
            <Text style={S.coverMetaValue}>{reportId}</Text>
          </View>
          <View style={S.coverMetaRow}>
            <Text style={S.coverMetaLabel}>DATE</Text>
            <Text style={S.coverMetaValue}>{date}</Text>
          </View>
          {location && (
            <View style={S.coverMetaRow}>
              <Text style={S.coverMetaLabel}>LOCATION</Text>
              <Text style={S.coverMetaValue}>{location}</Text>
            </View>
          )}
          {soilType && (
            <View style={S.coverMetaRow}>
              <Text style={S.coverMetaLabel}>SOIL TYPE</Text>
              <Text style={S.coverMetaValue}>{soilType}</Text>
            </View>
          )}
          <View style={S.coverMetaRow}>
            <Text style={S.coverMetaLabel}>DIAGNOSIS</Text>
            <Text style={S.coverMetaValue}>{primary}</Text>
          </View>
          <View style={{ ...S.coverMetaRow, marginTop: 8 }}>
            <Text style={S.coverMetaLabel}>SEVERITY</Text>
            <View style={{ ...S.badge, backgroundColor: sevColors.bg }}>
              <Text style={{ ...S.badgeText, color: sevColors.text }}>{severity.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 48, marginBottom: 0 }} />

        <View style={S.coverBottomBar}>
          <Text style={S.coverBottomLeft}>tls.truffaire.in</Text>
          <Text style={S.coverBottomRight}>Issued by Truffaire Labs Diagnostic Engine</Text>
        </View>

      </Page>

      {/* ══════════════ PAGE 2 — DIAGNOSIS SUMMARY ══════════════ */}
      <Page size="A4" style={S.page}>
        <PageHeader reportId={reportId} page="Page 2" />

        <View style={S.body}>
          <Text style={S.sectionLabel}>Diagnosis Summary</Text>
          <Text style={S.sectionTitle}>Clinical Findings</Text>

          {/* Primary diagnosis box */}
          <View style={S.diagPrimaryBox}>
            <Text style={S.diagPrimaryLabel}>PRIMARY DIAGNOSIS</Text>
            <Text style={S.diagPrimaryText}>{primary}</Text>
          </View>

          {/* Severity / Urgency / Crop / Confidence grid */}
          <View style={S.diagGrid}>
            <View style={{ ...S.diagGridCell }}>
              <Text style={S.diagGridLabel}>SEVERITY</Text>
              <View style={{ ...S.badge, backgroundColor: sevColors.bg, alignSelf: "flex-start" }}>
                <Text style={{ ...S.badgeText, color: sevColors.text }}>{severity.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ ...S.diagGridCell }}>
              <Text style={S.diagGridLabel}>URGENCY</Text>
              <Text style={S.diagGridValue}>{urgency}</Text>
            </View>
            <View style={{ ...S.diagGridCell }}>
              <Text style={S.diagGridLabel}>CROP</Text>
              <Text style={S.diagGridValue}>{crop}</Text>
            </View>
            <View style={{ ...S.diagGridCell, ...S.diagGridCellLast }}>
              <Text style={S.diagGridLabel}>CONFIDENCE</Text>
              <Text style={S.diagGridValue}>{confidence}</Text>
            </View>
          </View>

          {/* Economic Impact */}
          {econImpact && (
            <View style={{ backgroundColor: C.amberBg, borderLeftWidth: 3, borderLeftColor: C.amber, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.amber, letterSpacing: 1.2, marginBottom: 5 }}>ECONOMIC RISK</Text>
              <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5 }}>
                Left untreated, this condition can reduce yield by {String(econImpact.yieldLossPercent ?? "varies").replace(/%/g, "")}%. {econImpact.description ?? ""}
              </Text>
            </View>
          )}

          {/* Remaining fields */}
          <View>
            {secondary && (
              <View style={S.diagRow}>
                <Text style={S.diagRowKey}>Secondary Condition</Text>
                <Text style={S.diagRowVal}>{secondary}</Text>
              </View>
            )}
            {contributing && (
              <View style={S.diagRow}>
                <Text style={S.diagRowKey}>Contributing Factor</Text>
                <Text style={S.diagRowVal}>{contributing}</Text>
              </View>
            )}
            <View style={S.diagRow}>
              <Text style={S.diagRowKey}>Scientific Name</Text>
              <Text style={S.diagRowValItalic}>{sciName}</Text>
            </View>
            <View style={S.diagRow}>
              <Text style={S.diagRowKey}>Report Date</Text>
              <Text style={S.diagRowVal}>{date}</Text>
            </View>
            {location && (
              <View style={S.diagRow}>
                <Text style={S.diagRowKey}>Farm Location</Text>
                <Text style={S.diagRowVal}>{location}</Text>
              </View>
            )}
            {soilType && (
              <View style={S.diagRow}>
                <Text style={S.diagRowKey}>Soil Type</Text>
                <Text style={S.diagRowVal}>{soilType}</Text>
              </View>
            )}
            <View style={{ ...S.diagRow, ...S.diagRowLast }}>
              <Text style={S.diagRowKey}>Report ID</Text>
              <Text style={S.diagRowVal}>{reportId}</Text>
            </View>
          </View>

          <View style={S.spacer24} />

          {/* Notice */}
          <View style={{ backgroundColor: C.tealBg, padding: 12 }}>
            <Text style={{ fontSize: 8, color: C.teal, lineHeight: 1.6 }}>
              This diagnosis is based on visual leaf analysis using the Truffaire Labs
              Diagnostic Engine. Results reflect the Primary Diagnosis derived from
              the submitted photographic evidence. Confirm with field scouting.
            </Text>
          </View>
        </View>

        <PageFooter reportId={reportId} page="2" />
      </Page>

      {/* ══════════════ PAGE 3 — OBSERVATIONS & CAUSES ══════════════ */}
      <Page size="A4" style={S.page}>
        <PageHeader reportId={reportId} page="Page 3" />

        <View style={S.body}>
          {/* Observations */}
          <Text style={S.sectionLabel}>Field Analysis</Text>
          <Text style={S.sectionTitle}>Leaf Observations</Text>

          {observations.length > 0
            ? observations.map((obs, i) => (
                <View key={i} style={S.numberedItem}>
                  <View style={S.numberedBadge}>
                    <Text style={S.numberedBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={S.numberedText}>{obs}</Text>
                </View>
              ))
            : <Text style={{ fontSize: 9, color: C.muted }}>No observations recorded.</Text>
          }

          {/* Leaf Annotation Zone Table */}
          {leafAnnotation && (
            <>
              <View style={S.divider} />
              <View style={S.spacer8} />
              <Text style={S.sectionLabel}>Symptom Mapping</Text>
              <Text style={S.sectionTitle}>Symptom Location Map</Text>

              {/* Table header */}
              <View style={{ flexDirection: "row", backgroundColor: C.dark, paddingHorizontal: 10, paddingVertical: 7 }}>
                <Text style={{ ...S.annotHeader, width: "35%" }}>ZONE</Text>
                <Text style={{ ...S.annotHeader, width: "25%" }}>SEVERITY</Text>
                <Text style={{ ...S.annotHeader, width: "40%" }}>VISUAL</Text>
              </View>

              {[
                { key: "tip",          label: "Leaf Tip" },
                { key: "margins",      label: "Margins" },
                { key: "upperSurface", label: "Upper Surface" },
                { key: "lowerSurface", label: "Lower Surface" },
                { key: "midrib",       label: "Midrib" },
                { key: "base",         label: "Base" },
              ].map((zone, i) => {
                const sev = (leafAnnotation[zone.key] || "none").toLowerCase();
                return (
                  <View key={zone.key} style={{ ...S.annotRow, backgroundColor: i % 2 === 0 ? C.white : C.offWhite }}>
                    <Text style={S.annotCellZone}>{zone.label}</Text>
                    <Text style={S.annotCellSev}>{sev.charAt(0).toUpperCase() + sev.slice(1)}</Text>
                    <View style={{ width: "40%", flexDirection: "row", alignItems: "center" }}>
                      <SeverityBar severity={sev} />
                    </View>
                  </View>
                );
              })}

              {leafAnnotation.description && (
                <View style={{ backgroundColor: C.offWhite, padding: 10, marginTop: 8 }}>
                  <Text style={{ fontSize: 8.5, color: C.muted, lineHeight: 1.5 }}>{leafAnnotation.description}</Text>
                </View>
              )}
            </>
          )}

          <View style={S.divider} />
          <View style={S.spacer8} />

          {/* Causes */}
          <Text style={S.sectionLabel}>Aetiology</Text>
          <Text style={S.sectionTitle}>Root Causes</Text>

          {causes.length > 0
            ? causes.map((cause, i) => (
                <View key={i} style={S.numberedItem}>
                  <View style={S.numberedBadge}>
                    <Text style={S.numberedBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={S.numberedText}>{cause}</Text>
                </View>
              ))
            : <Text style={{ fontSize: 9, color: C.muted }}>No causes recorded.</Text>
          }
        </View>

        <PageFooter reportId={reportId} page="3" />
      </Page>

      {/* ══════════════ PAGE 4 — TREATMENT PROTOCOL ══════════════ */}
      <Page size="A4" style={S.page}>
        <PageHeader reportId={reportId} page="Page 4" />

        <View style={S.body}>
          <Text style={S.sectionLabel}>Intervention</Text>
          <Text style={S.sectionTitle}>Treatment Protocol</Text>

          {treatments.length > 0
            ? treatments.map((item, i) => {
                const priority = String(item.priority ?? "Advisory");
                const pColors  = priorityColors(priority);
                return (
                  <View key={i} style={S.treatCard}>
                    <View style={S.treatCardHeader}>
                      <Text style={S.treatName}>{String(item.treatment ?? "Treatment")}</Text>
                      <View style={{ ...S.badge, backgroundColor: pColors.bg, flexShrink: 0 }}>
                        <Text style={{ ...S.badgeText, color: pColors.text }}>{priority.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={S.treatFieldRow}>
                      <Text style={S.treatFieldLabel}>PRODUCT</Text>
                      <Text style={S.treatFieldValue}>{String(item.product ?? "—")}</Text>
                    </View>
                    <View style={{ ...S.treatFieldRow, marginBottom: 0 }}>
                      <Text style={S.treatFieldLabel}>METHOD</Text>
                      <Text style={S.treatFieldValue}>{String(item.method ?? "—")}</Text>
                    </View>
                  </View>
                );
              })
            : <Text style={{ fontSize: 9, color: C.muted }}>No treatment protocol recorded.</Text>
          }

          <View style={S.spacer16} />
          <View style={{ backgroundColor: C.offWhite, padding: 12 }}>
            <Text style={{ fontSize: 7.5, color: C.muted, lineHeight: 1.6 }}>
              Always follow label instructions and local regulatory guidelines when
              applying agrochemicals. Consult a licensed agronomist before use on
              certified organic or export-quality crops.
            </Text>
          </View>
        </View>

        <PageFooter reportId={reportId} page="4" />
      </Page>

      {/* ══════════════ PAGE 5 — PREVENTION & LAB TESTS ══════════════ */}
      <Page size="A4" style={S.page}>
        <PageHeader reportId={reportId} page="Page 5" />

        <View style={S.body}>
          {/* Prevention */}
          <Text style={S.sectionLabel}>Agronomic Guidance</Text>
          <Text style={S.sectionTitle}>Prevention Measures</Text>

          {prevention.length > 0
            ? prevention.map((item, i) => (
                <View key={i} style={S.bulletItem}>
                  <View style={S.bulletDot} />
                  <Text style={S.bulletText}>{item}</Text>
                </View>
              ))
            : <Text style={{ fontSize: 9, color: C.muted }}>No prevention measures recorded.</Text>
          }

          <WeatherSection wd={weatherData} />

          <View style={S.divider} />
          <View style={S.spacer8} />

          {/* Lab Tests */}
          <Text style={S.sectionLabel}>Laboratory</Text>
          <Text style={S.sectionTitle}>Recommended Lab Tests</Text>

          {labTests.length > 0
            ? labTests.map((item, i) => (
                <View key={i} style={S.numberedItem}>
                  <View style={S.numberedBadge}>
                    <Text style={S.numberedBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={S.numberedText}>{item}</Text>
                </View>
              ))
            : <Text style={{ fontSize: 9, color: C.muted }}>No lab tests recommended.</Text>
          }

          <View style={S.spacer24} />
          <View style={{ backgroundColor: C.offWhite, padding: 12 }}>
            <Text style={{ fontSize: 7.5, color: C.muted, lineHeight: 1.6 }}>
              Laboratory confirmation is strongly recommended before undertaking
              large-scale corrective measures. Contact a NABL-accredited lab for
              certified soil and tissue analysis.
            </Text>
          </View>
        </View>

        <PageFooter reportId={reportId} page="5" />
      </Page>

      {/* ══════════════ PAGE 6 — SEASONAL CALENDAR + FOOTER ══════════════ */}
      <Page size="A4" style={S.page}>
        <PageHeader reportId={reportId} page="Page 6" />

        <View style={S.body}>
          <Text style={S.sectionLabel}>Crop Calendar</Text>
          <Text style={S.sectionTitle}>Seasonal Action Plan</Text>

          {/* Table header */}
          <View style={S.calTableHeader}>
            <Text style={{ ...S.calHeaderCell, width: "30%" }}>PERIOD / SEASON</Text>
            <Text style={{ ...S.calHeaderCell, width: "70%" }}>RECOMMENDED ACTION</Text>
          </View>

          {seasonalCalendar.length > 0
            ? seasonalCalendar.map((item, i) => (
                <View key={i} style={i % 2 === 1
                  ? { ...S.calRow, ...S.calRowAlt }
                  : S.calRow
                }>
                  <Text style={S.calCellPeriod}>{String(item.period ?? "—")}</Text>
                  <Text style={S.calCellAction}>{String(item.action ?? "—")}</Text>
                </View>
              ))
            : (
              <View style={S.calRow}>
                <Text style={{ fontSize: 9, color: C.muted }}>No seasonal calendar available.</Text>
              </View>
            )
          }

          <View style={S.spacer16} />

          {/* Verification */}
          <View style={S.verifyBox}>
            <View style={S.verifyLeft}>
              <Text style={S.verifyTitle}>REPORT VERIFICATION</Text>
              <Text style={S.verifyLine}>Report ID: {reportId}</Text>
              <Text style={S.verifyLine}>Issued: {date}</Text>
              <Text style={S.verifyLine}>Crop: {crop}</Text>
              <Text style={S.verifyLine}>Engine: Truffaire Labs Diagnostic Engine v2</Text>
            </View>
          </View>

          {/* Company block */}
          <View style={S.companyBox}>
            <Text style={S.companyName}>Truffaire Private Limited</Text>
            <Text style={S.companyLine}>CIN: U01136KA2025PTC206761</Text>
            <Text style={S.companyLine}>Bengaluru, Karnataka, India</Text>
            <Text style={S.companyLine}>one@truffaire.in  ·  tls.truffaire.in</Text>
          </View>

          {/* Disclaimer */}
          <View style={S.disclaimerBox}>
            <Text style={S.disclaimerTitle}>LEGAL DISCLAIMER</Text>
            <Text style={S.disclaimerText}>
              This report is issued by the Truffaire Labs Diagnostic Engine for advisory
              purposes only. It is based on visual analysis of the submitted leaf photograph
              and does not constitute certified laboratory testing or professional agronomist
              consultation. Results should be confirmed through field scouting and, where
              necessary, laboratory analysis before any corrective treatment is applied.
              Truffaire Private Limited accepts no liability for crop losses or decisions
              made solely on the basis of this report. For critical crop decisions, consult
              a licensed agronomist.
            </Text>
          </View>

        </View>

        <PageFooter reportId={reportId} page="6" />
      </Page>

    </Document>
  );
}
