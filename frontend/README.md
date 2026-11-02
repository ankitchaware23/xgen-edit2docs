# XGen Studio — React frontend

Claude-inspired React/Vite studio for the **existing** XGen FastAPI service. No simulated model responses. Supports uploading reference files, document generation (PPTX/DOCX/XLSX), PPTX follow-up chat edits, job progress via authenticated SSE with polling, downloadable revisions, SVG/HTML previews, direct structured text edits, saved local conversation history, and BYOK/API-token settings.

## Start

```bash
# Terminal 1, from repository root (Python >=3.12)
pip install -e '.[server]'
uvicorn xgen_edit2docs.api.main:app --reload --port 8000

# Terminal 2
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. In Settings enter your **Anthropic** API key. If the backend uses `EDIT2DOCS_AUTH_DEV_API_KEY`, also enter that token. The development proxy forwards `/v1` and `/health` to port 8000. For a remote backend, set `VITE_API_BASE_URL` and configure that backend's CORS for your frontend origin.

The FastAPI service allows the local Vite origins by default. For a separately hosted frontend, set `EDIT2DOCS_CORS_ORIGINS` on the backend to a comma-separated list of allowed origins, for example `https://studio.example.com` (include the scheme and port when applicable), then restart the backend.

## Important limitations and security

- The backend **does not expose general conversational completion**, login/signup, a list-conversations API, or document-level freeform chat for DOCX/XLSX. The frontend is therefore document-action-first, with local browser history and PPTX-only instruction-based edit turns. It does not pretend generic chat exists.
- Keys are kept in `sessionStorage` (tab session), not in localStorage, and are transmitted to the backend on requests. Do not expose tenant-wide admin keys to end users. For production, implement real user authentication and server-managed provider credentials.
- Existing backend stores the BYOK Anthropic key in queued job params during execution; audit/encrypt/remove this before production use.
- Chat history is local per browser (localStorage); this is not server persistence. Document asset IDs may cease to work after clearing the database.
- The provided API permits PPTX templates only; DOCX/XLSX templates are not accepted in `generate-deck`.
- Direct text edits use the API-specific JSON schema, not natural language. PPTX editor requires shape IDs; DOCX paragraph references and XLSX cell references require their respective schemas.
- Authenticated SSE is consumed with streaming fetch rather than EventSource because EventSource cannot attach bearer headers. Polling runs in parallel as a fallback.
- The backend's `/v1/jobs` endpoints have no listing API; frontend retains the returned job identifiers in local history.

## Build

`npm run build` writes static assets to `frontend/dist`. Serve the built files from a web server; route API paths to the FastAPI service, or configure `VITE_API_BASE_URL` with correct CORS settings.
