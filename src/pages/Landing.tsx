import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTLSAuth, useTLSClerk } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { CREDIT_PACKS } from "@/lib/constants";

// ── Global CSS injected once ───────────────────────────────────
const GLOBAL_CSS = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
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
  .pricing-btn:hover {
    opacity: 0.85;
  }
`;

export default function Landing() {
  const { isSignedIn } = useTLSAuth();
  const { openSignIn } = useTLSClerk();
  const navigate       = useNavigate();
  const styleInjected  = useRef(false);

  // Inject global CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  // Scroll animation observer
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
    if (isSignedIn) navigate("/dashboard");
    else openSignIn({ redirectUrl: "/dashboard" });
  };

  const handleBuy = () => {
    if (isSignedIn) navigate("/dashboard");
    else openSignIn({ redirectUrl: "/dashboard" });
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100svh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "100px 28px 72px",
      }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#004643", marginBottom: 28,
        }}>
          TRUFFAIRE LEAFSCAN
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(40px, 11vw, 82px)", fontWeight: 300,
          lineHeight: 1.03, letterSpacing: "-0.036em", color: "#0C1618",
          maxWidth: 700, margin: 0,
        }}>
          Scan any leaf.<br />
          <strong style={{ fontWeight: 600 }}>Know everything.</strong><br />
          <span style={{ color: "#004643", fontWeight: 300 }}>In two minutes.</span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: 16, fontWeight: 300, color: "#666666",
          maxWidth: 380, lineHeight: 1.7, marginTop: 26, margin: "26px auto 0",
        }}>
          Upload a leaf photograph. Receive a complete scientific diagnosis —
          deficiencies, diseases, causes, and full treatment protocol.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleScan}
          className="pricing-btn"
          style={{
            marginTop: 36, padding: "16px 40px",
            background: "#004643", color: "white",
            border: "none", borderRadius: 100,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16, fontWeight: 500,
            cursor: "pointer", letterSpacing: "0.01em",
            width: "100%", maxWidth: 280,
            transition: "opacity 0.18s",
          }}
        >
          Scan a Leaf
        </button>

        {/* Proof line */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7, marginTop: 20,
          justifyContent: "center",
        }}>
          <div style={{
            width: 6, height: 6, background: "#22c55e", borderRadius: "50%",
            animation: "blink 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 12, color: "#AAAAAA", fontWeight: 400 }}>
            Validated by agronomists across India
          </span>
        </div>

        {/* Phone Mockup */}
        <div style={{ width: "100%", maxWidth: 295, marginTop: 64 }}>
          <PhoneMockup />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — CREDIBILITY STRIP
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: "#FAFAFA",
        borderTop: "1px solid #E8E8E8",
        borderBottom: "1px solid #E8E8E8",
        padding: "16px 28px",
        overflowX: "auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          justifyContent: "center", whiteSpace: "nowrap",
          minWidth: "max-content", margin: "0 auto",
        }}>
          {[
            { icon: <ShieldIcon />, text: "DPIIT Recognised Startup" },
            { icon: <LeafIcon />,   text: "Truffaire Labs Certified" },
            { icon: <LockIcon />,   text: "Secure Payments" },
            { icon: <StarIcon />,   text: "Agronomist Validated" },
          ].map((item, i) => (
            <span key={item.text} style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {i > 0 && (
                <span style={{ color: "#CCCCCC", fontSize: 14, margin: "0 0 0 28px" }}>·</span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 7, marginLeft: i > 0 ? 0 : 0 }}>
                {item.icon}
                <span style={{ fontSize: 11, color: "#666666", fontWeight: 400 }}>{item.text}</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — ROLLING COUNTERS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "64px 28px", background: "white" }}>
        <div className="fade-up" style={secLbl}>BY THE NUMBERS</div>
        <h2 className="fade-up" style={secH2}>
          Built for real farms,<br /><strong style={{ fontWeight: 600 }}>not laboratories.</strong>
        </h2>
        <div className="fade-up" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 40,
        }}>
          <Counter target={2847} label="Reports Generated" suffix="+" />
          <Counter target={1293} label="Farmers Helped"    suffix="+" />
          <Counter target={94}   label="Diagnosis Accuracy" suffix="%" />
          <Counter target={2}    label="Minutes Per Report" suffix=" min" />
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 28px" }}>
        <div className="fade-up" style={secLbl}>HOW IT WORKS</div>
        <h2 className="fade-up" style={secH2}>
          Four steps.<br /><strong style={{ fontWeight: 600 }}>Complete diagnosis.</strong>
        </h2>
        <div className="fade-up" style={{
          marginTop: 40, display: "flex", flexDirection: "column",
          gap: 1, background: "#E8E8E8", borderRadius: 20, overflow: "hidden",
        }}>
          {[
            { n: 1, title: "Upload your leaf",      desc: "Take a photo or choose from your gallery. Any device, any lighting.",                                                             active: true },
            { n: 2, title: "Select your crop",      desc: "Choose from every crop ever cultivated — or type any crop name."                                                                                },
            { n: 3, title: "Pay one credit",        desc: "Secure payment via Razorpay. Diagnosis begins only after payment is confirmed."                                                                },
            { n: 4, title: "Download your report",  desc: "6-page scientific report with diagnosis, causes, treatment protocol, and seasonal calendar."                                                   },
          ].map((step) => (
            <StepRow key={step.n} {...step} />
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — THE REPORT
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 28px" }}>
        <div className="fade-up" style={secLbl}>THE REPORT</div>
        <h2 className="fade-up" style={secH2}>
          More thorough than any lab.<br /><strong style={{ fontWeight: 600 }}>Faster than any call.</strong>
        </h2>
        <p className="fade-up" style={secP}>
          Every report is 6 pages of precise, crop-specific diagnosis. Not generic advice.
          Not guesswork. Science.
        </p>

        {/* Report preview card */}
        <div className="fade-up" style={{
          background: "#FAFAFA", borderRadius: 24, padding: "26px 22px", marginTop: 40,
        }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>Truffaire Labs</div>
              <div style={{ fontSize: 9, color: "#AAAAAA", fontFamily: "monospace", marginTop: 2 }}>TLS-2026-KA-004821</div>
            </div>
            <div style={{
              background: "#004643", color: "white", fontSize: 9, fontWeight: 600,
              padding: "5px 12px", borderRadius: 100,
              textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
            }}>CERTIFIED</div>
          </div>

          {/* Data rows */}
          {[
            { k: "Crop",      v: <span style={{ fontSize: 13, fontWeight: 500 }}>Pomegranate</span> },
            { k: "Primary",   v: <span style={{ fontSize: 13, fontWeight: 500 }}>Potassium Deficiency</span> },
            { k: "Secondary", v: <span style={{ fontSize: 13, fontWeight: 500 }}>Boron Deficiency</span> },
            { k: "Severity",  v: <Pill color="amber">Moderate</Pill> },
            { k: "Urgency",   v: <Pill color="red">Act within 7 days</Pill> },
            { k: "Report",    v: <span style={{ fontSize: 13, fontWeight: 500 }}>6 Page — Full Protocol</span> },
          ].map((row, i, arr) => (
            <div key={row.k} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 0",
              borderBottom: i < arr.length - 1 ? "1px solid #E8E8E8" : "none",
              gap: 10,
            }}>
              <div style={{ fontSize: 10, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                {row.k}
              </div>
              <div style={{ textAlign: "right" }}>{row.v}</div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 6 — TESTIMONIALS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 28px", background: "#FAFAFA" }}>
        <div className="fade-up" style={secLbl}>WHAT FARMERS SAY</div>
        <h2 className="fade-up" style={secH2}>
          Trusted across<br /><strong style={{ fontWeight: 600 }}>India's farms.</strong>
        </h2>
        <div className="fade-up" style={{
          display: "flex", flexDirection: "column", gap: 14, marginTop: 40,
        }}>
          {[
            {
              quote: "I diagnosed my pomegranate crop in 2 minutes. The report was more detailed than anything the agriculture department gave me.",
              name: "Balachandra", role: "Pomegranate Farmer", location: "Chitradurga, Karnataka", initial: "B",
            },
            {
              quote: "As an agronomist managing 400 farmers, TLS saves me hours every week. The PDF report gives my farmers something they can actually hold and follow.",
              name: "Dr. Suresh Patil", role: "Agricultural Consultant", location: "Solapur, Maharashtra", initial: "S",
            },
            {
              quote: "The diagnosis was spot on. Cotton leaf curl identified correctly, treatment worked within 10 days.",
              name: "Manjunath", role: "Cotton Farmer", location: "Bellary, Karnataka", initial: "M",
            },
          ].map((t) => (
            <div key={t.name} style={{
              background: "white", borderRadius: 16, padding: 20,
              border: "1px solid #E8E8E8",
            }}>
              <p style={{ fontSize: 14, fontWeight: 300, color: "#0C1618", lineHeight: 1.7, margin: "0 0 16px" }}>
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
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#AAAAAA", fontWeight: 300, marginTop: 1 }}>
                    {t.role} · {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 7 — CROP COVERAGE
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 28px" }}>
        <div className="fade-up" style={secLbl}>CROP COVERAGE</div>
        <h2 className="fade-up" style={secH2}>
          Every crop that has<br /><strong style={{ fontWeight: 600 }}>ever grown on this earth.</strong>
        </h2>
        <p className="fade-up" style={secP}>
          From staple field crops to rare medicinal plants. If it grows — TLS diagnoses it.
        </p>
        <div className="fade-up" style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 32,
        }}>
          {["Pomegranate","Rice","Tomato","Cotton","Coffee","Mango",
            "Wheat","Chilli","Coconut","Grapes","Sugarcane"].map((c) => (
            <div
              key={c}
              className="crop-pill"
              style={{
                background: "#FAFAFA", border: "1px solid #F5F5F5",
                borderRadius: 10, padding: "12px 8px",
                textAlign: "center", fontSize: 12, fontWeight: 400,
                color: "#333333", cursor: "default",
                transition: "all 0.15s",
              }}
            >
              {c}
            </div>
          ))}
          <div style={{
            background: "#0C1618", color: "white",
            border: "1px solid #0C1618", borderRadius: 10,
            padding: "12px 8px", textAlign: "center",
            fontSize: 11, fontWeight: 400,
          }}>
            + Any crop
          </div>
        </div>
      </section>

      <Divider />

      {/* ══════════════════════════════════════════════════════════
          SECTION 8 — PRICING
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 28px" }}>
        <div className="fade-up" style={secLbl}>PRICING</div>
        <h2 className="fade-up" style={secH2}>
          Pay only for<br /><strong style={{ fontWeight: 600 }}>what you use.</strong>
        </h2>
        <p className="fade-up" style={secP}>
          No subscriptions. No sharing. Each credit is one complete 6-page diagnosis report.
        </p>
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 40 }}>
          {CREDIT_PACKS.map((pack) => (
            <PricingCard key={pack.id} pack={pack} onBuy={handleBuy} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: "#0C1618", padding: "72px 28px", textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
          marginBottom: 14,
        }}>
          START TODAY
        </div>
        <h2 style={{
          fontSize: "clamp(26px, 7vw, 44px)", fontWeight: 300,
          letterSpacing: "-0.03em", color: "white", lineHeight: 1.1,
          maxWidth: 480, margin: "0 auto",
        }}>
          The world's most complete<br />
          leaf diagnosis.<br />
          <strong style={{ fontWeight: 600 }}>In your hands.</strong>
        </h2>
        <p style={{
          fontSize: 15, fontWeight: 300,
          color: "rgba(255,255,255,0.4)",
          marginTop: 18, lineHeight: 1.65,
        }}>
          Sign in with Google. No password. No OTP.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 10 — FOOTER (preserved exactly)
      ══════════════════════════════════════════════════════════ */}

      {/* Disclaimer */}
      <div style={{ padding: "16px 28px", background: "#FAFAFA", borderTop: "1px solid #F5F5F5" }}>
        <p style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300, lineHeight: 1.65, textAlign: "center" }}>
          TLS reports are issued by Truffaire Labs Diagnostic Engine for advisory purposes only.
          Results are based on visual leaf analysis and do not substitute certified laboratory testing
          or professional agronomist consultation for critical crop decisions.
          Truffaire Private Limited accepts no liability for decisions made solely on the basis of this report.
        </p>
      </div>

      {/* Footer */}
      <footer style={{ padding: "44px 28px 36px", borderTop: "1px solid #F5F5F5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, background: "#0C1618", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3C9 3 6.5 6.5 6.5 11c0 3.5 2 6.5 5.5 8.5 3.5-2 5.5-5 5.5-8.5C17.5 6.5 15 3 12 3z"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            TLS <span style={{ color: "#AAAAAA", fontWeight: 300 }}>— Truffaire LeafScan</span>
          </div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 300, color: "#AAAAAA", lineHeight: 1.65, maxWidth: 300, marginBottom: 24 }}>
          A Truffaire Labs product. Precision leaf diagnosis for every crop, every farm on earth.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 28 }}>
          {["Privacy Policy", "Terms of Service", "Refund Policy", "truffaire.in"].map((l) => (
            <a key={l} href="#" style={{ fontSize: 12, color: "#AAAAAA", textDecoration: "none", fontWeight: 400 }}>{l}</a>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #F5F5F5", paddingTop: 18, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300 }}>Truffaire Private Limited · CIN: U01136KA2025PTC206761 · Bengaluru, Karnataka, India</div>
          <div style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300 }}>one@truffaire.in · tls.truffaire.in</div>
          <div style={{ fontSize: 10, color: "#AAAAAA", fontWeight: 300, marginTop: 4 }}>© 2026 Truffaire Private Limited. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

// ── Counter component ──────────────────────────────────────────
function Counter({ target, label, suffix }: { target: number; label: string; suffix: string }) {
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
        // ease-out cubic
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
    <div ref={ref} style={{
      background: "#FAFAFA", borderRadius: 16, padding: "22px 18px",
    }}>
      <div
        className="counter-num"
        style={{ fontSize: 36, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1, color: "#0C1618" }}
      >
        0{suffix}
      </div>
      <div style={{ fontSize: 11, fontWeight: 300, color: "#AAAAAA", marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: "#F5F5F5", margin: "0 28px" }} />;
}

function StepRow({ n, title, desc, active }: { n: number; title: string; desc: string; active?: boolean }) {
  return (
    <div
      style={{ background: "white", padding: "22px 20px", display: "flex", alignItems: "flex-start", gap: 17, transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
      onMouseLeave={e => (e.currentTarget.style.background = "white")}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: active ? "#004643" : "#F5F5F5",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 600, color: active ? "white" : "#AAAAAA",
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em" }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 300, color: "#666666", lineHeight: 1.6, marginTop: 3 }}>{desc}</div>
      </div>
    </div>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: "amber" | "red" }) {
  const styles = {
    amber: { background: "#FFF3CD", color: "#92400E" },
    red:   { background: "#FEE2E2", color: "#991B1B" },
  };
  return (
    <span style={{ ...styles[color], fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 100 }}>
      {children}
    </span>
  );
}

function PricingCard({ pack, onBuy }: { pack: typeof CREDIT_PACKS[number]; onBuy: () => void }) {
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
          background: "#004643", color: "white", fontSize: 9, fontWeight: 600,
          padding: "4px 10px", borderRadius: 100,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          Most Popular
        </div>
      )}
      <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.09em", color: dark ? "rgba(255,255,255,0.3)" : "#AAAAAA", marginBottom: 10 }}>
        {pack.name}
      </div>
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
            <CheckIcon dark={dark} />
            {f}
          </div>
        ))}
      </div>
      <button
        onClick={onBuy}
        className="pricing-btn"
        style={{
          width: "100%", marginTop: 20, padding: 14, borderRadius: 12,
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
          cursor: "pointer", letterSpacing: "0.01em",
          background: dark ? "white" : "transparent",
          color: dark ? "#0C1618" : "#0C1618",
          border: dark ? "none" : "1.5px solid #E8E8E8",
          transition: "opacity 0.18s",
        }}
      >
        Buy {pack.name}
      </button>
    </div>
  );
}

function CheckIcon({ dark }: { dark?: boolean }) {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: "50%",
      background: dark ? "rgba(255,255,255,0.09)" : "#e8f0ef",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
        <polyline points="2,6 5,9 10,3" stroke={dark ? "rgba(255,255,255,0.65)" : "#004643"} strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ── Credibility strip icons (16px, teal) ───────────────────────
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004643" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004643" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C9 3 6.5 6.5 6.5 11c0 3.5 2 6.5 5.5 8.5 3.5-2 5.5-5 5.5-8.5C17.5 6.5 15 3 12 3z"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004643" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004643" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

// ── Phone Mockup (unchanged) ───────────────────────────────────
function PhoneMockup() {
  return (
    <div style={{
      background: "#0C1618", borderRadius: 44, padding: 11,
      boxShadow: "0 52px 100px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.05) inset",
    }}>
      <div style={{ background: "white", borderRadius: 34, overflow: "hidden", aspectRatio: "9/19.5", display: "flex", flexDirection: "column" }}>
        {/* Status bar */}
        <div style={{ padding: "13px 20px 5px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#0C1618" }}>9:41</span>
          <svg width="36" height="10" viewBox="0 0 36 10" fill="#0C1618" opacity={0.65}>
            <rect x="0" y="6" width="3" height="4" rx="0.5" opacity="0.4"/>
            <rect x="4.5" y="4" width="3" height="6" rx="0.5" opacity="0.6"/>
            <rect x="9" y="2" width="3" height="8" rx="0.5" opacity="0.8"/>
            <rect x="13.5" y="0" width="3" height="10" rx="0.5"/>
            <rect x="21" y="1" width="13" height="8" rx="1.5" fill="none" stroke="#0C1618" strokeWidth="1"/>
            <rect x="22.5" y="2.5" width="8" height="5" rx="1"/>
            <path d="M35 4v2a1 1 0 000-2z"/>
          </svg>
        </div>
        {/* App body */}
        <div style={{ flex: 1, padding: "8px 15px 15px", display: "flex", flexDirection: "column", gap: 11, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em" }}>
              TLS <span style={{ color: "#004643" }}>Labs</span>
            </div>
            <div style={{ background: "#e8f0ef", color: "#004643", fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 100 }}>3 credits</div>
          </div>
          <div style={{ background: "#FAFAFA", border: "1.5px dashed #E8E8E8", borderRadius: 13, padding: "18px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: "white", borderRadius: 9, boxShadow: "0 2px 7px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004643" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
              </svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 500 }}>Upload leaf photo</div>
            <div style={{ fontSize: 9, color: "#AAAAAA", fontWeight: 300 }}>Camera or gallery</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, flexShrink: 0 }}>
            {[{ l: "Crop", v: "Pomegranate" }, { l: "Language", v: "English" }].map((s) => (
              <div key={s.l} style={{ background: "#FAFAFA", border: "1px solid #E8E8E8", borderRadius: 10, padding: "9px 11px" }}>
                <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.07em", color: "#AAAAAA", fontWeight: 500 }}>{s.l}</div>
                <div style={{ fontSize: 11, fontWeight: 500, marginTop: 1 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0C1618", color: "white", borderRadius: 11, padding: 12, fontSize: 11, fontWeight: 500, textAlign: "center", letterSpacing: "0.02em", flexShrink: 0 }}>
            Diagnose — 1 Credit
          </div>
          <div style={{ background: "#FAFAFA", borderRadius: 11, padding: "10px 12px", flexShrink: 0 }}>
            <div style={{ fontSize: 8, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500, marginBottom: 4 }}>Last Report</div>
            <div style={{ fontSize: 11, fontWeight: 500 }}>Potassium Deficiency</div>
            <div style={{ fontSize: 9, color: "#AAAAAA", fontWeight: 300, marginTop: 1 }}>Pomegranate · 2 Apr 2026</div>
          </div>
        </div>
      </div>
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
  letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: 520,
  margin: 0,
};
const secP: React.CSSProperties = {
  fontSize: 15, fontWeight: 300, color: "#666666",
  lineHeight: 1.7, maxWidth: 450, marginTop: 13,
};
