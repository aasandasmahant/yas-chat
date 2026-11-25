# Rocket.Chat Source Selection and License Register

This file is a controlled allowlist for YAS Chat integration. It is not blanket permission to copy the entire upstream repository.

Upstream: https://github.com/RocketChat/Rocket.Chat
Repository structure reference: https://developer.rocket.chat/docs/repository-structure
Backend folder map: https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/backend-folder-structure.md

## Candidate areas (inspect exact current files before importing)

| Capability | Candidate upstream area/package | YAS Chat destination | Decision |
|---|---|---|---|
| Roles and permissions | community authorization domain | `src/modules/auth/` | Adapt concepts; copy only portable MIT files |
| Auth and password policy | community auth/password-policy areas | `src/modules/auth/` | Review dependencies and security tests |
| Models and type contracts | `packages/models`, `packages/core-typings`, `packages/rest-typings` | `packages/contracts/` | Prefer contract adaptation; do not import Meteor model layer |
| Message parsing | `packages/message-parser`, message types | `src/modules/chat/` | Candidate for selective reuse after dependency audit |
| API client | `packages/api-client` | `apps/web/` or shared client package | Reuse patterns; avoid unnecessary dependency tree |
| Internationalization | `packages/i18n` | `src/modules/localization/` | Reuse catalog conventions; translate YAS strings |
| Calls/signaling | `packages/media-calls`, `packages/media-signaling` | `src/modules/calls/` | Reuse protocol ideas/contracts; verify WebRTC/SFU end-to-end |
| Presence/realtime | streamer/presence community areas | `src/modules/presence/` | Adapt to Socket.IO and Redis; do not copy DDP internals blindly |
| Notifications | community notifications domain | `src/modules/notifications/` | Adapt provider interfaces and queue behavior |
| Upload/media | community media/file-upload domain | `src/modules/uploads/` | Reimplement storage adapter and validation if Meteor-bound |
| Moderation/search | community moderation/search domains | `src/modules/moderation/`, `src/modules/community/` | Selective adaptation with authorization tests |
| Integrations/webhooks | community integrations/webhooks | `src/modules/affiliate/` and integrations | Adapt signature verification, retries and audit patterns |

## Hard exclusions

- Every path under `ee/` and `apps/meteor/ee/`.
- Any package or subtree explicitly marked Enterprise, commercial, proprietary or separately licensed.
- Rocket.Chat secrets, credentials, environment files, signing keys, certificates, production data and deployment secrets.
- Vendored dependencies without their own license review.
- Meteor/DDP/Mongo-specific internals copied into YAS Chat's Fastify/PostgreSQL stack without a deliberate architecture migration.
- Build output, caches, node_modules, generated bundles and test fixtures containing personal data.

## Required provenance record for each imported file

Record in `THIRD_PARTY_NOTICES.md`:
- upstream repository and canonical file URL
- exact upstream commit SHA
- source path and destination path
- license and copyright notice
- modifications made
- dependency/license review result
- tests added

## Important licensing rule

The upstream repository's root license describes MIT-licensed content outside the Enterprise directories, while Enterprise directories have a separate license boundary. The exact current file and dependency license must still be checked before each import. Never move an Enterprise file into a community path to bypass its license.
