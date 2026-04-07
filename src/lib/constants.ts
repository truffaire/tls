// ── CREDIT PACKS ──────────────────────────────────────────────
export const CREDIT_PACKS = [
  {
    id:        "single",
    name:      "Single",
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
    id:        "season",
    name:      "Season",
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
    id:        "pro",
    name:      "Pro",
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
    id:        "institution",
    name:      "Institution",
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

// ── CROPS ──────────────────────────────────────────────────────
export const FEATURED_CROPS = [
  "Pomegranate", "Rice", "Tomato", "Cotton", "Coffee", "Mango",
  "Wheat", "Chilli", "Coconut", "Grapes", "Sugarcane", "Banana",
  "Potato", "Brinjal", "Onion", "Papaya", "Tea", "Rubber",
  "Arecanut", "Cardamom", "Turmeric", "Ginger", "Pepper", "Soybean",
];
