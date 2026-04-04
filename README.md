# TLS — Truffaire LeafScan

**A Truffaire Labs product.**
Precision leaf diagnosis for every crop, every language, every farm on earth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + Inline styles |
| Backend + DB | Convex |
| Auth | Clerk (Google OAuth only) |
| Diagnostic Engine | Truffaire Labs (internal) |
| PDF Report | @react-pdf/renderer |
| Payment | Razorpay |
| Hosting | Vercel |

---

## Setup Instructions

### 1. Clone and install

```bash
git clone https://github.com/truffaire/tls.git
cd tls
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

Copy the `VITE_CONVEX_URL` from the output.

### 3. Set up Clerk

1. Go to [clerk.com](https://clerk.com) and create a new app
2. Enable **Google** as the only sign-in method
3. Disable all other providers (email, phone, etc.)
4. Copy your `VITE_CLERK_PUBLISHABLE_KEY`
5. In Clerk dashboard → JWT Templates → Add Convex template

### 4. Set up Razorpay

1. Go to [razorpay.com](https://razorpay.com) and create an account
2. Get your test keys from Dashboard → Settings → API Keys
3. Add `VITE_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### 5. Set up Anthropic API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add to Convex environment variables (NOT .env — never expose to frontend):

```bash
npx convex env set ANTHROPIC_API_KEY sk-ant-xxxxx
```

### 6. Create .env file

```bash
cp .env.example .env
# Fill in all values
```

### 7. Run development

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — React frontend
npm run dev
```

---

## Deploy to Vercel

```bash
npm run build
vercel deploy
```

Set all environment variables in Vercel dashboard.
Set Convex environment variables via:
```bash
npx convex env set ANTHROPIC_API_KEY sk-ant-xxxxx
```

---

## Architecture

```
User opens tls.truffaire.in
        ↓
Clerk — Google OAuth login
        ↓
Convex — User profile created/retrieved
        ↓
Dashboard — Credit balance shown
        ↓
User taps "New Scan"
        ↓
Upload leaf + Select Crop + Language
        ↓
Taps "Diagnose"
        ↓
Convex checks credits
        ↓
Zero credits → Razorpay payment → Credits added
Credits available → 1 credit deducted
        ↓
Convex action → Truffaire Labs Engine
        ↓
Report generated + Unique ID assigned
        ↓
Saved to Convex DB
        ↓
User views report on screen
        ↓
Downloads 6-page branded PDF
        ↓
Saved to History dashboard
```

---

## Pricing

| Pack | Credits | Price | Per Report |
|---|---|---|---|
| Starter | 3 | ₹199 | ₹66 |
| Farm Pack | 10 | ₹599 | ₹59 |
| Agro Pack | 30 | ₹1299 | ₹43 |

---

## Company

**Truffaire Private Limited**
CIN: U01136KA2025PTC206761
Bengaluru, Karnataka, India
one@truffaire.in · tls.truffaire.in · truffaire.in
