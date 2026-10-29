# PyGit frontend

React/Vite client for the PyGit FastAPI backend.

## Run locally

Start the backend first:

```bash
cd ../pygitbackend
python -m pip install -r requirements.txt
python -m uvicorn api:app --reload --host 127.0.0.1 --port 8001
```

Then, in another terminal, start the frontend:

```bash
npm install
npm run dev
```

The Vite development server forwards `/api/*` requests to
`http://localhost:8001`, so no frontend configuration is required for local
development. Open the URL printed by Vite, normally `http://localhost:5173`.

## Environment variables

Copy `.env.example` to `.env` only if required:

- `VITE_API_BASE_URL` — backend origin for a deployed frontend, such as
  `https://api.example.com`. The client appends `/api` automatically.
- `VITE_USE_MOCKS=true` — intentionally use demo data if the backend cannot be
  reached. Leave this unset or `false` for real backend integration.

## Checks

```bash
npm run lint
npm run build
```
