# HerbHeal Compass — Merged & Fixed Dynamic System

This replaces the hardcoded herb data with a Postgres-backed system that
enriches itself daily. It's a merge of two earlier drafts, keeping what each
did well and fixing what didn't hold up under review.

## What was kept from each draft, and why

**From the "PubChem" draft:** the `HerbSymptom` join table with a `strength`
field, the daily-sync concept, and — most importantly — the
`/api/recommendations` endpoint. That endpoint *is* the "Compass" in
HerbHeal Compass, and it was missing entirely from the other draft.

**From the "ResearchLog / Trefle" draft:** the `directUrl` split for Prisma
(pooled connections break `prisma migrate`/`db push`), the `ResearchLog`
model for citation provenance instead of silently overwriting a JSON blob,
the `CRON_SECRET`-protected sync endpoint, pagination on `GET /api/herbs`,
and the more complete frontend (detail page, search, error/retry states).

## What was fixed

1. **PubChem was being queried with herb names.** PubChem resolves *chemical
   compound* names ("Curcumin"), not organisms ("Turmeric" or "Curcuma
   longa") — that call would 404 for nearly every herb. Fixed by adding a
   curated `knownCompounds: String[]` field per herb (populated at seed time,
   e.g. Turmeric → `["Curcumin"]`), and syncing *those* names against
   PubChem's `/compound/name/{name}/property/...` endpoint.
2. **PubMed titles were fabricated.** `esearch.fcgi` only returns a list of
   IDs — the original code then wrote a placeholder title
   ("Research Study on X") instead of the real one. Fixed by adding the
   required second call to `esummary.fcgi` to resolve real titles.
3. **`HerbSymptom.strength` was defined but never used.** The recommendation
   ranking summed a flat `matchCount * 10` regardless of relevance strength.
   Fixed: score is now `sum(strength of matched symptoms) + dosha bonus`,
   and the response includes the matched-symptom breakdown so the ranking is
   explainable, not a black box.
4. **No auth on the sync endpoint.** Anyone who found the URL could trigger
   repeated Wikipedia/PubChem/PubMed calls on your behalf. Fixed with a
   `CRON_SECRET` bearer check (kept from the second draft, applied everywhere).
5. **No Wikipedia `User-Agent`.** Wikipedia's API policy expects a
   descriptive header identifying the caller; requests without one risk
   throttling/403s. Added `WIKIPEDIA_USER_AGENT`.
6. **No rate limiting between herbs.** Both drafts hammered external APIs in
   a tight loop (one had no delay at all). Added explicit delays in
   `lib/daily-sync.ts` and `lib/pubchem.ts`.
7. **No input validation.** Neither draft validated request bodies. Added
   `zod` schemas (`lib/validation.ts`) for herb create/update and the
   recommendations request.
8. **Case-sensitive dosha filtering.** `String[].has()` in Prisma is
   case-sensitive; `?dosha=vata` silently returned nothing. Normalized.
9. **Missing `DELETE /api/herbs/[id]`** for a complete CRUD surface.
10. **Trefle, used in one draft for plant images:** its uptime has been
    inconsistent historically (a public shutdown was reported in 2021, and
    its current status is unclear from what's publicly checkable right now).
    Rather than depend on it, images come from Wikipedia's `thumbnail`/
    `originalimage` field, which is already being fetched anyway. If you
    want a dedicated plant-image source later, verify Trefle's current
    status yourself before wiring it back in, or use GBIF's media API as an
    alternative.

## Architecture

```
herbheal-compass/
├── prisma/
│   ├── schema.prisma        # Herb, Symptom, HerbSymptom (join+strength), ResearchLog
│   └── seed.ts
├── lib/
│   ├── prisma.ts            # singleton client
│   ├── wikipedia.ts         # description + image, with User-Agent
│   ├── pubchem.ts           # compound lookup by curated name, not herb name
│   ├── pubmed.ts            # esearch + esummary for real titles
│   ├── daily-sync.ts        # orchestrator with rate limiting + summary
│   └── validation.ts        # zod schemas
├── app/
│   ├── api/
│   │   ├── herbs/route.ts              # GET (search/filter/paginate), POST (create)
│   │   ├── herbs/[id]/route.ts         # GET, PUT, DELETE
│   │   ├── symptoms/route.ts           # GET (with herb counts)
│   │   ├── recommendations/route.ts    # POST — the Compass ranking logic
│   │   └── sync/daily/route.ts         # POST/GET, CRON_SECRET-protected
│   ├── page.tsx              # herb listing + search + symptom filters
│   ├── compass/page.tsx      # symptom+dosha -> ranked recommendations
│   └── herbs/[id]/page.tsx   # detail page with research-log provenance
├── components/                # HerbCard, HerbList, SearchBar, CompassForm, LoadingSkeleton
├── hooks/                      # useHerbs, useRecommendations (TanStack Query)
├── vercel.json                 # daily cron (Vercel Pro+; Hobby allows 1/day, this fits)
├── .github/workflows/daily-sync.yml  # free-tier cron fallback
└── .env.example
```

## API reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/herbs?q=&symptom=&dosha=&limit=&skip=` | Search/filter/paginate herbs |
| `POST` | `/api/herbs` | Create a herb (validated) |
| `GET` | `/api/herbs/:id` | Herb detail incl. symptoms + research logs |
| `PUT` | `/api/herbs/:id` | Update a herb (validated, partial) |
| `DELETE` | `/api/herbs/:id` | Delete a herb |
| `GET` | `/api/symptoms` | List symptoms with herb counts |
| `POST` | `/api/recommendations` | `{ symptoms: string[], dosha?, limit? }` → ranked herbs |
| `POST`/`GET` | `/api/sync/daily` | Runs the enrichment job. Requires `Authorization: Bearer $CRON_SECRET` |

## Setup

```bash
npm install

# 1. Create a free Postgres DB (Neon.tech recommended — gives you a pooled
#    URL and a direct URL out of the box) and fill in .env.local from
#    .env.example, including a generated CRON_SECRET:
#    openssl rand -hex 32

npx prisma generate
npx prisma db push
npm run db:seed

npm run dev
# http://localhost:3000  and  http://localhost:3000/compass
```

### Deploy

```bash
git push
# connect the repo on Vercel, add the same env vars there
```

Then either rely on `vercel.json`'s cron (Pro plan) or enable the GitHub
Actions workflow (add `CRON_SECRET` and `APP_URL` as repo secrets) — both
call the same protected endpoint, so pick whichever fits your plan.

## Known limitations worth knowing about

- `knownCompounds` is curated by hand at seed time — there's no automated
  "what compounds are in this herb" API to pull from for free, so this list
  needs to be maintained manually as you add herbs.
- PubMed's `esearch`/`esummary` are rate-limited to 3 req/sec without an API
  key, 10 req/sec with one — the sync job runs serially with delays to stay
  well under both.
- Vercel's Hobby plan only allows daily crons; the GitHub Actions fallback
  works on any plan and is what's actually recommended if you're not on Pro.
