# YAS Chat Repository Consolidation Decision

Date: 2026-11-25
Target: `aasandasmahant/yas-chat`
Working branch: `integration/yas-chat-unified`

## Verified repository inventory

| Repository | Observed contents | Decision |
|---|---|---|
| `aasandasmahant/yas-chat` | v1.9.0, root `server.js`, `package.json` with only `node server.js`, HTML embedded as base64 in server.js, no LICENSE found at repository root | Keep as the consolidation target only if preserving its current identity/history is desired; replace the fragile single-file runtime incrementally on the integration branch. Do not treat its current state as a secure production app. |
| `aasandasmahant/yaschat-product-discovery` | React/TypeScript product discovery UI, typed helpers/API client, strict TS config; expects a separate `GET /api/discover/products` backend; README explicitly says provider feeds, real API tests and production build remain required | Port its source module into the target repo under `apps/web/src/features/discovery` (or equivalent), retaining its source notices and tests. Do not copy its package as an independent deployable app. |
| `aasandasmahant/yaschat` | 773,949 KB repository size; Rocket.Chat-derived monorepo, Yarn workspaces for apps/packages/ee, Meteor-based workspace scripts; root license says content outside Enterprise paths is MIT subject to third-party notices, while `ee/` and `apps/meteor/ee/` have a separate license | Do NOT merge or fork the whole repository into YAS Chat. Use as a read-only reference. Only copy individually reviewed, necessary Community files after path, license, dependency and compatibility checks. |

## What to take from Rocket.Chat

Take patterns or small, isolated Community-licensed utilities only when the exact file has been reviewed:
- message schema/type and parsing behavior;
- role/permission and authorization concepts;
- presence and realtime event contracts;
- notification interfaces;
- upload validation and storage abstractions;
- moderation/reporting patterns;
- localization catalog conventions;
- call signaling interfaces only if they can be adapted without importing Meteor/Mongo-specific internals.

For every imported file, record: original repository + exact path + commit SHA + license + copyright notice + direct/transitive dependencies + local changes. Preserve required notices.

## What not to take

- Entire Rocket.Chat monorepo, Meteor app runtime, MongoDB data layer, Yarn workspace and build system.
- Any file under `ee/`, `apps/meteor/ee/`, or any other separately licensed/Enterprise-only area.
- `node_modules`, generated bundles, caches, build outputs, secrets, private keys, production config, sample credentials.
- Code whose license or transitive dependency license cannot be established.
- Any feature merely because it exists in Rocket.Chat; avoid importing unrelated team/enterprise functionality.

## Consolidated product architecture

One repository, one app, one release pipeline; start as a modular monolith:
- Web: React + TypeScript + Vite.
- API: Node.js LTS + Fastify, schema validation and centralized error handling.
- Realtime: Socket.IO with authenticated, authorized event handlers.
- Data: PostgreSQL + migrations; Redis only for multi-instance presence/queues when needed.
- Files: local development adapter and S3-compatible production adapter; strict size/MIME/ownership checks.
- Calls: WebRTC signaling + configured STUN/TURN; group calling requires a separately operated and tested SFU.
- Product discovery: port the existing React/TS module and implement its expected products API.
- Providers: ClickBank and ShareASale only after credentials/feed access and terms approval; Amazon only after program/API approval.
- Ads/referrals: admin-controlled placements, explicit sponsored labels, consent-aware targeting, auditable attribution and commission ledger. Do not promise 30% payout until provider terms, fraud controls, tax and payout workflow are implemented.
- Localization: Hindi and English first; add reviewed translation catalogs incrementally.
- Admin/security: RBAC, MFA-ready auth, rate limits, CSRF/CORS policy, secure cookies, password hashing, input validation, audit log, moderation and backup/restore.

## Remove or replace from the target app

Do not delete existing code until a replacement passes tests. Replace:
- HTML embedded as base64 in `server.js` with a normal versioned web app.
- Memory-only or process-local persistence with PostgreSQL repositories and migrations.
- Unauthenticated write endpoints and permissive CORS with authentication, authorization, CSRF protection where cookie auth is used, and explicit origin allowlists.
- Demo products, placeholder merchant links, fabricated ratings/review counts, fake call states and dead buttons.
- Duplicate routes/components and unused dependencies after import and test coverage confirms they are unused.

## Required release gates

The app is not production-ready until all are true:
1. Fresh clone installs from the documented lockfile and pinned Node version.
2. Typecheck, lint, unit tests, integration tests and production build pass in CI.
3. Auth/session, RBAC, rate limits, input validation, upload restrictions and security headers are tested.
4. PostgreSQL migrations, backup/restore and data retention are tested.
5. WebSocket authorization and cross-user access tests pass.
6. Provider adapters use real approved credentials in deployment secrets; no keys are committed.
7. Affiliate disclosures, privacy/consent, referral ledger and admin audit trail work.
8. Calls are tested on real mobile networks with TURN; group calling is not advertised until SFU is deployed.
9. Monitoring, error reporting, abuse reporting and incident/rollback steps exist.

## Current status (honest)

This audit is based on repository metadata and fetched root/source files. No source files have yet been ported, no production architecture has been implemented, and no build/test run has been performed. The integration branch remains a safe staging area; do not delete the source repositories until the consolidated app passes the release gates.
