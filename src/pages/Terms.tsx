import Navbar from "@/components/Navbar";

export default function Terms() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#004643", marginBottom: 12 }}>
          Legal
        </div>
        <h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 300, letterSpacing: "-0.03em", color: "#0C1618", margin: "0 0 8px" }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: "#AAAAAA", fontWeight: 300, margin: "0 0 48px" }}>
          Last updated: April 2026
        </p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By using TLS — Truffaire LeafScan, you agree to these terms. This service is provided by Truffaire Private Limited.",
          },
          {
            title: "2. Service Description",
            body: "TLS provides AI-powered leaf diagnosis reports for advisory purposes only. Reports are based on visual analysis of uploaded photographs and do not constitute certified laboratory testing or professional agronomist consultation.",
          },
          {
            title: "3. Credits and Payments",
            body: "Credits are purchased in advance and are non-refundable once a diagnosis has been generated. Each credit generates one complete diagnosis report.",
          },
          {
            title: "4. Disclaimer",
            body: "Truffaire Private Limited accepts no liability for crop losses or decisions made solely on the basis of TLS reports. For critical crop decisions, consult a licensed agronomist.",
          },
          {
            title: "5. Contact",
            body: "one@truffaire.in\nTruffaire Private Limited\nCIN: U01136KA2025PTC206761\nBengaluru, Karnataka, India",
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0C1618", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
              {section.title}
            </h2>
            <p style={{ fontSize: 14, fontWeight: 300, color: "#555555", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>
              {section.body}
            </p>
          </div>
        ))}

        <div style={{ borderTop: "1px solid #F5F5F5", paddingTop: 24, marginTop: 12 }}>
          <a href="/" style={{ fontSize: 13, color: "#004643", textDecoration: "none", fontWeight: 400 }}>← Back to home</a>
        </div>
      </div>
    </div>
  );
}
