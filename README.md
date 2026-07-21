---
title: HerbHeal Compass
emoji: 🌿
colorFrom: green
colorTo: teal
sdk: docker
app_port: 7860
pinned: false
---

# HerbHeal Compass — Complete Platform

HerbHeal Compass is a full-stack Ayurvedic intelligence platform providing real-time medicinal plant identification, symptom-based Ayurvedic recommendations, live market price tracking, and drug interaction safety checks.

---

## 🌟 The Four Compasses

1. **📷 Identification Compass**: Real-time species identification using Plant.id v3 AI, Gemini 1.5 Vision, and custom ML inference.
2. **🧭 Healing Compass**: Symptom-based herb matching engine factoring in individual Dosha alignment (Vata, Pitta, Kapha) and symptom strength scores.
3. **💰 Trade Compass**: Live market price monitoring feed for medicinal herbs with real-time price updates.
4. **🌿 Herbs Catalog**: Comprehensive database of 200+ medicinal herbs featuring Ayurvedic properties, taste profiles, target organs, and contraindications.
5. **💊 Safety Compass**: Drug-herb interaction checker querying contraindications, mechanism of action, and risk severity levels.

---

## 🚀 Hugging Face Spaces Deployment (Docker)

This repository includes a multi-stage `Dockerfile` configured specifically for **Hugging Face Spaces**.

### Hugging Face Space Metadata
To deploy directly on Hugging Face Spaces, create a new **Docker Space** and add the following frontmatter to your `README.md` on Hugging Face:

```yaml
---
title: HerbHeal Compass
emoji: 🌿
colorFrom: green
colorTo: teal
sdk: docker
app_port: 7860
pinned: false
---
```

### Environment Variables on Hugging Face
Add the following Secrets in your Hugging Face Space settings:

| Variable | Description |
|---|---|
| `DATABASE_URL` | `file:./prisma/dev.db` (or Supabase/Postgres connection string) |
| `PLANT_ID_API_KEY` | Plant.id API key (v3) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `CRON_SECRET` | Secret token for daily sync endpoints |

---

## 🛠️ Project Structure

```
herbheal-compass/
├── app/
│   ├── api/
│   │   ├── chat/              # Gemini AI Chatbot route
│   │   ├── health/            # Integration health diagnostic API
│   │   ├── herbs/             # Herbs search, filter & detail APIs
│   │   ├── identify/          # Plant.id + Gemini Vision plant identification
│   │   ├── interactions/      # Herb-drug interaction query API
│   │   ├── market-prices/     # Trade Compass price feed API
│   │   ├── recommendations/   # Symptom & Dosha matching engine
│   │   └── symptoms/          # Symptom index with herb counts
│   ├── compass/               # Healing Compass page
│   ├── herbs/                 # Catalog page
│   ├── identify/              # Identification page
│   ├── market/                # Trade Compass page
│   └── page.tsx               # Homepage with live demo
├── components/                # React UI components (AiChatbot, CameraCapture, SafetyCompass, etc.)
├── hooks/                     # TanStack Query custom hooks
├── lib/                       # Prisma client, Plant.id service, Gemini vision, Supabase client
├── prisma/                    # Schema, SQLite database & seed scripts
├── public/                    # Static assets & sample demo dataset
├── Dockerfile                 # Hugging Face Spaces multi-stage Docker build
└── next.config.js             # Next.js configuration with standalone output
```

---

## 💻 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Push database schema & seed initial data
npx prisma db push
node_modules/.bin/tsx scripts/seed-dynamic-data.ts

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application locally.

---

## 📄 License & Disclaimer

For educational and informational purposes only. Always consult a qualified healthcare practitioner before using any herbal remedies or combining herbs with prescription medications.
