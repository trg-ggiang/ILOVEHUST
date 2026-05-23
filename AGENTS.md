# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Project Snapshot

ILoveHust is a student support web app for HUST students. It is a TypeScript full-stack project with:

- `frontend/`: React 19, Vite, React Router, Axios, Socket.IO client, Recharts, CSS.
- `backend/`: Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL, Socket.IO, JWT auth.
- `backend/prisma/`: Prisma schema, migrations, seed scripts, and seed checks.

The root package only contains shared tooling. Work in `frontend` or `backend` for app changes.

## Repository Map

- `backend/server.ts`: Express and Socket.IO server bootstrap.
- `backend/database.ts`: Prisma client configured with `@prisma/adapter-pg`.
- `backend/routes/`: HTTP route modules grouped by feature.
- `backend/middleware/authMiddleware.ts`: JWT authentication and `req.user`.
- `backend/realtime.ts`: Socket.IO authentication and user-room emit helpers.
- `backend/utils/notifications.ts`: Notification creation/dedupe helpers.
- `frontend/src/App.tsx`: Client route table.
- `frontend/src/api.ts`: Axios instance with bearer-token interceptor.
- `frontend/src/realtime/`: Socket.IO client helpers and React event hook.
- `frontend/src/pages/`: Page-level React views.
- `frontend/src/components/`: Shared/student layout components.
- `frontend/src/styles.css`: Central stylesheet. Keep page-specific classes grouped and prefixed.

## Common Commands

Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Backend:

```bash
cd backend
npm run prisma:generate
npm run build
npm run dev
npm run seed
npm run seed:check
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
npm run dev
```

Database migrations:

```bash
cd backend
npx prisma migrate dev
npm run db:deploy
```

There is no meaningful root `npm test` script at the time of writing.

## Environment

Backend `.env` is expected at `backend/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ilovehust?schema=public"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:5173"
```

Frontend `.env` is expected at `frontend/.env`:

```env
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

Never commit real secrets, production database URLs, JWT secrets, or uploaded user files.

## Development Rules

- Do not change application behavior when doing Codex setup, docs-only changes, or repository hygiene.
- Preserve the split between backend routes/services and frontend pages/components.
- Keep backend route responses compatible with the frontend. Many UI views expect exact response keys.
- Use Prisma schema and migrations for database shape changes. Do not hand-edit existing migrations unless explicitly asked and the migration has not been shared.
- Run `npm run prisma:generate` after schema changes.
- Keep auth-protected backend routes behind `authMiddleware` unless the route is intentionally public.
- Use `toUserResponse` for user payloads so password hashes and internal fields are not leaked.
- Keep Socket.IO payload names consistent with existing events such as `message:changed` and `notification:changed`.
- For frontend API calls, use `frontend/src/api.ts` so bearer auth stays consistent.
- Prefer existing CSS conventions in `frontend/src/styles.css`; avoid adding new styling systems without a clear request.
- The UI currently uses centralized CSS, lucide icons, Recharts, and page-specific class names.
- Some Vietnamese text in existing source files appears mojibake-encoded. Do not mass-rewrite text encoding unless the task is specifically about copy/encoding repair.

## Verification Expectations

Choose the narrowest useful verification for the change:

- Backend TypeScript-only changes: `cd backend && npm run build`.
- Prisma schema or DB changes: `cd backend && npm run prisma:generate` and the relevant migration command.
- Frontend changes: `cd frontend && npm run lint && npm run build`.
- Full-stack contract changes: run both builds and manually smoke-test the affected flow when practical.

If local database credentials are unavailable, say so and still run checks that do not require DB access.

## Safety Boundaries

- Do not delete or rewrite user uploads in `uploads/`.
- Do not run destructive database commands against shared/Supabase URLs without explicit user approval.
- Do not reset, checkout, or discard user changes.
- Keep documentation/config edits small and factual.
- If a task requires production deploy credentials, ask for direction instead of inventing values.

## End-of-session workflow

At the end of each work session, Codex should update project documentation so future sessions can continue easily.

Update or create these files:
- `docs/WORK_LOG.md`
- `docs/PROJECT_STATE.md`
- `docs/NEXT_STEPS.md`
- `docs/DECISIONS.md` if there are new technical decisions

Rules:
- Do not include secrets, tokens, passwords, real database URIs, or `.env` values.
- Do not change application logic during documentation updates.
- Clearly record changed files, completed work, unfinished work, known issues, testing steps, and next steps.