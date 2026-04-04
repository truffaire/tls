import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import { FEATURED_CROPS } from "@/lib/constants";
import { useTLSUser } from "@/lib/auth";

type Step = "upload" | "crop" | "confirm" | "processing";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DATA_URL_PREFIX = "data:";

export default function Scan() {
  const { user } = useTLSUser();
  const navigate     = useNavigate();
  const runDiagnosis = useAction(api.diagnoseAction.runDiagnosis);
  const credits      = useQuery(api.users.getCredits, { clerkId: user?.id ?? "" });

  const [step, setStep]           = useState<Step>("upload");
  const [image, setImage]         = useState<string | null>(null);
  const [imageB64, setImageB64]   = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [crop, setCrop]           = useState("");
  const [cropSearch, setCropSearch] = useState("");
  const language = "English";
  const [error, setError]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  // ── Handle image upload ──────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Upload a JPG, PNG, or WEBP image only.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }

    setError("");
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result || !result.startsWith(DATA_URL_PREFIX)) {
        setError("Image could not be read correctly. Please try again.");
        e.target.value = "";
        return;
      }
      setImage(result);
      // Extract base64 data only
      const b64 = result.split(",")[1];
      if (!b64) {
        setError("Image data is invalid. Please choose another file.");
        e.target.value = "";
        return;
      }
      setImageB64(b64);
      setStep("crop");
    };
    reader.readAsDataURL(file);
  };

  // ── Run diagnosis ────────────────────────────────────────────
  const handleDiagnose = async () => {
    if (!user || !imageB64 || !crop || isSubmitting) return;
    if ((credits ?? 0) < 1) {
      setError("Insufficient credits. Please buy a pack.");
      return;
    }

    setStep("processing");
    setError("");
    setIsSubmitting(true);

    try {
      const result = await runDiagnosis({
        clerkId:  user.id,
        crop,
        language,
        imageUrl: image ?? "",
        imageB64,
        imageMimeType: imageMimeType ?? undefined,
      });

      navigate(`/report/${result.reportId}`);
    } catch (err: any) {
      setError(err.message ?? "Diagnosis failed. Please try again.");
      setStep("confirm");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to dashboard if credits are loaded and zero
  useEffect(() => {
    if (credits === 0) navigate("/dashboard");
  }, [credits, navigate]);

  const filteredCrops = FEATURED_CROPS.filter((c) =>
    c.toLowerCase().includes(cropSearch.toLowerCase())
  );

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "80px 28px 40px", maxWidth: 480, margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 28 }}>
          {step !== "processing" && (
            <button
              onClick={() => {
                if (step === "upload") navigate("/dashboard");
                else if (step === "crop") setStep("upload");
                else if (step === "confirm") setStep("crop");
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#AAAAAA", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
          )}
          <StepIndicator current={step} />
        </div>

        {/* ── STEP: UPLOAD ── */}
        {step === "upload" && (
          <div>
            <h2 style={sh2}>Upload your<br /><strong>leaf photo</strong></h2>
            <p style={sp}>Take a clear photo of the affected leaf or choose from your gallery.</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                marginTop: 28, border: "2px dashed #E8E8E8", borderRadius: 20,
                padding: "48px 20px", textAlign: "center", cursor: "pointer",
                background: "#FAFAFA", transition: "all 0.18s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#004643";
                (e.currentTarget as HTMLDivElement).style.background = "#e8f0ef";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#E8E8E8";
                (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA";
              }}
            >
              <div style={{ width: 48, height: 48, background: "white", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#004643" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Tap to upload leaf photo</div>
              <div style={{ fontSize: 12, color: "#AAAAAA", fontWeight: 300 }}>Camera or gallery · JPG, PNG, WEBP · Max 5MB</div>
            </div>
            {error && (
              <div style={{ background: "#0C1618", color: "#FFFFFF", borderRadius: 10, padding: "12px 14px", marginTop: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: CROP ── */}
        {step === "crop" && (
          <div>
            <h2 style={sh2}>Select your<br /><strong>crop</strong></h2>
            <p style={sp}>Choose the specific crop for a more accurate diagnosis.</p>

            {/* Search */}
            <input
              type="text"
              placeholder="Search or type any crop..."
              value={cropSearch}
              onChange={e => setCropSearch(e.target.value)}
              style={searchStyle}
            />

            {/* Custom crop entry */}
            {cropSearch && !FEATURED_CROPS.find(c => c.toLowerCase() === cropSearch.toLowerCase()) && (
              <button
                onClick={() => { setCrop(cropSearch); setStep("confirm"); }}
                style={customCropBtn}
              >
                Use "{cropSearch}"
              </button>
            )}

            {/* Crop grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 14 }}>
              {filteredCrops.map((c) => (
                <div
                  key={c}
                  onClick={() => { setCrop(c); setStep("confirm"); }}
                  style={{
                    border: `1.5px solid ${crop === c ? "#004643" : "#E8E8E8"}`,
                    background: crop === c ? "#e8f0ef" : "white",
                    borderRadius: 12, padding: "13px 14px",
                    cursor: "pointer", fontSize: 13, fontWeight: 400,
                    color: crop === c ? "#004643" : "#0C1618",
                    transition: "all 0.15s",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === "confirm" && (
          <div>
            <h2 style={sh2}>Review and<br /><strong>diagnose</strong></h2>

            {/* Preview image */}
            {image && (
              <div style={{ marginTop: 20, borderRadius: 16, overflow: "hidden", border: "1px solid #E8E8E8" }}>
                <img src={image} alt="leaf" style={{ width: "100%", height: 180, objectFit: "cover" }} />
              </div>
            )}

            {/* Summary */}
            <div style={{ background: "#FAFAFA", borderRadius: 16, padding: "18px 16px", marginTop: 16 }}>
              {[
                { k: "Crop",    v: crop },
                { k: "Cost",    v: "1 credit" },
                { k: "Balance", v: `${credits ?? 0} credits` },
              ].map((row, i, arr) => (
                <div key={row.k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #E8E8E8" : "none" }}>
                  <span style={{ fontSize: 12, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{row.v}</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 10, padding: "12px 14px", marginTop: 14, fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleDiagnose}
              disabled={(credits ?? 0) < 1 || isSubmitting}
              style={{
                width: "100%", marginTop: 20, padding: 16, borderRadius: 14,
                background: (credits ?? 0) < 1 || isSubmitting ? "#E8E8E8" : "#004643",
                color: (credits ?? 0) < 1 || isSubmitting ? "#AAAAAA" : "white",
                border: "none", fontFamily: "'DM Sans', sans-serif",
                fontSize: 15, fontWeight: 500, cursor: (credits ?? 0) < 1 || isSubmitting ? "not-allowed" : "pointer",
                letterSpacing: "0.01em",
              }}
            >
              {isSubmitting
                ? "Submitting..."
                : (credits ?? 0) < 1
                  ? "No credits — Buy a pack first"
                  : "Diagnose — 1 Credit"}
            </button>

            <p style={{ fontSize: 11, color: "#AAAAAA", textAlign: "center", marginTop: 12, fontWeight: 300, lineHeight: 1.5 }}>
              1 credit will be deducted. Report generates in approximately 2 minutes.
            </p>
          </div>
        )}

        {/* ── STEP: PROCESSING ── */}
        {step === "processing" && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "2px solid #e8f0ef", borderTopColor: "#004643",
              animation: "spin 1s linear infinite", margin: "0 auto 24px",
            }} />
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#004643", marginBottom: 12 }}>
              Truffaire Labs
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              Analysing your<br /><strong style={{ fontWeight: 600 }}>{crop} leaf</strong>
            </h2>
            <p style={{ fontSize: 13, color: "#AAAAAA", marginTop: 12, fontWeight: 300 }}>
              Generating your diagnosis report.<br />This takes about 2 minutes.
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ["upload", "crop", "confirm"];
  const labels = ["Photo", "Crop", "Confirm"];
  const idx    = steps.indexOf(current);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: i <= idx ? (i === idx ? 24 : 8) : 8,
            height: 8, borderRadius: 100,
            background: i <= idx ? "#004643" : "#E8E8E8",
            transition: "all 0.3s",
          }} />
        </div>
      ))}
      <span style={{ fontSize: 11, color: "#AAAAAA", fontWeight: 400, marginLeft: 4 }}>
        {labels[Math.min(idx, 3)]}
      </span>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const sh2: React.CSSProperties = {
  fontSize: "clamp(24px,6vw,32px)", fontWeight: 300,
  letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 10,
};
const sp: React.CSSProperties = {
  fontSize: 14, fontWeight: 300, color: "#666666", lineHeight: 1.6,
};
const searchStyle: React.CSSProperties = {
  width: "100%", marginTop: 20, padding: "12px 16px",
  border: "1.5px solid #E8E8E8", borderRadius: 12,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#0C1618",
  outline: "none", background: "#FAFAFA",
};
const customCropBtn: React.CSSProperties = {
  width: "100%", marginTop: 8, padding: "12px 16px",
  background: "#e8f0ef", color: "#004643", border: "1.5px solid #004643",
  borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
  fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left",
};
