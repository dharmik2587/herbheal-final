# Project Structure

## Root
- app/: Next.js app routes and page-level UI
- backend/: Flask-based backend service
- components/: reusable React components
- frontend/: optional frontend assets or legacy UI
- hooks/: custom React hooks
- lib/: shared utilities and integrations
- ml/: machine learning scripts and model helpers
- prisma/: Prisma schema and seed logic
- public/: static assets
- scripts/: developer helper scripts
- docs/: project documentation

## Development flow
1. Start the backend: powershell -ExecutionPolicy Bypass -File .\scripts\dev-backend.ps1
2. Start the frontend: powershell -ExecutionPolicy Bypass -File .\scripts\dev-frontend.ps1
3. Open http://localhost:3000 and http://127.0.0.1:5000/health
