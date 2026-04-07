import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navbar from "@/components/Navbar";
import { FEATURED_CROPS } from "@/lib/constants";
import { useTLSUser } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
const MAX_PHOTOS = 6;
const MAX_SIZE   = 5 * 1024 * 1024;
const ACCEPTED   = ["image/jpeg", "image/png", "image/webp"];

const PLANT_PARTS: PlantPart[]   = ["Leaf", "Stem", "Fruit", "Flower", "Root"];
const GROWTH_STAGES: GrowthStage[] = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest Ready"];
const ACTIVITIES: Activity[]     = ["Pesticide", "Pruned", "Irrigation", "Fertilizer"];

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
type PlantPart       = "Leaf" | "Stem" | "Fruit" | "Flower" | "Root";
type GrowthStage     = "Seedling" | "Vegetative" | "Flowering" | "Fruiting" | "Harvest Ready";
type SymptomDuration = "Just noticed" | "~1 week" | "2+ weeks";
type SpreadExtent    = "1-2 plants" | "Part of field" | "Spreading fast";
type Activity        = "Pesticide" | "Pruned" | "Irrigation" | "Fertilizer";

interface Photo { dataUrl: string; b64: string; tag: PlantPart; }

// ─────────────────────────────────────────────────────────────
//  Palette
// ─────────────────────────────────────────────────────────────
const C = {
  teal: "#004643", pale: "#e8f0ef", dark: "#0C1618",
  border: "#E8E8E8", muted: "#AAAAAA", bg: "#FAFAFA",
  err: "#FEE2E2", errText: "#991B1B",
} as const;

// ─────────────────────────────────────────────────────────────
//  Shared styles
// ─────────────────────────────────────────────────────────────
const sh2: React.CSSProperties = {
  fontSize: "clamp(24px,6vw,32px)", fontWeight: 300,
  letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 10,
  fontFamily: "'DM Sans', sans-serif",
};
const sp: React.CSSProperties = {
  fontSize: 14, fontWeight: 300, color: "#666", lineHeight: 1.6,
  fontFamily: "'DM Sans', sans-serif",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", border: `1.5px solid ${C.border}`,
  borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  color: C.dark, outline: "none", background: C.bg, boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  width: "100%", padding: 16, borderRadius: 14, background: C.teal,
  color: "white", border: "none", fontFamily: "'DM Sans', sans-serif",
  fontSize: 15, fontWeight: 500, cursor: "pointer", letterSpacing: "0.01em",
  display: "block",
};

// ─────────────────────────────────────────────────────────────
//  Icon component — all inline SVG, stroke style, 20x20 grid
// ─────────────────────────────────────────────────────────────
type IconKey = "Leaf" | "Stem" | "Fruit" | "Flower" | "Root"
  | "Seedling" | "Vegetative" | "Flowering2" | "Fruiting2" | "Harvest"
  | "Pesticide" | "Pruned" | "Irrigation" | "Fertilizer"
  | "GPS" | "Pin" | "Upload";

function Icon({ n, size = 18 }: { n: IconKey; size?: number }) {
  const sw = { fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s2 = { ...sw, strokeWidth: "1.5" };
  switch (n) {
    case "Leaf":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...sw}><path d="M10 17C10 17 3 13 3 8C3 4 6.5 2 10 4C13.5 2 17 4 17 8C17 13 10 17 10 17Z"/><line x1="10" y1="17" x2="10" y2="6"/></svg>;
    case "Stem":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...sw}><line x1="10" y1="2" x2="10" y2="18"/><line x1="10" y1="6" x2="14" y2="4"/><line x1="10" y1="11" x2="6" y2="9"/><line x1="10" y1="15" x2="13" y2="13"/></svg>;
    case "Fruit":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...sw}><circle cx="10" cy="12" r="6"/><path d="M10 6C10 4 12 2.5 14 3"/></svg>;
    case "Flower":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><circle cx="10" cy="10" r="2"/><ellipse cx="10" cy="5" rx="1.8" ry="2.8"/><ellipse cx="10" cy="15" rx="1.8" ry="2.8"/><ellipse cx="5" cy="10" rx="2.8" ry="1.8"/><ellipse cx="15" cy="10" rx="2.8" ry="1.8"/></svg>;
    case "Root":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...sw}><line x1="10" y1="2" x2="10" y2="9"/><path d="M10 9L6 16"/><path d="M10 9L14 16"/><path d="M7.5 13L5 18"/><path d="M12.5 13L15 18"/></svg>;
    case "Seedling":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...sw}><line x1="10" y1="18" x2="10" y2="10"/><path d="M10 10C10 6 6 4 4 6C6 8 10 10 10 10Z"/><path d="M10 10C10 6 14 4 16 6C14 8 10 10 10 10Z"/></svg>;
    case "Vegetative":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><path d="M10 17C6 15 2 11 2 7C2 3 6 1.5 10 4C14 1.5 18 3 18 7C18 11 14 15 10 17Z"/><line x1="10" y1="17" x2="10" y2="5"/><line x1="10" y1="9" x2="7" y2="7"/><line x1="10" y1="13" x2="13" y2="11"/></svg>;
    case "Flowering2":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><circle cx="10" cy="10" r="2"/><ellipse cx="10" cy="5" rx="1.8" ry="2.8"/><ellipse cx="10" cy="15" rx="1.8" ry="2.8"/><ellipse cx="5" cy="10" rx="2.8" ry="1.8"/><ellipse cx="15" cy="10" rx="2.8" ry="1.8"/></svg>;
    case "Fruiting2":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...sw}><circle cx="10" cy="12" r="6"/><path d="M10 6C10 4 12 2.5 14 3"/></svg>;
    case "Harvest":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><line x1="10" y1="18" x2="10" y2="8"/><ellipse cx="10" cy="5.5" rx="2" ry="3"/><line x1="6" y1="18" x2="6" y2="11"/><ellipse cx="6" cy="8" rx="1.5" ry="2.5"/><line x1="14" y1="18" x2="14" y2="11"/><ellipse cx="14" cy="8" rx="1.5" ry="2.5"/></svg>;
    case "Pesticide":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><path d="M8 7V5H12V7"/><rect x="6" y="7" width="8" height="11" rx="2"/><line x1="15" y1="5" x2="17" y2="3"/><line x1="15" y1="8" x2="18" y2="8"/><line x1="15" y1="11" x2="17" y2="13"/></svg>;
    case "Pruned":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><circle cx="5" cy="15" r="2.5"/><circle cx="5" cy="5" r="2.5"/><line x1="7" y1="13" x2="18" y2="3"/><line x1="7" y1="7" x2="18" y2="17"/></svg>;
    case "Irrigation":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><path d="M10 2C10 2 5 8 5 13C5 16 7 18 10 18C13 18 15 16 15 13C15 8 10 2 10 2Z"/></svg>;
    case "Fertilizer":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><rect x="4" y="8" width="12" height="10" rx="2"/><path d="M7 8C7 5.5 8.5 3 10 3C11.5 3 13 5.5 13 8"/><line x1="10" y1="11" x2="10" y2="15"/><line x1="8" y1="13" x2="12" y2="13"/></svg>;
    case "GPS":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><circle cx="10" cy="10" r="3"/><line x1="10" y1="1" x2="10" y2="5"/><line x1="10" y1="15" x2="10" y2="19"/><line x1="1" y1="10" x2="5" y2="10"/><line x1="15" y1="10" x2="19" y2="10"/></svg>;
    case "Pin":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...s2}><path d="M10 2C7.24 2 5 4.24 5 7C5 11 10 18 10 18C10 18 15 11 15 7C15 4.24 12.76 2 10 2Z"/><circle cx="10" cy="7" r="2"/></svg>;
    case "Upload":
      return <svg width={size} height={size} viewBox="0 0 20 20" {...sw}><polyline points="13 7 10 4 7 7"/><line x1="10" y1="4" x2="10" y2="14"/><path d="M3 15C3 16.1 3.9 17 5 17H15C16.1 17 17 16.1 17 15"/></svg>;
    default:
      return null;
  }
}

// Map PlantPart → IconKey
function partIconKey(p: PlantPart): IconKey {
  return p as IconKey;
}
// Map GrowthStage → IconKey
function stageIconKey(s: GrowthStage): IconKey {
  switch (s) {
    case "Seedling":      return "Seedling";
    case "Vegetative":    return "Vegetative";
    case "Flowering":     return "Flowering2";
    case "Fruiting":      return "Fruiting2";
    case "Harvest Ready": return "Harvest";
  }
}
// Map Activity → IconKey
function activityIconKey(a: Activity): IconKey {
  return a as IconKey;
}

// ─────────────────────────────────────────────────────────────
//  Small helper components
// ─────────────────────────────────────────────────────────────
function SectionLabel({ children, mt = 0 }: { children: React.ReactNode; mt?: number }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted, marginBottom: 10, marginTop: mt, fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </div>
  );
}

function OptLabel() {
  return <span style={{ fontSize: 9, color: C.muted, textTransform: "none", letterSpacing: 0, marginLeft: 4, fontWeight: 400 }}>optional</span>;
}

function ErrBox({ msg }: { msg: string }) {
  return msg ? (
    <div style={{ background: C.err, color: C.errText, borderRadius: 10, padding: "12px 14px", marginTop: 14, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
      {msg}
    </div>
  ) : null;
}

function ProgressBar({ screen }: { screen: 1 | 2 | 3 }) {
  const labels = ["Upload", "Details", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {([1, 2, 3] as const).map((s) => (
        <div key={s} style={{ width: s === screen ? 28 : 8, height: 8, borderRadius: 100, background: s <= screen ? C.teal : C.border, transition: "all 0.3s" }} />
      ))}
      <span style={{ fontSize: 11, color: C.muted, marginLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>
        {labels[screen - 1]}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PhotoCard
// ─────────────────────────────────────────────────────────────
function PhotoCard({ photo, index, onRemove, onTag }: {
  photo: Photo; index: number;
  onRemove: (i: number) => void;
  onTag: (i: number, tag: PlantPart) => void;
}) {
  return (
    <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
      {/* Thumbnail */}
      <div style={{ position: "relative" }}>
        <img
          src={photo.dataUrl}
          alt={`Photo ${index + 1}`}
          style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
        />
        <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "3px 8px", fontFamily: "'DM Sans', sans-serif" }}>
          Photo {index + 1}
        </span>
        <button
          onClick={() => onRemove(index)}
          style={{ position: "absolute", top: 7, right: 7, width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", color: "#fff", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}
        >×</button>
      </div>

      {/* Tag selector */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Tag this photo
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {PLANT_PARTS.map((part) => {
            const sel = photo.tag === part;
            return (
              <button
                key={part}
                onClick={() => onTag(index, part)}
                title={part}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4, padding: "8px 2px",
                  border: `1.5px solid ${sel ? C.teal : C.border}`,
                  borderRadius: 10,
                  background: sel ? C.pale : "#fff",
                  color: sel ? C.teal : C.muted,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Icon n={partIconKey(part)} size={16} />
                <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: sel ? 600 : 400 }}>{part}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Screen 1 — Upload & Tag
// ─────────────────────────────────────────────────────────────
function Screen1({ photos, fileRef, error, onFileChange, onRemove, onTag, onContinue }: {
  photos: Photo[];
  fileRef: React.RefObject<HTMLInputElement>;
  error: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
  onTag: (i: number, tag: PlantPart) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h2 style={sh2}>Upload your<br /><strong>plant photos</strong></h2>
      <p style={sp}>Upload 1–6 photos. Tag each by plant part for best results.</p>
      <p style={{ ...sp, fontSize: 12, color: C.muted, marginTop: 2 }}>More angles = more accurate diagnosis</p>

      {photos.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          style={{ marginTop: 24, border: `2px dashed ${C.border}`, borderRadius: 20, padding: "48px 20px", textAlign: "center", cursor: "pointer", background: C.bg, transition: "all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = C.pale; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}
        >
          <div style={{ width: 48, height: 48, background: "#fff", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Tap to add photo</div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, fontFamily: "'DM Sans', sans-serif" }}>Camera or gallery · JPG, PNG, WEBP · Max 5MB</div>
        </div>
      ) : (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {photos.map((photo, i) => (
            <PhotoCard key={i} photo={photo} index={i} onRemove={onRemove} onTag={onTag} />
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: "16px", background: C.bg, cursor: "pointer", color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = C.pale; (e.currentTarget as HTMLButtonElement).style.color = C.teal; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; (e.currentTarget as HTMLButtonElement).style.color = C.muted; }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
              Add another photo ({photos.length}/{MAX_PHOTOS})
            </button>
          )}
        </div>
      )}

      <ErrBox msg={error} />

      {photos.length > 0 && (
        <button onClick={onContinue} style={{ ...primaryBtn, marginTop: 20 }}>
          Continue — {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Screen 2 — Crop & Context
// ─────────────────────────────────────────────────────────────
function Screen2({
  crop, cropSearch, setCrop, setCropSearch, filteredCrops,
  growthStage, setGrowthStage,
  location, setLocation, locationLoading, onDetectLocation,
  symptomDuration, setSymptomDuration,
  spreadExtent, setSpreadExtent,
  recentActivity, setRecentActivity,
  onContinue,
}: {
  crop: string; cropSearch: string;
  setCrop: (v: string) => void; setCropSearch: (v: string) => void;
  filteredCrops: string[];
  growthStage: GrowthStage | null; setGrowthStage: (v: GrowthStage) => void;
  location: string; setLocation: (v: string) => void;
  locationLoading: boolean; onDetectLocation: () => void;
  symptomDuration: SymptomDuration | null; setSymptomDuration: (v: SymptomDuration) => void;
  spreadExtent: SpreadExtent | null; setSpreadExtent: (v: SpreadExtent) => void;
  recentActivity: Activity[]; setRecentActivity: (v: Activity[]) => void;
  onContinue: () => void;
}) {
  const [editingLoc, setEditingLoc] = useState(false);

  const toggleActivity = (a: Activity) =>
    setRecentActivity(
      recentActivity.includes(a)
        ? recentActivity.filter((x) => x !== a)
        : [...recentActivity, a]
    );

  // Visible crops: first 8 by default, all matches when searching
  const visibleCrops = cropSearch.trim()
    ? filteredCrops
    : FEATURED_CROPS.slice(0, 8);

  const stageShortLabel: Record<GrowthStage, string> = {
    "Seedling":      "Seedling",
    "Vegetative":    "Vegetative",
    "Flowering":     "Flowering",
    "Fruiting":      "Fruiting",
    "Harvest Ready": "Harvest\nReady",
  };

  return (
    <div>
      <h2 style={sh2}>Crop and<br /><strong>context</strong></h2>
      <p style={sp}>Fill in as much as you can for a more accurate diagnosis.</p>

      {/* ── Crop ── */}
      <SectionLabel mt={24}>Crop</SectionLabel>
      <input
        type="text"
        placeholder="Search or type any crop…"
        value={cropSearch}
        onChange={e => setCropSearch(e.target.value)}
        style={inputStyle}
      />
      {cropSearch.trim() && !FEATURED_CROPS.find(c => c.toLowerCase() === cropSearch.toLowerCase()) && (
        <button
          onClick={() => { setCrop(cropSearch.trim()); setCropSearch(""); }}
          style={{ width: "100%", marginTop: 8, padding: "12px 16px", background: C.pale, color: C.teal, border: `1.5px solid ${C.teal}`, borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left" }}
        >
          Use "{cropSearch}"
        </button>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 10 }}>
        {visibleCrops.map((c) => (
          <div
            key={c}
            onClick={() => { setCrop(c); setCropSearch(""); }}
            style={{ border: `1.5px solid ${crop === c ? C.teal : C.border}`, background: crop === c ? C.pale : "#fff", borderRadius: 12, padding: "11px 14px", cursor: "pointer", fontSize: 13, color: crop === c ? C.teal : C.dark, transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", fontWeight: crop === c ? 500 : 400 }}
          >
            {c}
          </div>
        ))}
      </div>
      {crop && !FEATURED_CROPS.slice(0, 8).includes(crop as any) && !cropSearch && (
        <div style={{ marginTop: 8, padding: "11px 14px", border: `1.5px solid ${C.teal}`, background: C.pale, borderRadius: 12, fontSize: 13, color: C.teal, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          ✓ {crop}
        </div>
      )}

      {/* ── Growth Stage ── */}
      <SectionLabel mt={24}>Growth Stage <OptLabel /></SectionLabel>
      <div style={{ display: "flex", gap: 6 }}>
        {GROWTH_STAGES.map((stage) => {
          const sel = growthStage === stage;
          return (
            <button
              key={stage}
              onClick={() => setGrowthStage(stage)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 2px", border: `1.5px solid ${sel ? C.teal : C.border}`, borderRadius: 12, background: sel ? C.pale : "#fff", color: sel ? C.teal : C.muted, cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif" }}
            >
              <Icon n={stageIconKey(stage)} size={18} />
              <span style={{ fontSize: 9, textAlign: "center", lineHeight: 1.3, fontWeight: sel ? 600 : 400, whiteSpace: "pre-wrap" }}>
                {stageShortLabel[stage]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Location ── */}
      <SectionLabel mt={24}>Location <OptLabel /></SectionLabel>
      {editingLoc ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="e.g. Chitradurga, Karnataka"
            value={location}
            onChange={e => setLocation(e.target.value)}
            autoFocus
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={() => setEditingLoc(false)}
            style={{ padding: "0 16px", background: C.teal, color: "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", flexShrink: 0 }}
          >
            Done
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <div
            onClick={() => setEditingLoc(true)}
            style={{ flex: 1, padding: "13px 14px", border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.bg, fontSize: 14, color: location ? C.dark : C.muted, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, minHeight: 46 }}
          >
            {locationLoading ? (
              <span style={{ color: C.muted, fontSize: 13 }}>Detecting location…</span>
            ) : location ? (
              <>
                <span style={{ color: C.teal, flexShrink: 0 }}><Icon n="Pin" size={14} /></span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
              </>
            ) : (
              <span style={{ fontSize: 13 }}>Tap to detect or enter location</span>
            )}
          </div>
          <button
            onClick={onDetectLocation}
            disabled={locationLoading}
            title="Auto-detect GPS location"
            style={{ width: 46, border: `1.5px solid ${C.border}`, borderRadius: 12, background: "#fff", cursor: locationLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal, flexShrink: 0 }}
          >
            <Icon n="GPS" size={18} />
          </button>
        </div>
      )}

      {/* ── Symptom Duration ── */}
      <SectionLabel mt={24}>How long have you noticed this? <OptLabel /></SectionLabel>
      <div style={{ display: "flex", gap: 8 }}>
        {(["Just noticed", "~1 week", "2+ weeks"] as SymptomDuration[]).map((d) => {
          const sel = symptomDuration === d;
          return (
            <button key={d} onClick={() => setSymptomDuration(d)} style={{ flex: 1, padding: "11px 4px", border: `1.5px solid ${sel ? C.teal : C.border}`, borderRadius: 12, background: sel ? C.pale : "#fff", color: sel ? C.teal : C.dark, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: sel ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
              {d}
            </button>
          );
        })}
      </div>

      {/* ── Spread Extent ── */}
      <SectionLabel mt={20}>How many plants affected? <OptLabel /></SectionLabel>
      <div style={{ display: "flex", gap: 8 }}>
        {(["1-2 plants", "Part of field", "Spreading fast"] as SpreadExtent[]).map((s) => {
          const sel = spreadExtent === s;
          return (
            <button key={s} onClick={() => setSpreadExtent(s)} style={{ flex: 1, padding: "11px 4px", border: `1.5px solid ${sel ? C.teal : C.border}`, borderRadius: 12, background: sel ? C.pale : "#fff", color: sel ? C.teal : C.dark, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: sel ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
              {s}
            </button>
          );
        })}
      </div>

      {/* ── Recent Activity ── */}
      <SectionLabel mt={20}>Recent farm activity <OptLabel /></SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        {ACTIVITIES.map((a) => {
          const sel = recentActivity.includes(a);
          return (
            <button
              key={a}
              onClick={() => toggleActivity(a)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `1.5px solid ${sel ? C.teal : C.border}`, borderRadius: 12, background: sel ? C.pale : "#fff", color: sel ? C.teal : C.dark, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: sel ? 500 : 400, cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
            >
              <span style={{ color: sel ? C.teal : C.muted, flexShrink: 0 }}>
                <Icon n={activityIconKey(a)} size={18} />
              </span>
              {a}
            </button>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        disabled={!crop}
        style={{ ...primaryBtn, marginTop: 28, background: crop ? C.teal : C.border, color: crop ? "#fff" : C.muted, cursor: crop ? "pointer" : "not-allowed" }}
      >
        Continue
      </button>
      {!crop && (
        <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
          Select a crop to continue
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Screen 3 — Confirm & Run
// ─────────────────────────────────────────────────────────────
function Screen3({ photos, crop, growthStage, location, symptomDuration, spreadExtent, recentActivity, credits, isSubmitting, error, onRun }: {
  photos: Photo[]; crop: string;
  growthStage: GrowthStage | null; location: string;
  symptomDuration: SymptomDuration | null; spreadExtent: SpreadExtent | null;
  recentActivity: Activity[]; credits: number;
  isSubmitting: boolean; error: string; onRun: () => void;
}) {
  const parts = [...new Set(photos.map((p) => p.tag))];

  if (isSubmitting) {
    return (
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${C.pale}`, borderTopColor: C.teal, animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: C.teal, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
          Truffaire Labs
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>
          Analysing your<br /><strong style={{ fontWeight: 600 }}>{crop}</strong>
        </h2>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 12, fontWeight: 300, fontFamily: "'DM Sans', sans-serif" }}>
          Generating your diagnosis report.<br />This takes about 2 minutes.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const summaryRows = [
    { k: "Crop",        v: crop },
    { k: "Plant Parts", v: parts.join(", ") },
    ...(growthStage    ? [{ k: "Stage",    v: growthStage }]              : []),
    ...(location       ? [{ k: "Location", v: location }]                 : []),
    ...(symptomDuration ? [{ k: "Duration", v: symptomDuration }]         : []),
    ...(spreadExtent   ? [{ k: "Affected", v: spreadExtent }]             : []),
    ...(recentActivity.length ? [{ k: "Recent", v: recentActivity.join(", ") }] : []),
    { k: "Cost",    v: "1 credit" },
    { k: "Balance", v: `${credits} credit${credits !== 1 ? "s" : ""}` },
  ];

  return (
    <div>
      <h2 style={sh2}>Review and<br /><strong>run diagnosis</strong></h2>

      {/* Photo thumbnails with part tags */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {photos.map((p, i) => (
          <div key={i} style={{ position: "relative", width: 68, height: 68, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, flexShrink: 0 }}>
            <img src={p.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="" />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", padding: "3px 0", textAlign: "center" }}>
              <span style={{ fontSize: 9, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>{p.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary card */}
      <div style={{ background: C.bg, borderRadius: 16, padding: "18px 16px", marginTop: 16 }}>
        {summaryRows.map((row, i) => (
          <div key={row.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: i < summaryRows.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{row.k}</span>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", textAlign: "right", maxWidth: "62%", lineHeight: 1.4 }}>{row.v}</span>
          </div>
        ))}
      </div>

      <ErrBox msg={error} />

      <button
        onClick={onRun}
        disabled={credits < 1}
        style={{ ...primaryBtn, marginTop: 20, background: credits < 1 ? C.border : C.teal, color: credits < 1 ? C.muted : "#fff", cursor: credits < 1 ? "not-allowed" : "pointer" }}
      >
        {credits < 1 ? "No credits — Buy a pack first" : "Run Full Crop Diagnosis — 1 Credit"}
      </button>
      <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
        Results in under 2 minutes
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
export default function Scan() {
  const { user }     = useTLSUser();
  const navigate     = useNavigate();
  const runDiagnosis = useAction(api.diagnoseAction.runDiagnosis);
  const credits      = useQuery(api.users.getCredits, { clerkId: user?.id ?? "" });

  // Screen
  const [screen, setScreen] = useState<1 | 2 | 3>(1);

  // Screen 1
  const [photos, setPhotos] = useState<Photo[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  // Screen 2
  const [crop, setCrop]                       = useState("");
  const [cropSearch, setCropSearch]           = useState("");
  const [growthStage, setGrowthStage]         = useState<GrowthStage | null>(null);
  const [location, setLocation]               = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [symptomDuration, setSymptomDuration] = useState<SymptomDuration | null>(null);
  const [spreadExtent, setSpreadExtent]       = useState<SpreadExtent | null>(null);
  const [recentActivity, setRecentActivity]   = useState<Activity[]>([]);

  // Submission
  const [runError, setRunError]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if no credits
  useEffect(() => {
    if (credits === 0) navigate("/dashboard");
  }, [credits, navigate]);

  // ── GPS ──────────────────────────────────────────────────────
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const city  = addr.city || addr.town || addr.village || addr.county || "";
          const state = addr.state || "";
          setLocation(
            city && state
              ? `${city}, ${state}`
              : data.display_name?.split(",").slice(0, 2).join(",").trim()
                ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );
        } catch { /* silently fail */ }
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { timeout: 10000 }
    );
  }, []);

  // Auto-detect GPS on screen 2 mount
  useEffect(() => {
    if (screen === 2 && !location) detectLocation();
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Photo handling ────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setUploadError("Upload a JPG, PNG, or WEBP image only.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError("Image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }
    setUploadError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result?.startsWith("data:")) {
        setUploadError("Image could not be read. Please try again.");
        e.target.value = "";
        return;
      }
      const b64 = result.split(",")[1];
      if (!b64) { e.target.value = ""; return; }
      setPhotos((prev) => [...prev, { dataUrl: result, b64, tag: "Leaf" }]);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  const setPhotoTag = (i: number, tag: PlantPart) =>
    setPhotos((prev) => prev.map((p, idx) => idx === i ? { ...p, tag } : p));

  // ── Run diagnosis ────────────────────────────────────────────
  const handleDiagnose = async () => {
    if (!user || photos.length === 0 || !crop || isSubmitting) return;
    if ((credits ?? 0) < 1) {
      setRunError("Insufficient credits. Please buy a pack.");
      return;
    }
    setRunError("");
    setIsSubmitting(true);
    try {
      const result = await runDiagnosis({
        clerkId:  user.id,
        crop,
        location: location.trim() || undefined,
        soilType: undefined,
        imageUrl: photos[0]?.dataUrl ?? "",
        imageB64s: photos.map((p) => p.b64),
      });
      navigate(`/report/${result.reportId}`);
    } catch (err: any) {
      setRunError(err.message ?? "Diagnosis failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const filteredCrops = FEATURED_CROPS.filter((c) =>
    c.toLowerCase().includes(cropSearch.toLowerCase())
  );

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ padding: "80px 24px 60px", maxWidth: 480, margin: "0 auto" }}>

        {/* Back + Progress */}
        {!isSubmitting && (
          <div style={{ marginBottom: 28 }}>
            {screen > 1 && (
              <button
                onClick={() => setScreen((s) => (s - 1) as 1 | 2 | 3)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: 16, padding: 0, display: "flex", alignItems: "center", gap: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
            )}
            <ProgressBar screen={screen} />
          </div>
        )}

        {screen === 1 && (
          <Screen1
            photos={photos}
            fileRef={fileRef}
            error={uploadError}
            onFileChange={handleFileChange}
            onRemove={removePhoto}
            onTag={setPhotoTag}
            onContinue={() => { setUploadError(""); setScreen(2); }}
          />
        )}

        {screen === 2 && (
          <Screen2
            crop={crop}
            cropSearch={cropSearch}
            setCrop={setCrop}
            setCropSearch={setCropSearch}
            filteredCrops={filteredCrops}
            growthStage={growthStage}
            setGrowthStage={setGrowthStage}
            location={location}
            setLocation={setLocation}
            locationLoading={locationLoading}
            onDetectLocation={detectLocation}
            symptomDuration={symptomDuration}
            setSymptomDuration={setSymptomDuration}
            spreadExtent={spreadExtent}
            setSpreadExtent={setSpreadExtent}
            recentActivity={recentActivity}
            setRecentActivity={setRecentActivity}
            onContinue={() => { setRunError(""); setScreen(3); }}
          />
        )}

        {screen === 3 && (
          <Screen3
            photos={photos}
            crop={crop}
            growthStage={growthStage}
            location={location}
            symptomDuration={symptomDuration}
            spreadExtent={spreadExtent}
            recentActivity={recentActivity}
            credits={credits ?? 0}
            isSubmitting={isSubmitting}
            error={runError}
            onRun={handleDiagnose}
          />
        )}
      </div>

      {/* Hidden file input — shared across all screens */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
