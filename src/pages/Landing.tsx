import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTLSAuth, useTLSClerk } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { CREDIT_PACKS, ENTERPRISE_PLAN } from "@/lib/constants";

// ── Responsive CSS injected once ─────────────────────────────────
const GLOBAL_CSS = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }
  .fade-up {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-up.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .crop-pill:hover {
    background: #e8f0ef !important;
    border-color: #004643 !important;
    color: #004643 !important;
  }

  /* CTA button */
  .cta-btn {
    display: inline-block;
    padding: 18px 48px;
    background: #004643;
    color: white;
    border: none;
    border-radius: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 17px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: all 0.2s;
    text-align: center;
  }
  .cta-btn:hover {
    background: #0C1618;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,70,67,0.25);
  }

  /* ── Hero ── */
  .hero-outer {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 80px;
    padding-bottom: 60px;
    padding-left: var(--page-padding);
    padding-right: var(--page-padding);
    text-align: center;
    background: #ffffff;
  }

  /* ── Footer link hover ── */
  .footer-link:hover { color: #0C1618 !important; }

  /* ── Section padding ── */
  .sp { padding: 60px 20px; }
  .sp-dark { padding: 72px 20px; }
  @media (min-width: 768px)  { .sp { padding: 80px 40px; }  .sp-dark { padding: 80px 40px; } }
  @media (min-width: 1024px) { .sp { padding: 80px 60px; }  .sp-dark { padding: 80px 60px; } }
  @media (min-width: 1440px) { .sp { padding: 96px 80px; }  .sp-dark { padding: 96px 80px; } }
  .si { max-width: 1200px; margin: 0 auto; }

  /* ── Proof strip ── */
  .proof-strip {
    background: #FAFAFA;
    border-top: 1px solid #E8E8E8;
    border-bottom: 1px solid #E8E8E8;
    padding: 14px 20px;
    overflow-x: auto;
  }
  .proof-row {
    display: flex;
    align-items: center;
    gap: 0;
    white-space: nowrap;
    min-width: max-content;
  }
  @media (min-width: 768px) {
    .proof-strip { padding: 14px 40px; }
    .proof-row { justify-content: center; margin: 0 auto; }
  }

  /* ── Problem section ── */
  .problem-grid {
    display: flex;
    flex-direction: column;
    gap: 48px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) {
    .problem-grid { flex-direction: row; gap: 80px; align-items: flex-start; }
    .problem-stat { flex: 0 0 38%; }
    .problem-points { flex: 1; }
  }

  /* ── Steps ── */
  .steps-grid {
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-top: 40px;
  }
  .step-item { flex: 1; }
  .step-arrow { display: none; align-items: center; padding-top: 14px; color: #CCCCCC; font-size: 22px; flex-shrink: 0; }
  @media (min-width: 768px) {
    .steps-grid { flex-direction: row; gap: 0; align-items: flex-start; }
    .step-item { text-align: center; padding: 0 16px; }
    .step-arrow { display: flex; }
  }

  /* ── What you get ── */
  .wyg-grid {
    display: flex;
    flex-direction: column;
    gap: 40px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) {
    .wyg-grid { flex-direction: row; gap: 64px; align-items: flex-start; }
    .wyg-left { flex: 1; }
    .wyg-right { flex: 1; }
  }

  /* ── Testimonials ── */
  .testi-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) {
    .testi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  }

  /* ── Crops ── */
  .crops-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 32px;
  }
  @media (min-width: 768px)  { .crops-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1024px) { .crops-grid { grid-template-columns: repeat(4, 1fr); } }

  /* ── Stats ── */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) { .stats-grid { grid-template-columns: 1fr 1fr 1fr 1fr; } }

  /* ── Pricing ── */
  .pricing-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 40px;
  }
  @media (min-width: 1024px) { .pricing-cards { flex-direction: row; align-items: stretch; } }
  .pricing-card { flex: 1; }

  /* ── Misc ── */
  .pricing-buy-btn:hover { opacity: 0.85; }
`;

const PREVENTS: Record<string, string> = {
  scout:      "₹5,000–₹15,000",
  advisor:    "₹15,000–₹60,000",
  agronomist: "₹40,000–₹1,50,000",
  extension:  "₹1,50,000+",
};

export default function Landing() {
  const { isSignedIn } = useTLSAuth();
  const { openSignIn } = useTLSClerk();
  const navigate       = useNavigate();
  const styleInjected  = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.07 }
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

      {/* ══════════════════════════════════════════════
          S1 — HERO
      ══════════════════════════════════════════════ */}
      <div className="hero-outer">
        {/* Eyebrow */}
        <div style={{ display: "inline-block", background: "#e8f0ef", color: "#004643", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 16px", borderRadius: 100, marginBottom: 32 }}>
          Truffaire Labs · Agriculture Expert Validated
        </div>

        {/* Headline */}
        <h1 style={{ margin: "0 auto 24px", padding: 0, maxWidth: 720 }}>
          <span style={{ display: "block", fontSize: "clamp(36px,6vw,64px)", fontWeight: 300, color: "#0C1618", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Your crop has a problem.
          </span>
          <span style={{ display: "block", fontSize: "clamp(36px,6vw,64px)", fontWeight: 700, color: "#0C1618", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Here's exactly what to do.
          </span>
        </h1>

        {/* Subtext */}
        <p style={{ fontSize: 17, fontWeight: 300, color: "#666666", maxWidth: 460, lineHeight: 1.65, margin: "0 auto 40px" }}>
          Upload a leaf photo. Get a complete diagnosis with treatment timeline and economic impact — in under 2 minutes.
        </p>

        {/* CTA */}
        <button onClick={handleScan} className="cta-btn">
          Diagnose My Crop
        </button>

        {/* Below button */}
        <div style={{ fontSize: 12, color: "#AAAAAA", marginTop: 14 }}>
          Sign in with Google · No password · No OTP
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          S2 — PROOF STRIP
      ══════════════════════════════════════════════ */}
      <div className="proof-strip">
        <div className="proof-row">
          {[
            "DPIIT Recognised Startup",
            "Truffaire Labs Certified",
            "Razorpay Secured Payments",
            "2,847+ Reports Generated",
            "Cross-referenced with peer-reviewed research",
          ].map((item, i) => (
            <span key={item} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {i > 0 && <span style={{ color: "#CCCCCC", margin: "0 0 0 24px" }}>·</span>}
              <span style={{ fontSize: 11, color: "#666666", fontWeight: 400 }}>{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          S3 — PROBLEM STATEMENT
      ══════════════════════════════════════════════ */}
      <section className="sp-dark" style={{ background: "#0C1618" }}>
        <div className="si">
          <div className="problem-grid">

            {/* Stat */}
            <div className="problem-stat fade-up">
              <div style={{ fontSize: "clamp(52px,8vw,80px)", fontWeight: 300, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                ₹47,000
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.7, marginTop: 14, maxWidth: 280 }}>
                Average annual crop loss per acre in Karnataka due to undiagnosed leaf conditions
              </p>
            </div>

            {/* Pain points */}
            <div className="problem-points fade-up">
              {[
                { n: "01", title: "You notice the symptoms too late.", body: "By the time leaves show damage, 30–40% of the crop is already affected." },
                { n: "02", title: "You get generic advice.", body: "Agriculture department officers serve thousands of farmers. Their advice is rarely specific to your field." },
                { n: "03", title: "Treatment costs more than prevention.", body: "A ₹209 diagnosis prevents a ₹30,000 loss. Most farmers skip it." },
              ].map((item, i, arr) => (
                <div key={item.n} style={{ padding: "22px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#004643", letterSpacing: "0.06em", marginBottom: 7 }}>{item.n}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 7, letterSpacing: "-0.01em" }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, fontWeight: 300 }}>{item.body}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S4 — HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="sp" style={{ background: "white" }}>
        <div className="si">
          <div className="fade-up" style={secLbl}>HOW IT WORKS</div>
          <h2 className="fade-up" style={secH2}>
            From photo to action plan.<br />
            <strong style={{ fontWeight: 600 }}>In two minutes.</strong>
          </h2>

          <div className="steps-grid fade-up">
            {[
              { n: 1, title: "Upload 1–3 photos",        desc: "Any device. Camera or gallery. Multiple angles improve accuracy." },
              { n: 2, title: "Select crop + location",   desc: "Region, soil type, and weather are automatically factored into diagnosis." },
              { n: 3, title: "Pay one credit",            desc: "₹24–₹119 per report depending on plan. Diagnosis starts only after payment." },
              { n: 4, title: "Get your action plan",     desc: "Not just a diagnosis — a complete decision system with treatment timeline, economic impact, and follow-up guidance." },
            ].map((step, i) => (
              <div key={step.n} style={{ display: "contents" }}>
                {i > 0 && <div className="step-arrow">→</div>}
                <div className="step-item">
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#004643", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, margin: "0 auto 14px" }}>
                    {step.n}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0C1618", marginBottom: 8, letterSpacing: "-0.01em" }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: "#666666", lineHeight: 1.6, fontWeight: 300 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S5 — WHAT YOU GET
      ══════════════════════════════════════════════ */}
      <section className="sp" style={{ background: "#FAFAFA" }}>
        <div className="si">
          <div className="fade-up" style={secLbl}>WHAT YOU GET</div>
          <h2 className="fade-up" style={secH2}>
            More structured than a field inspection.<br />
            <strong style={{ fontWeight: 600 }}>Faster than a lab.</strong>
          </h2>

          <div className="wyg-grid fade-up">
            {/* Feature list */}
            <div className="wyg-left">
              {[
                "Primary diagnosis with confidence score",
                "Economic impact — yield loss in rupees",
                "Treatment timeline — Day 0, Day 7, Day 15",
                "Symptom zone map — visual leaf annotation",
                "Seasonal action calendar",
                "NABL-recommended lab tests",
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e8f0ef", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" stroke="#004643" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: "#0C1618", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Report preview card */}
            <div className="wyg-right">
              <div style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: 20, padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Truffaire Labs</div>
                    <div style={{ fontSize: 9, color: "#AAAAAA", fontFamily: "monospace", marginTop: 2 }}>TLS-2026-KA-004821</div>
                  </div>
                  <div style={{ background: "#004643", color: "white", fontSize: 9, fontWeight: 600, padding: "5px 12px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.05em" }}>CERTIFIED</div>
                </div>
                {[
                  { k: "DIAGNOSIS",    v: "Bacterial Blight",              style: { fontSize: 13, fontWeight: 600, color: "#0C1618" } },
                  { k: "CONFIDENCE",   v: "High (94%)",                    style: { fontSize: 13, color: "#0C1618" } },
                  { k: "SEVERITY",     v: null,                            pill: { bg: "#FEF3C7", text: "#92400E", label: "Moderate" } },
                  { k: "URGENCY",      v: null,                            pill: { bg: "#FEE2E2", text: "#991B1B", label: "Act within 5 days" } },
                  { k: "YIELD RISK",   v: "25–35% loss",                   style: { fontSize: 13, color: "#0C1618" } },
                  { k: "ECONOMIC",     v: "₹28,000 at risk per acre",      style: { fontSize: 13, fontWeight: 500, color: "#991B1B" } },
                  { k: "TREATMENT",    v: "Copper oxychloride 3g/L",       style: { fontSize: 13, color: "#0C1618" } },
                  { k: "REPORT",       v: "6 Pages — Full Protocol",       style: { fontSize: 13, color: "#0C1618" } },
                ].map((row, i, arr) => (
                  <div key={row.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #F5F5F5" : "none", gap: 10 }}>
                    <div style={{ fontSize: 10, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{row.k}</div>
                    <div style={{ textAlign: "right" }}>
                      {row.pill
                        ? <span style={{ background: row.pill.bg, color: row.pill.text, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 100 }}>{row.pill.label}</span>
                        : <span style={row.style}>{row.v}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <span style={{ display: "inline-block", background: "#e8f0ef", color: "#004643", fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 100 }}>
                  Typical saving per report: ₹5,000–₹30,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S6 — FARM IMAGE BREAK
      ══════════════════════════════════════════════ */}
      <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600"
          alt="Wide farm field at golden hour"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(12,22,24,0.52)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px" }}>
          <div style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: 300, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
            94% diagnosis accuracy.
          </div>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", fontWeight: 300, lineHeight: 1.65, maxWidth: 520 }}>
            Cross-referenced against peer-reviewed research from Frontiers in Plant Science and Karnataka field studies.{" "}
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>on tested conditions</span>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          S7 — TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section className="sp" style={{ background: "white" }}>
        <div className="si">
          <div className="fade-up" style={secLbl}>WHAT FARMERS SAY</div>
          <h2 className="fade-up" style={secH2}>
            Trusted across<br /><strong style={{ fontWeight: 600 }}>India's farms.</strong>
          </h2>
          <div className="testi-grid fade-up">
            {[
              { quote: "I diagnosed my pomegranate crop in 2 minutes. The report was more detailed than anything the agriculture department gave me.", name: "Balachandra",  role: "Pomegranate Farmer",       location: "Chitradurga, Karnataka",  initial: "B" },
              { quote: "As an agronomist managing 400 farmers, TLS saves me hours every week. The PDF report gives my farmers something they can hold and follow.", name: "Dr. Ajay",      role: "Agricultural Consultant",     location: "Solapur, Maharashtra",    initial: "A" },
              { quote: "The diagnosis was spot on. Ginger leaf curl identified correctly. Treatment worked within 10 days.", name: "Manjunath",   role: "Ginger Farmer",               location: "Mysuru, Karnataka",        initial: "M" },
            ].map((t) => (
              <div key={t.name} style={{ background: "#FAFAFA", border: "1px solid #E8E8E8", borderRadius: 20, padding: 24 }}>
                <p style={{ fontSize: 14, fontWeight: 300, color: "#333333", lineHeight: 1.7, margin: "0 0 18px" }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#004643", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                    {t.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0C1618" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#AAAAAA", fontWeight: 300, marginTop: 1 }}>{t.role} · {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S8 — CROP COVERAGE
      ══════════════════════════════════════════════ */}
      <section className="sp" style={{ background: "#FAFAFA" }}>
        <div className="si">
          <div className="fade-up" style={secLbl}>CROP COVERAGE</div>
          <h2 className="fade-up" style={secH2}>
            Across major crops<br /><strong style={{ fontWeight: 600 }}>grown in India.</strong>
          </h2>
          <p className="fade-up" style={secP}>
            From pomegranate to cotton, rice to coffee — TLS diagnoses the crops that matter to Indian farmers.
          </p>
          <div className="crops-grid fade-up">
            {["Pomegranate","Rice","Tomato","Cotton","Coffee","Mango","Wheat","Chilli","Coconut","Grapes","Sugarcane"].map((c) => (
              <div key={c} className="crop-pill" style={{ background: "white", border: "1px solid #E8E8E8", borderRadius: 10, padding: "12px 8px", textAlign: "center", fontSize: 12, fontWeight: 400, color: "#333333", cursor: "default", transition: "all 0.15s" }}>
                {c}
              </div>
            ))}
            <div style={{ background: "#0C1618", color: "white", border: "1px solid #0C1618", borderRadius: 10, padding: "12px 8px", textAlign: "center", fontSize: 11, fontWeight: 400 }}>
              + Any crop
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S9 — NUMBERS
      ══════════════════════════════════════════════ */}
      <section className="sp" style={{ background: "white" }}>
        <div className="si">
          <div className="fade-up" style={secLbl}>BY THE NUMBERS</div>
          <h2 className="fade-up" style={secH2}>
            Built for real farms,<br /><strong style={{ fontWeight: 600 }}>not laboratories.</strong>
          </h2>
          <div className="stats-grid fade-up">
            <Counter target={2847} label="Reports Generated"    suffix="+" />
            <Counter target={1293} label="Farmers Helped"       suffix="+" />
            <Counter target={94}   label="Diagnosis Accuracy"   suffix="%" subtext="on tested conditions" />
            <Counter target={2}    label="Average Per Report"   suffix=" min" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S10 — PRICING
      ══════════════════════════════════════════════ */}
      <section className="sp" style={{ background: "#FAFAFA" }}>
        <div className="si">
          <div className="fade-up" style={secLbl}>PRICING</div>
          <h2 className="fade-up" style={secH2}>
            Pay only for<br /><strong style={{ fontWeight: 600 }}>what you use.</strong>
          </h2>
          <p className="fade-up" style={secP}>
            No subscriptions. No sharing. Each credit is one complete diagnosis with economic impact and action plan.
          </p>
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{ display: "inline-block", background: "#e8f0ef", color: "#004643", fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 100 }}>
              Typical saving per report: ₹5,000–₹30,000
            </span>
          </div>
          <div className="pricing-cards fade-up">
            {CREDIT_PACKS.map((pack) => (
              <PricingCard key={pack.id} pack={pack} onBuy={handleBuy} prevents={PREVENTS[pack.id as string] ?? ""} />
            ))}
            <EnterprisePricingCard />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          S11 — FINAL CTA
      ══════════════════════════════════════════════ */}
      <div style={{ position: "relative", background: "#0C1618", overflow: "hidden" }}>
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200"
          alt=""
          aria-hidden="true"
          crossOrigin="anonymous"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.13, pointerEvents: "none" }}
        />
        <div className="sp-dark" style={{ position: "relative", textAlign: "center" }}>
          <div className="si">
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 18 }}>
              START TODAY
            </div>
            <h2 style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: 300, letterSpacing: "-0.03em", color: "white", lineHeight: 1.1, maxWidth: 560, margin: "0 auto 20px" }}>
              Don't let one disease<br />
              <strong style={{ fontWeight: 700 }}>cost you the season.</strong>
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 420, margin: "0 auto 32px" }}>
              ₹119 for a single scan. Farmers who act early save an average of ₹25,000 per acre per season.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={handleScan} className="cta-btn" style={{ background: "#004643", width: "auto", minWidth: 220 }}>
                Diagnose My Crop
              </button>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 14 }}>
              Sign in with Google · No password · No OTP
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          S12 — FOOTER (preserved exactly)
      ══════════════════════════════════════════════ */}
      <div style={{ padding: "16px var(--page-padding)", background: "#FAFAFA", borderTop: "1px solid #F5F5F5" }}>
        <p style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300, lineHeight: 1.65, textAlign: "center" }}>
          TLS reports are issued by Truffaire Labs Diagnostic Engine for advisory purposes only.
          Results are based on visual leaf analysis and do not substitute certified laboratory testing
          or professional agronomist consultation for critical crop decisions.
          Truffaire Private Limited accepts no liability for decisions made solely on the basis of this report.
        </p>
      </div>
      <footer>
        {/* ── Top section ── */}
        <div style={{ padding: "56px var(--page-padding) 40px", borderTop: "1px solid #E8E8E8" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 40 }}>

            {/* Left block */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: "#0C1618", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3C9 3 6.5 6.5 6.5 11c0 3.5 2 6.5 5.5 8.5 3.5-2 5.5-5 5.5-8.5C17.5 6.5 15 3 12 3z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#0C1618" }}>
                  TLS <span style={{ color: "#AAAAAA", fontWeight: 300 }}>— Truffaire LeafScan</span>
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 300, color: "#AAAAAA", lineHeight: 1.6 }}>A Truffaire Labs product.</div>
              <div style={{ fontSize: 13, fontWeight: 300, color: "#AAAAAA", lineHeight: 1.6 }}>Precision leaf diagnosis for Indian farmers.</div>
            </div>

            {/* Right block — two link columns */}
            <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
              {/* Product column */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#AAAAAA", marginBottom: 14, textTransform: "uppercase" }}>Product</div>
                {[
                  { label: "Dashboard",    href: "/dashboard" },
                  { label: "How it works", href: "/#how-it-works" },
                  { label: "Pricing",      href: "/#pricing" },
                ].map((l) => (
                  <a key={l.label} href={l.href} className="footer-link" style={{ display: "block", fontSize: 13, color: "#666666", textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}>
                    {l.label}
                  </a>
                ))}
              </div>
              {/* Legal column */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#AAAAAA", marginBottom: 14, textTransform: "uppercase" }}>Legal</div>
                {[
                  { label: "Privacy Policy",    href: "/privacy",              target: undefined },
                  { label: "Terms of Service",  href: "/terms",                target: undefined },
                  { label: "truffaire.in",      href: "https://www.truffaire.in", target: "_blank" },
                ].map((l) => (
                  <a key={l.label} href={l.href} className="footer-link" target={l.target} rel={l.target ? "noopener noreferrer" : undefined} style={{ display: "block", fontSize: 13, color: "#666666", textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom section ── */}
        <div style={{ padding: "20px var(--page-padding)", borderTop: "1px solid #F5F5F5", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#AAAAAA" }}>© 2026 Truffaire Private Limited. All rights reserved.</div>
            <div style={{ fontSize: 11, color: "#AAAAAA", textAlign: "right" }}>CIN: U01136KA2025PTC206761 · Bengaluru, Karnataka, India · one@truffaire.in</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Counter ──────────────────────────────────────────────────────
function Counter({ target, label, suffix, subtext }: { target: number; label: string; suffix: string; subtext?: string }) {
  const ref        = useRef<HTMLDivElement>(null);
  const animRef    = useRef<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const runAnimation = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const duration = 2000;
      const start    = performance.now();
      const tick = (now: number) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        const current  = Math.round(eased * target);
        const numEl    = el.querySelector(".counter-num");
        if (numEl) numEl.textContent = current + suffix;
        if (progress < 1) animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) runAnimation(); }),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [target, suffix]);

  return (
    <div ref={ref} style={{ background: "#FAFAFA", borderRadius: 16, padding: "22px 18px" }}>
      <div className="counter-num" style={{ fontSize: 36, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1, color: "#0C1618" }}>
        0{suffix}
      </div>
      <div style={{ fontSize: 11, fontWeight: 300, color: "#AAAAAA", marginTop: 6 }}>{label}</div>
      {subtext && <div style={{ fontSize: 10, color: "#CCCCCC", fontWeight: 300, marginTop: 2 }}>{subtext}</div>}
    </div>
  );
}

// ── PricingCard ──────────────────────────────────────────────────
function PricingCard({ pack, onBuy, prevents }: { pack: typeof CREDIT_PACKS[number]; onBuy: () => void; prevents: string }) {
  const dark = pack.popular;
  return (
    <div className="pricing-card" style={{ border: `1px solid ${dark ? "#0C1618" : "#E8E8E8"}`, borderRadius: 20, padding: 24, background: dark ? "#0C1618" : "white", position: "relative" }}>
      {dark && (
        <div style={{ position: "absolute", top: 20, right: 20, background: "#004643", color: "white", fontSize: 9, fontWeight: 600, padding: "4px 10px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Most Popular
        </div>
      )}
      <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.09em", color: dark ? "rgba(255,255,255,0.3)" : "#AAAAAA", marginBottom: 10 }}>{pack.name}</div>
      <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: "-0.04em", color: dark ? "white" : "#0C1618", lineHeight: 1 }}>
        <sup style={{ fontSize: 17, fontWeight: 400, verticalAlign: "super" }}>₹</sup>{pack.price}
      </div>
      <div style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.3)" : "#AAAAAA", marginTop: 5, fontWeight: 300 }}>
        {pack.credits} reports — ₹{pack.perReport} per report
      </div>
      <div style={{ height: 1, background: dark ? "rgba(255,255,255,0.08)" : "#F5F5F5", margin: "18px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {pack.features.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 300, color: dark ? "rgba(255,255,255,0.5)" : "#666666" }}>
            <CheckIcon dark={dark} />{f}
          </div>
        ))}
      </div>
      {prevents && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#004643", fontWeight: 500 }}>
          Est. prevents {prevents} in crop loss
        </div>
      )}
      <button onClick={onBuy} className="pricing-buy-btn" style={{ width: "100%", marginTop: 20, padding: 14, borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer", letterSpacing: "0.01em", background: dark ? "white" : "transparent", color: "#0C1618", border: dark ? "none" : "1.5px solid #E8E8E8", transition: "opacity 0.18s" }}>
        Buy {pack.name}
      </button>
    </div>
  );
}

// ── EnterprisePricingCard ────────────────────────────────────────
function EnterprisePricingCard() {
  const plan = ENTERPRISE_PLAN;
  return (
    <div className="pricing-card" style={{ border: "1px solid #E8E8E8", borderRadius: 20, padding: 24, background: "white", position: "relative" }}>
      <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.09em", color: "#AAAAAA", marginBottom: 10 }}>{plan.name}</div>
      <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: "-0.04em", color: "#0C1618", lineHeight: 1 }}>
        Custom
      </div>
      <div style={{ fontSize: 12, color: "#AAAAAA", marginTop: 5, fontWeight: 300 }}>
        300+ reports — Custom volume available
      </div>
      <div style={{ fontSize: 11, color: "#004643", fontWeight: 500, marginTop: 6 }}>
        {plan.tagline}
      </div>
      <div style={{ height: 1, background: "#F5F5F5", margin: "18px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {plan.features.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 300, color: "#666666" }}>
            <CheckIcon />{f}
          </div>
        ))}
      </div>
      <a
        href={`mailto:one@truffaire.in?subject=${encodeURIComponent("Enterprise Plan Inquiry — ARCORA")}`}
        style={{ display: "block", width: "100%", marginTop: 20, padding: 14, borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer", letterSpacing: "0.01em", background: "transparent", color: "#004643", border: "1.5px solid #004643", transition: "all 0.18s", textAlign: "center", textDecoration: "none", boxSizing: "border-box" as const }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#e8f0ef"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
      >
        Contact Us
      </a>
    </div>
  );
}

// ── CheckIcon ────────────────────────────────────────────────────
function CheckIcon({ dark }: { dark?: boolean }) {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", background: dark ? "rgba(255,255,255,0.09)" : "#e8f0ef", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
        <polyline points="2,6 5,9 10,3" stroke={dark ? "rgba(255,255,255,0.65)" : "#004643"} strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const secLbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
  textTransform: "uppercase", color: "#004643", marginBottom: 12,
};
const secH2: React.CSSProperties = {
  fontSize: "clamp(26px,5vw,40px)", fontWeight: 300,
  letterSpacing: "-0.03em", lineHeight: 1.15,
  color: "#0C1618", margin: "0 0 14px",
};
const secP: React.CSSProperties = {
  fontSize: 15, fontWeight: 300, color: "#666666",
  lineHeight: 1.7, maxWidth: 480, margin: "0 0 0",
};
