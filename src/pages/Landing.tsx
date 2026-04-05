import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTLSAuth, useTLSClerk } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { CREDIT_PACKS } from "@/lib/constants";

// ── Responsive CSS injected once ──────────────────────────────
const LANDING_CSS = `
  /* ── Hero ── */
  .hero-section {
    min-height: 100svh;
    display: flex;
    align-items: center;
    padding: 100px var(--page-padding) 60px;
    background: white;
  }
  .hero-inner {
    display: flex;
    flex-direction: column;
    gap: 48px;
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;
  }
  .hero-text-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  .hero-h1-line1 {
    font-size: 36px;
    font-weight: 300;
    color: #0C1618;
    letter-spacing: -0.035em;
    line-height: 1.05;
    margin: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .hero-h1-line2 {
    font-size: 44px;
    font-weight: 700;
    color: #0C1618;
    letter-spacing: -0.035em;
    line-height: 1.05;
    margin: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .hero-h1-line3 {
    font-size: 36px;
    font-weight: 300;
    color: #004643;
    letter-spacing: -0.035em;
    line-height: 1.05;
    margin: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .hero-cta-btn {
    width: 100%;
    transition: all 0.2s !important;
    cursor: pointer;
  }
  .hero-cta-btn:hover {
    background: #0C1618 !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,70,67,0.3) !important;
  }
  .hero-image-col {
    width: 100%;
    flex-shrink: 0;
  }
  .hero-farm-img {
    border-radius: 24px;
    width: 100%;
    height: 300px;
    object-fit: cover;
    object-position: center;
    display: block;
  }
  .hero-trust-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Tablet+ */
  @media (min-width: 768px) {
    .hero-inner { flex-direction: row; align-items: center; }
    .hero-text-col { flex: 0 0 55%; }
    .hero-image-col { flex: 0 0 45%; }
    .hero-h1-line1 { font-size: 48px; }
    .hero-h1-line2 { font-size: 58px; }
    .hero-h1-line3 { font-size: 48px; }
    .hero-cta-btn { width: auto !important; }
    .hero-secondary { text-align: left !important; }
  }

  /* Laptop+ */
  @media (min-width: 1024px) {
    .hero-farm-img { height: 480px; }
  }

  /* Desktop */
  @media (min-width: 1440px) {
    .hero-h1-line1 { font-size: 56px; }
    .hero-h1-line2 { font-size: 72px; }
    .hero-h1-line3 { font-size: 56px; }
  }

  /* ── Section inner wrapper ── */
  .section-inner {
    max-width: var(--max-width);
    margin: 0 auto;
  }

  /* ── Proof strip ── */
  .proof-items {
    display: flex;
    align-items: center;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .proof-items::-webkit-scrollbar { display: none; }
  @media (min-width: 768px) {
    .proof-items { justify-content: center; }
  }

  /* ── Problem grid ── */
  .problem-grid {
    display: flex;
    flex-direction: column;
    gap: 40px;
    margin-top: 48px;
  }
  @media (min-width: 1024px) {
    .problem-grid { flex-direction: row; gap: 80px; align-items: flex-start; }
    .problem-stat { flex: 0 0 280px; }
    .problem-points { flex: 1; }
  }

  /* ── Steps ── */
  .steps-container {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-top: 40px;
    background: #E8E8E8;
    border-radius: 20px;
    overflow: hidden;
  }
  .step-card {
    background: white;
    padding: 22px 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    transition: background 0.15s;
  }
  .step-card:hover { background: #FAFAFA !important; }
  @media (min-width: 1024px) {
    .steps-container {
      flex-direction: row;
      gap: 16px;
      background: transparent;
      border-radius: 0;
      overflow: visible;
    }
    .step-card {
      flex: 1;
      border-radius: 20px;
      border: 1px solid #E8E8E8;
      flex-direction: column;
      padding: 28px 24px;
    }
  }

  /* ── What you get ── */
  .what-grid {
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-top: 40px;
  }
  .what-features { flex: 1; }
  .what-report-card { width: 100%; }
  @media (min-width: 1024px) {
    .what-grid { flex-direction: row; align-items: flex-start; gap: 60px; }
    .what-report-card { flex: 0 0 340px; }
  }

  /* ── Testimonials ── */
  .testimonials-grid {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) {
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
  }

  /* ── Crops ── */
  .crops-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 32px;
  }
  @media (min-width: 1024px) {
    .crops-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── Counters ── */
  .counters-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) {
    .counters-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── Pricing ── */
  .pricing-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) {
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
  }

  /* ── Hover states ── */
  .crop-pill:hover {
    background: #e8f0ef !important;
    border-color: #004643 !important;
    color: #004643 !important;
  }
  .pricing-btn:hover { opacity: 0.85; }
  .final-cta-btn {
    transition: all 0.2s !important;
    cursor: pointer;
  }
  .final-cta-btn:hover {
    background: #005c58 !important;
    transform: translateY(-1px);
  }
`;

export default function Landing() {
  const { isSignedIn } = useTLSAuth();
  const { openSignIn } = useTLSClerk();
  const navigate = useNavigate();
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = LANDING_CSS;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleScan = () => {
    if (isSignedIn) navigate("/scan");
    else openSignIn({ redirectUrl: "/scan" });
  };

  const handleBuy = () => {
    if (isSignedIn) navigate("/dashboard");
    else openSignIn({ redirectUrl: "/dashboard" });
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <Navbar />

      {/* ══════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-inner">

          {/* TEXT COLUMN */}
          <div className="hero-text-col">
            {/* Eyebrow pill */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "#e8f0ef", color: "#004643",
              fontSize: 11, fontWeight: 500, letterSpacing: "0.08em",
              padding: "6px 14px", borderRadius: 100, marginBottom: 24,
            }}>
              Truffaire Labs · Agriculture Expert Validated
            </div>

            {/* Headline */}
            <h1 style={{ margin: 0 }}>
              <div className="hero-h1-line1">Your crop has a problem.</div>
              <div className="hero-h1-line2">Here's exactly what to do.</div>
              <div className="hero-h1-line3">Find out why.</div>
            </h1>

            {/* Subheadline */}
            <p style={{
              fontSize: 16, fontWeight: 300, color: "#666666",
              maxWidth: 420, lineHeight: 1.7, marginTop: 20, marginBottom: 0,
            }}>
              Upload a leaf photo. Get a complete scientific diagnosis with
              treatment protocol, economic impact, and step-by-step action plan —
              in under 2 minutes.
            </p>

            {/* Urgency line */}
            <div style={{
              fontSize: 12, fontWeight: 400, color: "#991B1B",
              marginTop: 24, marginBottom: 12,
            }}>
              Every day without treatment = more crop loss
            </div>

            {/* Primary CTA */}
            <button
              onClick={handleScan}
              className="hero-cta-btn"
              style={{
                padding: "18px 40px",
                background: "#004643", color: "white",
                border: "none", borderRadius: 14,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 17, fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Diagnose My Crop
            </button>

            {/* Secondary line */}
            <div
              className="hero-secondary"
              style={{
                fontSize: 11, color: "#AAAAAA",
                textAlign: "center", marginTop: 10, width: "100%",
              }}
            >
              No password · No OTP · Sign in with Google
            </div>

            {/* Trust signals */}
            <div className="hero-trust-row" style={{ marginTop: 10 }}>
              <span style={{ fontSize: 11, color: "#AAAAAA" }}>🔒 Secure</span>
              <span style={{ fontSize: 11, color: "#CCCCCC" }}>·</span>
              <span style={{ fontSize: 11, color: "#AAAAAA" }}>📋 6-Page Report</span>
              <span style={{ fontSize: 11, color: "#CCCCCC" }}>·</span>
              <span style={{ fontSize: 11, color: "#AAAAAA" }}>⚡ 2 Minutes</span>
            </div>
          </div>

          {/* IMAGE COLUMN */}
          <div className="hero-image-col">
            <div style={{ position: "relative" }}>
              <img
                className="hero-farm-img"
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800"
                alt="Indian farmer in crop field"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800";
                }}
              />
              {/* Floating diagnosis card */}
              <div style={{
                position: "absolute", bottom: -20, left: -20,
                background: "white", borderRadius: 16,
                padding: "16px 20px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                width: 220,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0C1618", marginBottom: 8 }}>
                  Bacterial Blight
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{
                    background: "#FEE2E2", color: "#991B1B",
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
                  }}>Severe</span>
                  <span style={{
                    background: "#D1FAE5", color: "#065F46",
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
                  }}>High Confidence</span>
                </div>
                <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 700, marginBottom: 4 }}>
                  ₹28,000 at risk
                </div>
                <div style={{ fontSize: 11, color: "#666666" }}>
                  Act within 5 days
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 2 — PROOF STRIP
      ══════════════════════════════════════ */}
      <div style={{
        background: "#FAFAFA",
        borderTop: "1px solid #E8E8E8",
        borderBottom: "1px solid #E8E8E8",
        padding: "14px var(--page-padding)",
      }}>
        <div className="proof-items">
          {[
            "DPIIT Recognised Startup",
            "Truffaire Labs Certified",
            "Razorpay Secured Payments",
            "2,847+ Reports Generated",
            "Cross-referenced with peer-reviewed research",
          ].map((item, i) => (
            <span key={item} style={{ display: "inline-flex", alignItems: "center" }}>
              {i > 0 && (
                <span style={{ color: "#CCCCCC", margin: "0 12px", fontSize: 14 }}>·</span>
              )}
              <span style={{ fontSize: 11, color: "#666666", fontWeight: 400 }}>{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 3 — PROBLEM STATEMENT
      ══════════════════════════════════════ */}
      <section style={{ background: "#0C1618", padding: "72px var(--page-padding)" }}>
        <div className="section-inner">
          <div className="fade-up" style={secLbl}>THE PROBLEM</div>
          <h2 className="fade-up" style={{ ...secH2, color: "white" }}>
            Every year, farmers lose lakhs<br />
            <strong style={{ fontWeight: 600 }}>to preventable crop disease.</strong>
          </h2>

          <div className="problem-grid">
            <div className="problem-stat">
              <div style={{
                fontSize: "clamp(48px,8vw,72px)", fontWeight: 300, color: "white",
                letterSpacing: "-0.04em", lineHeight: 1,
              }}>
                ₹47,000
              </div>
              <div style={{
                fontSize: 14, color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6, marginTop: 12, maxWidth: 260,
              }}>
                Average annual crop loss per acre in Karnataka due to undiagnosed
                leaf conditions
              </div>
            </div>

            <div className="problem-points">
              {[
                {
                  n: "01",
                  title: "You notice the symptoms too late.",
                  body: "By the time leaves show damage, 30-40% of the crop is already affected.",
                },
                {
                  n: "02",
                  title: "You get generic advice.",
                  body: "Agriculture department officers serve thousands of farmers. Their advice is rarely specific to your field.",
                },
                {
                  n: "03",
                  title: "Treatment costs more than prevention.",
                  body: "A ₹209 diagnosis prevents a ₹30,000 loss. Most farmers skip it.",
                },
              ].map((pt, i) => (
                <div key={pt.n} style={{
                  paddingTop: i === 0 ? 0 : 20,
                  paddingBottom: 20,
                  borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}>
                  <div style={{
                    fontSize: 11, color: "#004643", fontWeight: 500,
                    letterSpacing: "0.1em", marginBottom: 6,
                  }}>
                    {pt.n}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 6 }}>
                    {pt.title}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    {pt.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ══════════════════════════════════════ */}
      <section style={{ background: "white", padding: "80px var(--page-padding)" }}>
        <div className="section-inner">
          <div className="fade-up" style={secLbl}>HOW IT WORKS</div>
          <h2 className="fade-up" style={secH2}>
            From photo to action plan.<br />
            <strong style={{ fontWeight: 600 }}>In two minutes.</strong>
          </h2>
          <div className="steps-container">
            {[
              {
                n: 1,
                title: "Upload 1-3 photos",
                desc: "Any device. Camera or gallery. Multiple angles improve accuracy.",
              },
              {
                n: 2,
                title: "Select crop + location + soil",
                desc: "Region, soil type, and weather are automatically factored into diagnosis.",
              },
              {
                n: 3,
                title: "Pay one credit",
                desc: "₹69–₹209 depending on pack. Diagnosis starts only after payment.",
              },
              {
                n: 4,
                title: "Get your action plan",
                desc: "Not just a diagnosis — a complete decision system with treatment timeline, economic impact, and follow-up guidance.",
              },
            ].map((step) => (
              <StepCard key={step.n} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 5 — WHAT YOU GET
      ══════════════════════════════════════ */}
      <section style={{ background: "#FAFAFA", padding: "80px var(--page-padding)" }}>
        <div className="section-inner">
          <div className="fade-up" style={secLbl}>WHAT YOU GET</div>
          <h2 className="fade-up" style={secH2}>
            More structured than a field inspection.<br />
            <strong style={{ fontWeight: 600 }}>Faster than a lab.</strong>
          </h2>

          <div className="what-grid">
            <div className="what-features">
              {[
                "Primary diagnosis with confidence score",
                "Economic impact — yield loss in rupees",
                "Treatment timeline — Day 0, Day 7, Day 15",
                "Symptom zone map — visual leaf annotation",
                "Seasonal action calendar",
                "NABL-recommended lab tests",
              ].map((feature) => (
                <div key={feature} style={{
                  display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#e8f0ef",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" stroke="#004643" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: "#0C1618" }}>{feature}</span>
                </div>
              ))}
            </div>

            <div className="what-report-card">
              <div style={{
                background: "white", border: "1px solid #E8E8E8",
                borderRadius: 20, padding: 24,
                boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
              }}>
                {([
                  { k: "DIAGNOSIS",  v: "Bacterial Blight",          pill: null                                    },
                  { k: "CONFIDENCE", v: "High (94%)",                 pill: null                                    },
                  { k: "SEVERITY",   v: null, pill: { t: "Moderate",          c: "amber" as const } },
                  { k: "URGENCY",    v: null, pill: { t: "Act within 5 days", c: "red"   as const } },
                  { k: "YIELD RISK", v: "25–35% loss",                pill: null                                    },
                  { k: "ECONOMIC",   v: "₹28,000 at risk per acre",   pill: null                                    },
                  { k: "TREATMENT",  v: "Copper oxychloride 3g/L",    pill: null                                    },
                  { k: "REPORT",     v: "6 Pages — Full Protocol",    pill: null                                    },
                ] as Array<{ k: string; v: string | null; pill: { t: string; c: "amber" | "red" } | null }>).map((row, i, arr) => (
                  <div key={row.k} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #E8E8E8" : "none",
                    gap: 10,
                  }}>
                    <div style={{
                      fontSize: 10, color: "#AAAAAA",
                      textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
                    }}>
                      {row.k}
                    </div>
                    {row.pill ? (
                      <span style={{
                        background: row.pill.c === "amber" ? "#FEF3C7" : "#FEE2E2",
                        color:      row.pill.c === "amber" ? "#92400E" : "#991B1B",
                        fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 100,
                      }}>
                        {row.pill.t}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#0C1618", textAlign: "right" }}>
                        {row.v}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <span style={{
                  display: "inline-block",
                  background: "#e8f0ef", color: "#004643",
                  padding: "8px 14px", borderRadius: 100,
                  fontSize: 12, fontWeight: 600,
                }}>
                  Typical saving per report: ₹5,000–₹30,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 6 — FARM IMAGE BREAK
      ══════════════════════════════════════ */}
      <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600"
          alt="Wide farm landscape"
          crossOrigin="anonymous"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600";
          }}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            position: "absolute", top: 0, left: 0,
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(12,22,24,0.5)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 var(--page-padding)", textAlign: "center",
        }}>
          <div style={{
            fontSize: "clamp(28px,6vw,48px)", fontWeight: 300,
            color: "white", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 6,
          }}>
            94% diagnosis accuracy.
          </div>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.5)",
            marginBottom: 14, fontStyle: "italic",
          }}>
            on tested conditions
          </div>
          <div style={{
            fontSize: 16, color: "rgba(255,255,255,0.7)",
            maxWidth: 500, lineHeight: 1.6,
          }}>
            Cross-referenced against peer-reviewed research from Frontiers in
            Plant Science and Karnataka field studies.
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 7 — TESTIMONIALS
      ══════════════════════════════════════ */}
      <section style={{ background: "white", padding: "80px var(--page-padding)" }}>
        <div className="section-inner">
          <div className="fade-up" style={secLbl}>WHAT FARMERS SAY</div>
          <h2 className="fade-up" style={secH2}>
            Trusted across<br />
            <strong style={{ fontWeight: 600 }}>India's farms.</strong>
          </h2>
          <div className="testimonials-grid">
            {[
              {
                quote: "I diagnosed my pomegranate crop in 2 minutes. The report was more detailed than anything the agriculture department gave me.",
                name: "Balachandra", role: "Pomegranate Farmer",
                location: "Chitradurga, Karnataka", initial: "B",
              },
              {
                quote: "As an agronomist managing 400 farmers, TLS saves me hours every week. The PDF report gives my farmers something they can hold and follow.",
                name: "Dr. Ajay", role: "Agricultural Consultant",
                location: "Solapur, Maharashtra", initial: "A",
              },
              {
                quote: "The diagnosis was spot on. Ginger leaf curl identified correctly. Treatment worked within 10 days.",
                name: "Manjunath", role: "Ginger Farmer",
                location: "Mysuru, Karnataka", initial: "M",
              },
            ].map((t) => (
              <div key={t.name} style={{
                background: "#FAFAFA", border: "1px solid #E8E8E8",
                borderRadius: 20, padding: 24,
              }}>
                <p style={{ fontSize: 14, color: "#333333", lineHeight: 1.7, margin: "0 0 16px" }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "#004643", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                  }}>
                    {t.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0C1618" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#AAAAAA", marginTop: 1 }}>
                      {t.role} · {t.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 8 — CROP COVERAGE
      ══════════════════════════════════════ */}
      <section style={{ background: "#FAFAFA", padding: "80px var(--page-padding)" }}>
        <div className="section-inner">
          <div className="fade-up" style={secLbl}>CROP COVERAGE</div>
          <h2 className="fade-up" style={secH2}>
            Across major crops<br />
            <strong style={{ fontWeight: 600 }}>grown in India.</strong>
          </h2>
          <p className="fade-up" style={secP}>
            From pomegranate to cotton, rice to coffee — TLS diagnoses the crops
            that matter to Indian farmers.
          </p>
          <div className="crops-grid">
            {[
              "Pomegranate","Rice","Tomato","Cotton","Coffee",
              "Mango","Wheat","Chilli","Coconut","Grapes","Sugarcane",
            ].map((c) => (
              <div key={c} className="crop-pill" style={{
                background: "white", border: "1px solid #E8E8E8",
                borderRadius: 10, padding: "12px 8px",
                textAlign: "center", fontSize: 12, fontWeight: 400,
                color: "#333333", cursor: "default", transition: "all 0.15s",
              }}>
                {c}
              </div>
            ))}
            <div style={{
              background: "#0C1618", color: "white",
              borderRadius: 10, padding: "12px 8px",
              textAlign: "center", fontSize: 11, fontWeight: 400,
            }}>
              + Any crop
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 9 — BY THE NUMBERS
      ══════════════════════════════════════ */}
      <section style={{ background: "white", padding: "80px var(--page-padding)" }}>
        <div className="section-inner">
          <div className="fade-up" style={secLbl}>BY THE NUMBERS</div>
          <h2 className="fade-up" style={secH2}>
            Built for real farms,<br />
            <strong style={{ fontWeight: 600 }}>not laboratories.</strong>
          </h2>
          <div className="counters-grid">
            <Counter target={2847} label="Reports Generated"  suffix="+" />
            <Counter target={1293} label="Farmers Helped"     suffix="+" />
            <Counter
              target={94} label="Diagnosis Accuracy" suffix="%"
              subtext="on tested conditions"
            />
            <Counter target={2}    label="Average Per Report" suffix=" min" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 10 — PRICING
      ══════════════════════════════════════ */}
      <section style={{ background: "#FAFAFA", padding: "80px var(--page-padding)" }}>
        <div className="section-inner">
          <div className="fade-up" style={secLbl}>PRICING</div>
          <h2 className="fade-up" style={secH2}>
            Pay only for<br />
            <strong style={{ fontWeight: 600 }}>what you use.</strong>
          </h2>
          <p className="fade-up" style={secP}>
            No subscriptions. No sharing. Each credit is one complete diagnosis
            with economic impact and action plan.
          </p>
          <div className="fade-up" style={{ marginTop: 24, textAlign: "center" }}>
            <span style={{
              display: "inline-block",
              background: "#e8f0ef", color: "#004643",
              padding: "8px 20px", borderRadius: 100,
              fontSize: 13, fontWeight: 600,
            }}>
              Typical saving per report: ₹5,000–₹30,000
            </span>
          </div>
          <div className="pricing-grid">
            {CREDIT_PACKS.map((pack, i) => {
              const savings = ["₹5,000–₹15,000", "₹15,000–₹60,000", "₹40,000–₹1,50,000"][i];
              return (
                <PricingCard key={pack.id} pack={pack} onBuy={handleBuy} savings={savings} />
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 11 — FINAL CTA
      ══════════════════════════════════════ */}
      <section style={{
        position: "relative", background: "#0C1618",
        padding: "80px var(--page-padding)",
        textAlign: "center", overflow: "hidden",
      }}>
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200"
          alt=""
          crossOrigin="anonymous"
          aria-hidden
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            opacity: 0.15,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", marginBottom: 14,
          }}>
            START TODAY
          </div>
          <h2 style={{
            fontSize: "clamp(32px,6vw,52px)", fontWeight: 300,
            letterSpacing: "-0.03em", color: "white", lineHeight: 1.1,
            maxWidth: 560, margin: "0 auto",
          }}>
            Don't let one disease<br />
            <strong style={{ fontWeight: 700 }}>cost you the season.</strong>
          </h2>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.6)",
            lineHeight: 1.65, maxWidth: 440, margin: "18px auto 0",
          }}>
            ₹209 for a complete diagnosis. Farmers who act early save an
            average of ₹25,000 per acre per season.
          </p>
          <div style={{ marginTop: 32 }}>
            <button
              onClick={handleScan}
              className="final-cta-btn"
              style={{
                padding: "18px 40px",
                background: "#004643", color: "white",
                border: "none", borderRadius: 14,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em",
              }}
            >
              Diagnose My Crop
            </button>
          </div>
          <div style={{
            marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.3)",
          }}>
            Sign in with Google · No password · No OTP
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 12 — FOOTER
      ══════════════════════════════════════ */}
      <div style={{
        padding: "16px var(--page-padding)",
        background: "#FAFAFA", borderTop: "1px solid #F5F5F5",
      }}>
        <p style={{
          fontSize: 10, color: "#AAAAAA", fontWeight: 300,
          lineHeight: 1.65, textAlign: "center", maxWidth: 700, margin: "0 auto",
        }}>
          TLS reports are issued by Truffaire Labs Diagnostic Engine for advisory
          purposes only. Results are based on visual leaf analysis and do not substitute
          certified laboratory testing or professional agronomist consultation for critical
          crop decisions. Truffaire Private Limited accepts no liability for decisions made
          solely on the basis of this report.
        </p>
      </div>

      <footer style={{ padding: "44px var(--page-padding) 36px", borderTop: "1px solid #F5F5F5" }}>
        <div style={{ maxWidth: "var(--max-width)", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 32, height: 32, background: "#004643",
              borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                   stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3C9 3 6.5 6.5 6.5 11c0 3.5 2 6.5 5.5 8.5 3.5-2 5.5-5 5.5-8.5C17.5 6.5 15 3 12 3z"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              TLS{" "}
              <span style={{ color: "#AAAAAA", fontWeight: 300 }}>— Truffaire LeafScan</span>
            </div>
          </div>
          <p style={{
            fontSize: 13, fontWeight: 300, color: "#AAAAAA",
            lineHeight: 1.65, maxWidth: 360, marginBottom: 24,
          }}>
            A Truffaire Labs product. Precision leaf diagnosis for every crop,
            every farm on earth.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 28 }}>
            {["Privacy Policy","Terms of Service","Refund Policy","truffaire.in"].map((l) => (
              <a key={l} href="#" style={{
                fontSize: 12, color: "#AAAAAA", textDecoration: "none", fontWeight: 400,
              }}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #F5F5F5", paddingTop: 18, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300 }}>
              Truffaire Private Limited · CIN: U01136KA2025PTC206761 · Bengaluru, Karnataka, India
            </div>
            <div style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300 }}>
              one@truffaire.in · tls.truffaire.in
            </div>
            <div style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300, marginTop: 4 }}>
              © 2026 Truffaire Private Limited. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Counter ────────────────────────────────────────────────────
function Counter({
  target, label, suffix, subtext,
}: {
  target: number;
  label: string;
  suffix: string;
  subtext?: string;
}) {
  const ref        = useRef<HTMLDivElement>(null);
  const animRef    = useRef<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const duration = 2000;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = Math.round(eased * target);
        const numEl    = el.querySelector(".counter-num");
        if (numEl) numEl.textContent = current + suffix;
        if (progress < 1) animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) run(); }),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [target, suffix]);

  return (
    <div ref={ref} style={{ background: "#FAFAFA", borderRadius: 16, padding: "22px 18px" }}>
      <div className="counter-num" style={{
        fontSize: 36, fontWeight: 300, letterSpacing: "-0.035em",
        lineHeight: 1, color: "#0C1618",
      }}>
        0{suffix}
      </div>
      <div style={{ fontSize: 11, fontWeight: 300, color: "#AAAAAA", marginTop: 6 }}>
        {label}
      </div>
      {subtext && (
        <div style={{ fontSize: 10, fontWeight: 300, color: "#CCCCCC", marginTop: 2, fontStyle: "italic" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

// ── Step card ──────────────────────────────────────────────────
function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div
      className="step-card"
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
    >
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "#004643", color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0C1618" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#666666", lineHeight: 1.6, marginTop: 4 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Pricing card ───────────────────────────────────────────────
function PricingCard({
  pack, onBuy, savings,
}: {
  pack: typeof CREDIT_PACKS[number];
  onBuy: () => void;
  savings: string;
}) {
  const dark = pack.popular;
  return (
    <div style={{
      border: `1px solid ${dark ? "#0C1618" : "#E8E8E8"}`,
      borderRadius: 20, padding: 24,
      background: dark ? "#0C1618" : "white",
      position: "relative",
    }}>
      {dark && (
        <div style={{
          position: "absolute", top: 20, right: 20,
          background: "#004643", color: "white",
          fontSize: 9, fontWeight: 600,
          padding: "4px 10px", borderRadius: 100,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          Most Popular
        </div>
      )}
      <div style={{
        fontSize: 10, fontWeight: 500,
        textTransform: "uppercase", letterSpacing: "0.09em",
        color: dark ? "rgba(255,255,255,0.3)" : "#AAAAAA",
        marginBottom: 10,
      }}>
        {pack.name}
      </div>
      <div style={{
        fontSize: 40, fontWeight: 300,
        letterSpacing: "-0.04em",
        color: dark ? "white" : "#0C1618", lineHeight: 1,
      }}>
        <sup style={{ fontSize: 17, fontWeight: 400, verticalAlign: "super" }}>₹</sup>
        {pack.price}
      </div>
      <div style={{
        fontSize: 12, color: dark ? "rgba(255,255,255,0.3)" : "#AAAAAA",
        marginTop: 5, fontWeight: 300,
      }}>
        {pack.credits} reports — ₹{pack.perReport} per report
      </div>
      <div style={{
        height: 1,
        background: dark ? "rgba(255,255,255,0.08)" : "#F5F5F5",
        margin: "18px 0",
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {pack.features.map((f) => (
          <div key={f} style={{
            display: "flex", alignItems: "center", gap: 9,
            fontSize: 13, fontWeight: 300,
            color: dark ? "rgba(255,255,255,0.5)" : "#666666",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              background: dark ? "rgba(255,255,255,0.09)" : "#e8f0ef",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <polyline
                  points="2,6 5,9 10,3"
                  stroke={dark ? "rgba(255,255,255,0.65)" : "#004643"}
                  strokeWidth="2.5" strokeLinecap="round"
                />
              </svg>
            </div>
            {f}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 14, fontSize: 11, fontWeight: 500,
        color: dark ? "rgba(255,255,255,0.35)" : "#004643",
      }}>
        Est. prevents {savings} in crop loss
      </div>
      <button
        onClick={onBuy}
        className="pricing-btn"
        style={{
          width: "100%", marginTop: 16, padding: 14, borderRadius: 12,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, fontWeight: 500,
          cursor: "pointer", letterSpacing: "0.01em",
          background: dark ? "white" : "transparent",
          color: "#0C1618",
          border: dark ? "none" : "1.5px solid #E8E8E8",
          transition: "opacity 0.18s",
        }}
      >
        Buy {pack.name}
      </button>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const secLbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "#004643", marginBottom: 14,
};
const secH2: React.CSSProperties = {
  fontSize: "clamp(26px, 6vw, 42px)", fontWeight: 300,
  letterSpacing: "-0.025em", lineHeight: 1.1,
  maxWidth: 520, margin: 0,
};
const secP: React.CSSProperties = {
  fontSize: 15, fontWeight: 300, color: "#666666",
  lineHeight: 1.7, maxWidth: 450, marginTop: 13,
};
