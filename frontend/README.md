# HerbHeal Compass — Frontend

A single static page (`index.html`) — no build step, no dependencies.

## Run it

1. Start the backend first (see `../backend/README.md`). By default it's expected at `http://127.0.0.1:5050` or `http://127.0.0.1:5000`.
2. Serve this folder with any static server, for example:
   ```
   cd frontend
   python -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser.

## Pointing at a different API

By default the page calls the API on the same origin it's served from. If you're
opening `index.html` directly as a `file://` URL, it falls back to `http://127.0.0.1:5050`.

To point at a different backend URL, set it before the page's script runs by adding
this to `index.html` (or in the browser console before reloading):

```html
<script>window.HERBHEAL_API_BASE = "http://localhost:5000";</script>
```

## What it does

- Searches `/search?q=...&limit=...&system=...` and renders results as specimen cards.
- Each card shows a conservation-status strip (green → red) and, for at-risk plants,
  a suggested safer alternative pulled from `safe_alternative` in the API response.
- Clicking a card opens a detail modal backed by `/plant/<id>`.
- The traditional-system filter is populated from `/plants` on load.
- A footer indicator pings `/health` so you can tell at a glance if the API is reachable.
