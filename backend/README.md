# Smart Path Dashboard Backend

Local development:

```bash
cd backend
npm install
npm run dev
```

Environment:
- `PORT` (default `4000`)
- `MANAGING_BASE_URL` to proxy calls to the real managing system (e.g. `https://smartpath.example/api`). When omitted, the server returns mock data.
