# YAS CHAT Unified Master Implementation Plan

Status: architecture and integration specification; NOT a completed implementation.
Target repository: `aasandasmahant/yas-chat`.
Target product: one deployable YAS CHAT application, one repository, one release pipeline.

## Product scope

1. Accounts: registration, login, logout, password reset, email verification, sessions, optional OAuth, device/session management.
2. Profiles: avatar, display name, bio, country/language, privacy settings, block/mute.
3. Messaging: direct messages, group chats, public/private rooms, threads/replies, reactions, edits/deletes, read receipts, typing, presence, search, attachments, notifications.
4. Community: posts, Q&A, answers, comments, upvotes, reports, moderation, categories, saved posts.
5. Product discovery: search, category, price/budget bands, sorting, merchant offers, product details, source-linked reviews, pros/cons, evidence confidence.
6. Affiliate: provider adapters for ClickBank and ShareASale; Amazon only after program/API approval; link attribution, click events, disclosures, commission ledger and payout status.
7. Ads: admin-managed banner and sponsored placements, frequency caps, campaign dates, targeting consent, impression/click tracking, disclosure labels and reporting.
8. Localization: translation catalog and locale negotiation; Hindi and English first. Add languages through reviewed translation files. Never claim 200+ fully translated languages until content exists.
9. Audio/video: WebRTC call signaling, call invitations, room state, device permissions and TURN configuration. Production multi-party calls require a tested SFU/media service; UI alone is not calling.
10. Admin: RBAC, user/content/product/provider/ad management, audit log, reports, feature flags, analytics and health dashboard.
11. Platform: secure uploads, backup/restore, migrations, observability, rate limits, abuse controls, accessibility, responsive mobile UI and CI.

## Single-repository architecture

Keep one repository and one versioned deployable product. Use a modular monolith first; split services only when measured scale requires it.

```text
/
  apps/
    web/                    # React + TypeScript user/admin UI
    api/                    # Node.js API and Socket.IO gateway
  packages/
    contracts/              # shared request/response/event schemas
    ui/                     # shared accessible UI components
    config/                 # lint, TypeScript and test configuration
  src/
    modules/
      auth/ users/ profiles/
      chat/ rooms/ presence/ notifications/
      community/ qa/ moderation/
      discovery/ reviews/ affiliate/
      ads/ analytics/ admin/
      calls/ uploads/ localization/
    infrastructure/
      database/ cache/ queue/ storage/ email/ observability/
    server/
      app.ts                 # app composition and route registration
      main.ts                # process entrypoint
  database/
    migrations/
    seeds/
  tests/
    unit/
    integration/
    e2e/
    security/
  docs/
  .github/workflows/
  .env.example
  package.json
  README.md
```

The above is the target structure, not a claim that these files already exist.

## Recommended implementation baseline

- Runtime: supported Node.js LTS; pin exact version in CI.
- Web: React + TypeScript + Vite.
- API: Fastify with schema validation.
- Realtime: Socket.IO with authenticated event handlers.
- Database: PostgreSQL with migrations and transaction boundaries.
- Cache/ephemeral presence: Redis, optional for local development but required for multi-instance realtime deployment.
- Jobs: durable queue for email, notifications, affiliate imports and analytics aggregation.
- File storage: local development adapter plus S3-compatible production adapter; validate MIME, size and ownership.
- Calls: WebRTC signaling in the API; TURN (coturn) for NAT traversal; add a vetted SFU for group calls.
- Tests: unit, integration, security and browser E2E; CI must run all required checks.

Do not combine Rocket.Chat's Meteor/MongoDB internals with the current plain Node HTTP server by copying random files. Choose one coherent runtime and adapt portable domain behavior.

## Rocket.Chat source-selection policy

Use the Rocket.Chat repository as an audited reference and selective source, not as a blind wholesale import.

### Candidate Community source areas to evaluate individually
- authorization and role/permission concepts
- auth/password-policy utilities
- shared model/type definitions and REST contracts
- message parsing and message-type validation
- i18n catalog conventions
- API client patterns
- media-call/signaling interfaces
- presence/streaming patterns
- notification delivery patterns
- file/media validation and storage interfaces
- moderation, search and webhook/integration patterns

### Import gate for every copied file
1. Confirm the exact path is outside all `ee/` directories and outside any Enterprise-only subtree.
2. Read the current file-level and repository license notices.
3. Check all transitive dependencies and their licenses.
4. Check whether it imports Meteor, MongoDB-specific models, Rocket.Chat internal services or private packages.
5. If not portable, reimplement the behavior against YAS Chat contracts instead of copying.
6. Preserve copyright and MIT license notices for copied MIT code; record source URL, commit SHA, path and local destination in the third-party notices file.
7. Add tests proving the imported/adapted behavior.
8. Require human review before merging.

Never copy `ee/`, `apps/meteor/ee/`, Enterprise-only packages, secrets, production configuration, generated credentials or unrelated build artifacts.

## Product Discovery integration

Use the maintained discovery module from `yaschat-product-discovery` as the source of truth for product contracts and evidence rules. Integrate:
- product model, validation and safe external URL checks
- price-band classification (price bands are not quality ratings)
- evidence assessment and source links
- accessible React discovery screen, adapted to YAS UI tokens
- backend contract and tests

The main YAS API must implement `GET /api/discover/products` with query validation, pagination, sorting, currency and budget filters. Keep the existing `/api/discover` community-card route separate; do not silently repurpose it.

Provider data must be real and attributable. Never invent prices, images, ratings, review counts, merchant links or affiliate availability. If credentials/provider access are absent, show an honest empty state or clearly labeled demo data.

## Affiliate and advertising safety

- Keep API secrets server-side; only blank variable names go in `.env.example`.
- Validate provider signatures and callbacks where supported.
- Store click attribution without exposing personal data in public URLs.
- Clearly disclose affiliate relationships and sponsored placements.
- Do not guarantee commission rates or income.
- Add consent/privacy controls and retention limits for analytics.
- Admin changes require role checks and audit records.

## Security requirements

- Password hashing with a modern password-hashing algorithm and safe parameters.
- Secure, HttpOnly, SameSite cookies; CSRF protection where cookie-authenticated mutations require it.
- Rate limits and abuse detection on auth, messages, uploads, search and calls.
- Authorization enforced on the server for every room, message, file and admin action.
- Input validation, output encoding, safe markdown rendering and SSRF protection for URL imports.
- Upload allowlists, file-size limits, malware scanning hook and private object access.
- Secret scanning, dependency scanning, lockfile and reproducible CI.
- Audit log for privileged actions; no secrets or message bodies in logs.
- Backups and a tested restore procedure.

## Acceptance gates before calling it complete

- Fresh clone + documented install works.
- Database migrations run from an empty database.
- Signup/login/session/logout/password-reset tests pass.
- Two real users can exchange persistent messages; restart does not erase them.
- Room membership and permissions are enforced server-side.
- Q&A create/reply/vote/report flows persist.
- Product API returns validated provider-backed records and handles empty/error states.
- Affiliate clicks are attributed and disclosed correctly.
- Ads can be controlled by admin and tracked without breaking core navigation.
- Locale switch changes actual translated UI strings.
- One-to-one WebRTC calls pass tests over separate networks with TURN; group calling passes only after SFU verification.
- Admin routes are inaccessible to ordinary users.
- Unit, integration, E2E, security and production build checks pass.
- README, environment reference, deployment, backup and recovery docs are complete.

A green build alone does not mean production-ready. No phase is marked complete until its acceptance tests pass.
