// ── CREDIT PACKS (Razorpay payable plans) ─────────────────────
export const CREDIT_PACKS = [
  {
    id:        "scout",
    name:      "Scout",
    price:     119,
    credits:   1,
    perReport: 119,
    popular:   false,
    features: [
      "1 full diagnosis report",
      "All crops supported",
      "PDF download",
    ],
  },
  {
    id:        "advisor",
    name:      "Advisor",
    price:     599,
    credits:   10,
    perReport: 59,
    popular:   true,
    features: [
      "10 full diagnosis reports",
      "Valid for 90 days",
      "History dashboard",
      "PDF download and re-download",
    ],
  },
  {
    id:        "agronomist",
    name:      "Agronomist",
    price:     2499,
    credits:   100,
    perReport: 24,
    popular:   false,
    features: [
      "100 full diagnosis reports",
      "History dashboard",
      "All crops supported",
      "Priority processing",
    ],
  },
  {
    id:        "extension",
    name:      "Extension",
    price:     7999,
    credits:   300,
    perReport: 26,
    popular:   false,
    features: [
      "300 full diagnosis reports",
      "Multi-farmer management",
      "Priority processing",
      "Dedicated support",
    ],
  },
] as const;

// ── ENTERPRISE PLAN (contact-only, no Razorpay) ───────────────
export const ENTERPRISE_PLAN = {
  id:      "enterprise",
  name:    "Enterprise",
  tagline: "For institutions, governments and large FPOs",
  features: [
    "300+ reports — custom volume",
    "Multi-user management",
    "Dedicated account support",
    "Custom integrations available",
  ],
} as const;

// ── CROPS ──────────────────────────────────────────────────────
export const FEATURED_CROPS = [
  "Pomegranate", "Rice", "Tomato", "Cotton", "Coffee", "Mango",
  "Wheat", "Chilli", "Coconut", "Grapes", "Sugarcane", "Banana",
  "Potato", "Brinjal", "Onion", "Papaya", "Tea", "Rubber",
  "Arecanut", "Cardamom", "Turmeric", "Ginger", "Pepper", "Soybean",
];
