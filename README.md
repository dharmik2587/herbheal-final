# HerbHeal Compass

Conservation-aware medicinal plant search. Search by symptom, get ranked
plant matches with IUCN conservation status, and — for at-risk plants — a
suggested safer alternative with a similar use profile.

```
herbheal/
  backend/     Flask API — see backend/README.md
  frontend/    Static single-page UI — see frontend/README.md
```

## Quickstart

```bash
# 1. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py                     # runs on http://localhost:5000

# 2. Frontend (in a second terminal)
cd frontend
python -m http.server 8080        # then open http://localhost:8080
```

The frontend talks to the API on `:5000` by default in production
(same-origin) or `:5050` when opened directly as a file. If your backend
runs on a different port, set `window.HERBHEAL_API_BASE` — see
`frontend/README.md`.

## Tested

- Backend: 17 pytest cases covering health, search ranking/filters/limits,
  plant detail, safe-alternative suggestions, and the dev-only reload route.
- Frontend: verified live against the running API — search, traditional-system
  filter, result limit, plant detail modal, empty-state handling, and mobile
  layout all checked with rendered screenshots.

# herbheal-compass
