// ── CREDIT PACKS ──────────────────────────────────────────────
export const CREDIT_PACKS = [
  {
    id:       "starter",
    name:     "Starter",
    price:    199,
    credits:  3,
    perReport: 66,
    popular:  false,
    features: [
      "3 full diagnosis reports",
      "All crops and languages",
      "PDF download",
    ],
  },
  {
    id:       "farm",
    name:     "Farm Pack",
    price:    599,
    credits:  10,
    perReport: 59,
    popular:  true,
    features: [
      "10 full diagnosis reports",
      "History dashboard",
      "All crops and languages",
      "PDF download and re-download",
    ],
  },
  {
    id:       "agro",
    name:     "Agro Pack",
    price:    1299,
    credits:  30,
    perReport: 43,
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

// ── LANGUAGES ──────────────────────────────────────────────────
export const LANGUAGES = [
  "English", "Kannada", "Hindi", "Tamil", "Telugu", "Marathi",
  "Malayalam", "Bengali", "Punjabi", "Odia", "Gujarati", "Assamese",
  "Nepali", "Sinhala", "Arabic", "Spanish", "French", "Portuguese",
  "Swahili", "German", "Japanese", "Mandarin", "Amharic", "Farsi",
  "Turkish", "Russian", "Korean", "Italian", "Dutch", "Polish",
];

// ── MARQUEE LANGUAGES (display strip) ─────────────────────────
export const MARQUEE_LANGUAGES = [
  "English", "Kannada", "Hindi", "Tamil", "Telugu", "Marathi",
  "Malayalam", "Arabic", "Spanish", "French", "Swahili", "Portuguese",
  "Bengali", "Punjabi", "Nepali", "Japanese", "Mandarin", "German",
  "Amharic", "Sinhala",
];
