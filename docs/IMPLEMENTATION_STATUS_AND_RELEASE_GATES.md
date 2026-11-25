# YAS Chat Implementation Status and Release Gates

Last reviewed against GitHub repository metadata: 2026-11-25.

## Verified starting point

- Root `package.json` identifies `server.js` as the entry point and exposes only a `start` script.
- Root README describes in-app calling UI, call status sync, chat rooms/messages, Q&A replies, discover cards, live notice, privacy note and a language selector.
- The server is currently a single Node HTTP entry file with the HTML embedded as a base64 string.
- The product-discovery repository contains a TypeScript product contract, API adapter, React discovery view, validation/evidence logic and a CI workflow on its integration branch.
- Product discovery currently expects a distinct `/api/discover/products` endpoint; the legacy `/api/discover` community-card route is not a substitute.
- These facts do not prove that production authentication, persistent database storage, real WebRTC media, provider APIs or admin security are complete.

## Status vocabulary

- NOT STARTED: no implementation evidence.
- SCAFFOLDED: files/routes/UI exist, but end-to-end behavior is not proven.
- IMPLEMENTED: code exists and local tests pass.
- VERIFIED: integration and acceptance tests pass.
- PRODUCTION READY: security, deployment, monitoring, backup/restore and operational review pass.

## Required order

1. Inventory current server routes, UI handlers, data stores and runtime behavior.
2. Establish modular-monolith foundation and preserve existing working routes.
3. Add PostgreSQL schema, migrations, repository layer and integration tests.
4. Implement authentication, sessions, RBAC and audit log.
5. Implement persistent chat, rooms, messages, presence and notifications.
6. Implement persistent Q&A, replies, votes, reports and moderation.
7. Port Product Discovery contracts/UI and implement its separate API route.
8. Add provider adapters, attribution ledger and disclosure.
9. Add admin-controlled ads, analytics and campaign reporting.
10. Add reviewed locale catalogs and translation fallback.
11. Implement and test WebRTC signaling, TURN and SFU-based group calls if required.
12. Add uploads, private storage, backup/restore, observability and deployment.
13. Run clean-install, unit, integration, E2E, security and production build gates.
14. Only after all gates pass, open a release PR and tag a version.

## Do not delete yet

Do not delete the existing server entry point, current UI, legacy community discovery route or any working route until replacement tests pass. Keep old repositories archived/read-only until the unified app has been verified.

## Release decision

Current status: NOT PRODUCTION READY based on the inspected manifest and source entrypoint. This branch records the complete scope and safe integration policy; it does not claim that all modules have been implemented or tested.


## Update after unified/master-build implementation batch (2026-11-25)

Working branch: `unified/master-build`
Draft pull request: https://github.com/aasandasmahant/yas-chat/pull/1

### Newly scaffolded
- npm workspaces for `apps/web` (React/Vite) and `apps/api` (Fastify).
- PostgreSQL Prisma schema and initial migration.
- Registration/login routes using Argon2id, rate limits, HttpOnly SameSite session cookie, origin checks and CSRF token handling for state-changing routes.
- Authenticated Socket.IO global-room messaging with persistent messages.
- Community post list/create endpoints.
- Product search endpoint backed only by actual database rows; no fake catalog or fabricated ratings.
- Responsive React screens for account sign-in/registration, chat, community and product discovery.
- CI workflow and setup documentation.

### Current honest status
- The modules above are SCAFFOLDED. They have not been built or tested in a local runtime in this connector session.
- GitHub commit status currently reports no checks, and no workflow run was returned. Do not assume CI passed.
- The new web UI is not yet a faithful port of the legacy home-screen design; the old server.js and its embedded HTML remain preserved.
- No Rocket.Chat source files were copied. Exact file-level license/dependency review is still required before any import.
- Product Discovery source code was not copied because the inspected repository branch has no root LICENSE file. Equivalent basic functionality is being reimplemented pending rights confirmation.
- Private room membership, direct messaging, admin/moderation, provider integrations, affiliate ledger, ad management, WebRTC/TURN/SFU, uploads, email verification, MFA, password recovery, backups, monitoring and full security/E2E tests remain outstanding.

Release decision remains: NOT PRODUCTION READY. Do not merge the draft PR or delete source repositories until clean install, build, tests, security review and acceptance checks pass.
