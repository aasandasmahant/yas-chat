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
