// ── CREDIT PACKS ──────────────────────────────────────────────
export const CREDIT_PACKS = [
  {
    id:       "starter",
    name:     "Starter",
    price:    209,
    credits:  3,
    perReport: 69,
    popular:  false,
    features: [
      "3 full diagnosis reports",
      "All major crops supported",
      "PDF download",
    ],
  },
  {
    id:       "farm",
    name:     "Farm Pack",
    price:    629,
    credits:  10,
    perReport: 62,
    popular:  true,
    features: [
      "10 full diagnosis reports",
      "History dashboard",
      "All major crops supported",
      "PDF download and re-download",
    ],
  },
  {
    id:       "agro",
    name:     "Agro Pack",
    price:    1349,
    credits:  30,
    perReport: 44,
    popular:  false,
    features: [
      "30 full diagnosis reports",
      "Agronomist dashboard",
      "Multi-farmer management",
      "Priority processing",
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
