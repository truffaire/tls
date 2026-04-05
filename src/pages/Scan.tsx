import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import { FEATURED_CROPS } from "@/lib/constants";
import { useTLSUser } from "@/lib/auth";

type Step = "upload" | "crop" | "location" | "soil" | "confirm" | "processing";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DATA_URL_PREFIX = "data:";
const MAX_PHOTOS = 3;

const SOIL_OPTIONS = [
  { id: "Red / Laterite",  label: "Red / Laterite",  sub: "Common in Karnataka, AP, TN" },
  { id: "Black Cotton",    label: "Black Cotton",    sub: "Common in Maharashtra, MP, Gujarat" },
  { id: "Alluvial",        label: "Alluvial",        sub: "Common in Punjab, UP, West Bengal" },
  { id: "Sandy",           label: "Sandy",           sub: "Common in Rajasthan, coastal areas" },
  { id: "Clay",            label: "Clay",            sub: "Heavy, water-retaining soil" },
  { id: "Loamy",           label: "Loamy",           sub: "Mixed, good fertility" },
];
const SOIL_DONT_KNOW = { id: "dont-know", label: "Don't know", sub: "Skip — we'll diagnose without soil data" };

export default function Scan() {
  const { user } = useTLSUser();
  const navigate     = useNavigate();
  const runDiagnosis = useAction(api.diagnoseAction.runDiagnosis);
  const credits      = useQuery(api.users.getCredits, { clerkId: user?.id ?? "" });

  const [step, setStep]               = useState<Step>("upload");
  const [images, setImages]           = useState<string[]>([]);
  const [imageB64s, setImageB64s]     = useState<string[]>([]);
  const [crop, setCrop]               = useState("");
  const [cropSearch, setCropSearch]   = useState("");
  const [location, setLocation]       = useState("");
  const [soilType, setSoilType]       = useState<string | null>(null);
  const language = "English";
  const [error, setError]             = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef                       = useRef<HTMLInputElement>(null);

  // ── Handle image file selection ──────────────────────────────
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

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result || !result.startsWith(DATA_URL_PREFIX)) {
        setError("Image could not be read correctly. Please try again.");
        e.target.value = "";
        return;
      }
      const b64 = result.split(",")[1];
      if (!b64) {
        setError("Image data is invalid. Please choose another file.");
        e.target.value = "";
        return;
      }
      setImages((prev) => [...prev, result]);
      setImageB64s((prev) => [...prev, b64]);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageB64s((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Run diagnosis ────────────────────────────────────────────
  const handleDiagnose = async () => {
    if (!user || imageB64s.length === 0 || !crop || isSubmitting) return;
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
        location: location.trim() || undefined,
        soilType: soilType && soilType !== "dont-know" ? soilType : undefined,
        imageUrl: images[0] ?? "",
        imageB64s,
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
                if (step === "upload")   navigate("/dashboard");
                else if (step === "crop")     setStep("upload");
                else if (step === "location") setStep("crop");
                else if (step === "soil")     setStep("location");
                else if (step === "confirm")  setStep("soil");
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
            <h2 style={sh2}>Upload your<br /><strong>leaf photos</strong></h2>
            <p style={sp}>Upload 1 to 3 photos of the affected leaf.</p>
            <p style={{ ...sp, fontSize: 12, color: "#AAAAAA", marginTop: 2 }}>More angles = more accurate diagnosis</p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* Thumbnails + add slot */}
            {images.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(images.length + (images.length < MAX_PHOTOS ? 1 : 0), MAX_PHOTOS)}, 1fr)`,
                gap: 10,
                marginTop: 24,
              }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1.5px solid #E8E8E8", aspectRatio: "1/1", background: "#FAFAFA" }}>
                    <img src={img} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", top: 6, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, color: "white", background: "rgba(0,0,0,0.55)", borderRadius: 10, padding: "2px 8px", fontFamily: "'DM Sans', sans-serif" }}>Photo {i + 1}</span>
                    </div>
                    <button
                      onClick={() => removeImage(i)}
                      style={{
                        position: "absolute", top: 5, right: 5,
                        width: 22, height: 22, borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)", border: "none",
                        cursor: "pointer", color: "white", fontSize: 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        lineHeight: 1, padding: 0, fontFamily: "sans-serif",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {images.length < MAX_PHOTOS && (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      borderRadius: 14,
                      border: "2px dashed #E8E8E8",
                      aspectRatio: "1/1",
                      cursor: "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      background: "#FAFAFA", gap: 4,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#004643"; (e.currentTarget as HTMLDivElement).style.background = "#e8f0ef"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E8E8E8"; (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"; }}
                  >
                    <div style={{ fontSize: 26, color: "#AAAAAA", lineHeight: 1 }}>+</div>
                    <div style={{ fontSize: 10, color: "#AAAAAA", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>Add Photo</div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty upload zone */
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  marginTop: 24, border: "2px dashed #E8E8E8", borderRadius: 20,
                  padding: "48px 20px", textAlign: "center", cursor: "pointer",
                  background: "#FAFAFA", transition: "all 0.18s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#004643"; (e.currentTarget as HTMLDivElement).style.background = "#e8f0ef"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E8E8E8"; (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"; }}
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
            )}

            {images.length > 0 && (
              <button
                onClick={() => setStep("crop")}
                style={{
                  width: "100%", marginTop: 20, padding: 16, borderRadius: 14,
                  background: "#004643", color: "white",
                  border: "none", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15, fontWeight: 500, cursor: "pointer",
                  letterSpacing: "0.01em",
                }}
              >
                Continue — {images.length} photo{images.length > 1 ? "s" : ""} selected
              </button>
            )}

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

            <input
              type="text"
              placeholder="Search or type any crop..."
              value={cropSearch}
              onChange={e => setCropSearch(e.target.value)}
              style={searchStyle}
            />

            {cropSearch && !FEATURED_CROPS.find(c => c.toLowerCase() === cropSearch.toLowerCase()) && (
              <button
                onClick={() => { setCrop(cropSearch); setStep("location"); }}
                style={customCropBtn}
              >
                Use "{cropSearch}"
              </button>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 14 }}>
              {filteredCrops.map((c) => (
                <div
                  key={c}
                  onClick={() => { setCrop(c); setStep("location"); }}
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

        {/* ── STEP: LOCATION ── */}
        {step === "location" && (
          <div>
            <h2 style={sh2}>Where is your<br /><strong>farm?</strong></h2>
            <p style={sp}>Helps improve diagnosis accuracy for your region.</p>

            <input
              type="text"
              placeholder="Enter your district or city — e.g. Chitradurga, Solapur, Nashik"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ ...searchStyle, marginTop: 24 }}
              autoFocus
            />

            <button
              onClick={() => setStep("soil")}
              disabled={!location.trim()}
              style={{
                width: "100%", marginTop: 16, padding: 16, borderRadius: 14,
                background: location.trim() ? "#004643" : "#E8E8E8",
                color: location.trim() ? "white" : "#AAAAAA",
                border: "none", fontFamily: "'DM Sans', sans-serif",
                fontSize: 15, fontWeight: 500,
                cursor: location.trim() ? "pointer" : "not-allowed",
                letterSpacing: "0.01em",
              }}
            >
              Continue
            </button>

            <button
              onClick={() => { setLocation(""); setStep("soil"); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#AAAAAA", fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, textDecoration: "underline",
                marginTop: 12, width: "100%", textAlign: "center", padding: 8,
                display: "block",
              }}
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── STEP: SOIL ── */}
        {step === "soil" && (
          <div>
            <h2 style={sh2}>What is your<br /><strong>soil type?</strong></h2>
            <p style={sp}>Helps improve diagnosis accuracy for your farm.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 24 }}>
              {SOIL_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setSoilType(opt.id); setStep("confirm"); }}
                  style={{
                    border: `1.5px solid ${soilType === opt.id ? "#004643" : "#E8E8E8"}`,
                    background: soilType === opt.id ? "#e8f0ef" : "white",
                    borderRadius: 14, padding: "14px 14px",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: soilType === opt.id ? "#004643" : "#0C1618", marginBottom: 3 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#AAAAAA", lineHeight: 1.4, fontWeight: 300 }}>
                    {opt.sub}
                  </div>
                </div>
              ))}

              {/* Don't know — full width */}
              <div
                onClick={() => { setSoilType(SOIL_DONT_KNOW.id); setStep("confirm"); }}
                style={{
                  gridColumn: "1 / -1",
                  border: `1.5px solid ${soilType === SOIL_DONT_KNOW.id ? "#004643" : "#E8E8E8"}`,
                  background: soilType === SOIL_DONT_KNOW.id ? "#e8f0ef" : "white",
                  borderRadius: 14, padding: "14px 14px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: soilType === SOIL_DONT_KNOW.id ? "#004643" : "#0C1618", marginBottom: 3 }}>
                  {SOIL_DONT_KNOW.label}
                </div>
                <div style={{ fontSize: 11, color: "#AAAAAA", lineHeight: 1.4, fontWeight: 300 }}>
                  {SOIL_DONT_KNOW.sub}
                </div>
              </div>
            </div>

            <button
              onClick={() => { setSoilType(null); setStep("confirm"); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#AAAAAA", fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, textDecoration: "underline",
                marginTop: 12, width: "100%", textAlign: "center", padding: 8,
                display: "block",
              }}
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === "confirm" && (
          <div>
            <h2 style={sh2}>Review and<br /><strong>diagnose</strong></h2>

            {/* Preview images */}
            {images.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(images.length, 3)}, 1fr)`,
                gap: 8, marginTop: 20,
              }}>
                {images.map((img, i) => (
                  <div key={i} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #E8E8E8", aspectRatio: "1/1" }}>
                    <img src={img} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div style={{ background: "#FAFAFA", borderRadius: 16, padding: "18px 16px", marginTop: 16 }}>
              {[
                { k: "Photos",    v: `${images.length} photo${images.length > 1 ? "s" : ""}` },
                { k: "Crop",      v: crop },
                ...(location ? [{ k: "Location", v: location }] : []),
                ...(soilType && soilType !== "dont-know" ? [{ k: "Soil Type", v: soilType }] : []),
                { k: "Cost",      v: "1 credit" },
                { k: "Balance",   v: `${credits ?? 0} credits` },
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
  const steps: Step[] = ["upload", "crop", "location", "soil", "confirm"];
  const labels = ["Photo", "Crop", "Location", "Soil", "Confirm"];
  const idx = steps.indexOf(current);

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
        {labels[Math.min(idx, steps.length - 1)]}
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
