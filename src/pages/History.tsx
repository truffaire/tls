import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import { useTLSUser } from "@/lib/auth";

export default function History() {
  const { user }  = useTLSUser();
  const navigate  = useNavigate();
  const reports   = useQuery(api.diagnose.getUserReports, { userId: user?.id ?? "" });

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "80px 28px 48px", maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#AAAAAA", fontFamily: "'DM Sans',sans-serif", fontSize: 13, marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#004643", marginBottom: 8 }}>
            History
          </div>
          <h1 style={{ fontSize: "clamp(24px,6vw,34px)", fontWeight: 300, letterSpacing: "-0.025em" }}>
            Your <strong style={{ fontWeight: 600 }}>reports</strong>
          </h1>
        </div>

        {/* Loading */}
        {reports === undefined && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: 20, height: 20, border: "2px solid #e8f0ef", borderTopColor: "#004643", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Empty state */}
        {reports?.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 48, height: 48, background: "#FAFAFA", borderRadius: 12, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No reports yet</div>
            <div style={{ fontSize: 13, color: "#AAAAAA", fontWeight: 300, marginBottom: 20 }}>
              Upload a leaf photo to generate your first diagnosis report.
            </div>
            <button
              onClick={() => navigate("/scan")}
              style={{ background: "#004643", color: "white", border: "none", borderRadius: 100, padding: "10px 24px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              Start a scan
            </button>
          </div>
        )}

        {/* Reports list */}
        {reports && reports.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reports.map((report: any) => {
              const date = new Date(report.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              });
              const sev = report.diagnosis?.severity;
              const sevColor = sev === "Severe" ? "#991B1B" : sev === "Moderate" ? "#92400E" : "#166534";
              const sevBg    = sev === "Severe" ? "#FEE2E2" : sev === "Moderate" ? "#FFF3CD" : "#DCFCE7";

              return (
                <div
                  key={report._id}
                  onClick={() => navigate(`/report/${report.reportId}`)}
                  style={{
                    border: "1px solid #E8E8E8", borderRadius: 16,
                    padding: "16px 18px", cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#004643";
                    (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#E8E8E8";
                    (e.currentTarget as HTMLDivElement).style.background = "white";
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#0C1618" }}>
                        {report.diagnosis?.primary}
                      </span>
                      {sev && (
                        <span style={{ background: sevBg, color: sevColor, fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 100, flexShrink: 0 }}>
                          {sev}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#AAAAAA", fontWeight: 300 }}>
                      {report.crop} · {date}
                    </div>
                    <div style={{ fontSize: 10, color: "#CCCCCC", fontFamily: "monospace", marginTop: 4 }}>
                      {report.reportId}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              );
            })}
          </div>
        )}

        {/* New scan CTA */}
        {reports && reports.length > 0 && (
          <button
            onClick={() => navigate("/scan")}
            style={{
              width: "100%", marginTop: 20, padding: 14, borderRadius: 14,
              background: "#004643", color: "white", border: "none",
              fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            New Scan
          </button>
        )}
      </div>
    </div>
  );
}
