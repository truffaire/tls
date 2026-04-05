// ── SCAN / REPORT ─────────────────────────────────────────────
export interface ScanRequest {
  crop:     string;
  imageUrl: string;
}

export interface DiagnosisResult {
  primary:     string;
  secondary:   string | null;
  contributing: string | null;
  severity:    "Mild" | "Moderate" | "Severe";
  urgency:     string;
  observations: string[];
  causes:      string[];
  treatment:   TreatmentStep[];
  prevention:  string[];
  labTests:    string[];
  seasonalCalendar: SeasonalEntry[];
  scientificName: string;
}

export interface TreatmentStep {
  priority: string;
  treatment: string;
  product:  string;
  method:   string;
}

export interface SeasonalEntry {
  period: string;
  action: string;
}

export interface Report {
  _id:       string;
  reportId:  string;
  userId:    string;
  crop:      string;
  imageUrl:  string;
  diagnosis: DiagnosisResult;
  createdAt: number;
}

// ── USER ───────────────────────────────────────────────────────
export interface TLSUser {
  _id:       string;
  clerkId:   string;
  email:     string;
  name:      string;
  credits:   number;
  createdAt: number;
}

// ── PAYMENT ───────────────────────────────────────────────────
export interface PaymentOrder {
  orderId:  string;
  amount:   number;
  currency: string;
  packId:   string;
  credits:  number;
}
