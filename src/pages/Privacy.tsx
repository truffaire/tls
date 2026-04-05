import Navbar from "@/components/Navbar";

export default function Privacy() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#004643", marginBottom: 12 }}>
          Legal
        </div>
        <h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 300, letterSpacing: "-0.03em", color: "#0C1618", margin: "0 0 8px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "#AAAAAA", fontWeight: 300, margin: "0 0 48px" }}>
          Last updated: April 2026
        </p>

        {[
          {
            title: "1. Information We Collect",
            body: "We collect your name, email address (via Google OAuth), uploaded leaf photographs, and diagnosis history. Leaf photographs are used solely for diagnosis and are not stored permanently after report generation.",
          },
          {
            title: "2. How We Use Your Information",
            body: "Your information is used to generate diagnosis reports, maintain your account, process payments via Razorpay, and improve our diagnostic engine.",
          },
          {
            title: "3. Data Security",
            body: "All data is encrypted in transit and at rest. We use Convex for secure data storage and Clerk for authentication. We never sell your personal data to third parties.",
          },
          {
            title: "4. Payments",
            body: "Payments are processed by Razorpay. We do not store your payment card details.",
          },
          {
            title: "5. Contact",
            body: "For privacy concerns contact: one@truffaire.in\nTruffaire Private Limited\nCIN: U01136KA2025PTC206761\nBengaluru, Karnataka, India",
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
