# Smart Path Dashboard

A small full-stack dashboard that surfaces routing state and metrics from the Smart Path managing system. The backend mocks the managing system API (or proxies to it when `MANAGING_BASE_URL` is set) and the frontend polls every 2 seconds to visualize status and metrics.

## Project Structure

- `backend/` – Express server with mock/proxy endpoints for `/api/status`, `/api/metrics`, `/health`.
- `frontend/` – React + Vite + TypeScript dashboard UI with polling, charts, and state visualization.

## Quickstart

### Terminal 1 – backend
```bash
cd smart-path-dashboard/backend
npm install
npm run dev
```

### Terminal 2 – frontend
```bash
cd smart-path-dashboard/frontend
npm install
npm run dev
```

Then open http://localhost:5173.

## Environment Variables

- Backend: `PORT` (default `4000`), `MANAGING_BASE_URL` (optional proxy target such as `https://smartpath.example/api`).
- Frontend: `VITE_BACKEND_BASE_URL` (defaults to `http://localhost:4000`).
