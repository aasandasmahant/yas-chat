# YAS Chat — Unified workspace

A single-repository modular-monolith foundation for YAS Chat. The original legacy server.js (including the earlier home-screen design) is retained unchanged as a reference. The new workspace is under apps/web and apps/api.

## Requirements
- Node.js 22 LTS and npm 10+
- PostgreSQL 15+
- A 4 GB Android/Termux device can edit and run the lightweight frontend, but production builds and database services are better run on a server or CI runner.

## Local setup
1. Copy .env.example to .env and set strong random values for JWT_SECRET, COOKIE_SECRET, and DATABASE_URL.
2. Create a PostgreSQL database/user matching DATABASE_URL.
3. Run npm install.
4. Run npm run db:generate.
5. Run npm run db:migrate.
6. Run npm run dev.
7. Open the Vite URL shown in the terminal (normally http://localhost:5173).

Production: set deployment secrets, run npm install, generate and commit package-lock.json before switching to npm ci, run npm run db:generate && npm run db:migrate && npm run build, then npm start.

## Implemented foundation in this branch
- Single npm-workspace repository with React/Vite frontend and Fastify API.
- PostgreSQL/Prisma schema and initial migration for users, messages, community posts, products and audit records.
- Argon2id password hashing, rate-limited registration/login, HttpOnly SameSite session cookie, origin allowlist and double-submit CSRF for state-changing routes.
- Authenticated Socket.IO connection and persistent messages in public rooms.
- Product search endpoint returns only database-supplied products; it does not fabricate product listings, ratings or affiliate URLs.
- Community post listing/creation endpoints.
- Health endpoint, security headers, body limits and CI typecheck/build workflow.

## Not yet complete — do not advertise as production-ready
- The new web UI is a functional shell, not the complete legacy home-screen design or all finished screens.
- Private/group membership permissions, direct messages, message editing/deletion, moderation queues, admin dashboard and complete Q&A workflows remain to be implemented.
- Product provider adapters are not connected. ClickBank/ShareASale credentials and approved feeds are required; Amazon only after program approval. No fake catalog data is seeded.
- Affiliate click attribution, commission ledger, referral payouts, ad campaign management and consent controls remain to be implemented.
- WebRTC signaling UI, TURN deployment and group-call SFU are not implemented.
- Email verification, password reset, MFA, account recovery, file uploads, malware scanning, backup/restore, monitoring and full security/E2E tests remain release blockers.
- Localization starts with Hindi/English scaffolding; no claim of 200+ translated languages.

## Source and licensing policy
- Do not copy the Rocket.Chat monorepo wholesale. Only individual Community files outside Enterprise-only paths may be considered after exact-path license and dependency review. Preserve copyright notices and third-party licenses.
- No Rocket.Chat source file has been copied into this workspace in this implementation batch.
- The product-discovery repository has no root LICENSE file in the inspected branch. Its code has therefore not been copied; equivalent UI/API foundations are being reimplemented pending rights confirmation.
- Do not delete source repositories until migration, tests and production release gates pass.

## Security notes
- Use HTTPS in production and a strong unique JWT/cookie secret.
- Restrict WEB_ORIGIN to the exact deployed frontend origin.
- Keep database/provider/TURN secrets in deployment secret storage.
- Review rate limits, CSRF, CORS, role permissions and socket room authorization before public launch.

## Master build additions
- Persistent community answers and per-user up/down votes.
- Public/private room creation, public joining and server-side Socket.IO membership checks.
- Admin CORS explicitly allows PUT for settings and integration updates.
- Private-room invitations, direct messages, moderation, live provider adapters, billing, ad delivery and WebRTC/TURN/SFU remain gated until implemented and tested.
