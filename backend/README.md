# HerbHeal Compass – Backend

Conservation-aware medicinal plant search engine. Built with Flask, Pandas, scikit-learn.

Search by symptom or use case ("anxiety", "liver disease") and get back ranked
plant matches. Each result carries its IUCN conservation status, and any
plant flagged as at-risk (Vulnerable, Endangered, Critically Endangered) comes
with a suggested safer alternative that has a similar use profile.

## Project layout

```
backend/
  app.py                  # Flask app factory + entrypoint
  config.py                # env-driven settings
  requirements.txt
  .env.example
  data/
    plants.csv             # master dataset (demo: 40 plants)
  routes/
    health.py              # GET /health
    search.py               # GET /search
    plant.py                # GET /plant/<id>, GET /plants
  services/
    search_service.py       # TF-IDF search engine (loads CSV into memory)
    iucn_service.py          # optional live IUCN Red List lookup, cached
    cache_service.py          # simple in-memory TTL cache
  scripts/
    build_dataset.py         # merge raw sources into data/plants.csv
  tests/
    test_health.py, test_search.py, test_plant.py, test_app.py
```

## Setup

1. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in API tokens (IUCN and USDA keys are optional —
   the app works fully on the bundled CSV without them).
4. Run the dev server:
   ```
   python app.py
   ```
   or, in production, with gunicorn:
   ```
   gunicorn app:app
   ```

## API Endpoints

| Method | Path             | Description                                              |
|--------|------------------|------------------------------------------------------------|
| GET    | `/health`        | Service status + plant count                               |
| GET    | `/search`        | Search plants — `q` (required), `limit` (1-20, default 5), `system` |
| GET    | `/plant/<id>`    | Full plant detail, with live IUCN enrichment if configured  |
| GET    | `/plants`        | Lightweight listing of all plants + dataset stats           |
| POST   | `/reload`        | Hot-reload `data/plants.csv` (development only)             |

### Examples

```
curl "http://localhost:5000/search?q=anxiety"
curl "http://localhost:5000/search?q=liver+disease&system=Ayurveda"
curl "http://localhost:5000/plant/1"
curl "http://localhost:5000/plants"
curl "http://localhost:5000/health"
```

## Running tests

```
pip install -r requirements.txt   # includes pytest
pytest tests/ -v
```

17 tests cover health, search (ranking, limits, filters, empty results),
plant detail (found/not-found, safe-alternative logic), and the dev-only
reload endpoint.

## Data

`data/plants.csv` ships with 40 real medicinal plants spanning Ayurveda, TCM,
Native American, Western Herbalism, Unani, Aboriginal, and Pacific
traditional systems, each with realistic IUCN Red List statuses so the
risk/alternative logic has real endangered and critically endangered
examples to work with.

To expand the dataset with external sources (Kaggle medicinal-plant CSVs,
IUCN exports, etc.), drop raw files into `backend/raw/` and run:
```
python scripts/build_dataset.py
```
See the script's docstring for expected raw file formats.

## Notes on the IUCN integration

`services/iucn_service.py` calls IUCN's newer v4 API
(`api.iucnredlist.org`), which requires a token issued via IUCN's site and
uses an `Authorization` header. If no `IUCN_API_TOKEN` is set, or the
lookup fails for any reason, the app silently falls back to the
`iucn_status` column already in the CSV — live enrichment is a bonus, not
a dependency.
