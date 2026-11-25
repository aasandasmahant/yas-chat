# YAS Chat deployment (single Docker app)

This repository contains one web/API application and PostgreSQL. Caddy provides HTTPS automatically for a domain whose DNS A/AAAA records point to the server.

## Requirements
- A Linux VPS/server with Docker Engine and Docker Compose plugin.
- A domain name pointed to the server's public IP.
- Inbound TCP ports 80 and 443 open.
- Persistent disk space and backups for PostgreSQL.

## Deploy
1. Clone this repository and check out `unified/master-build`.
2. Copy `deploy.env.example` to `.env`.
3. Set `DOMAIN` and `WEB_ORIGIN=https://<your-domain>`.
4. Generate strong secrets on the server, for example:
   - `openssl rand -hex 32` for each of `POSTGRES_PASSWORD`, `JWT_SECRET`, and `COOKIE_SECRET`.
   - Put each generated value in `.env`. Never paste secrets into GitHub or chat.
5. Run `docker compose up -d --build`.
6. Check `docker compose ps` and `docker compose logs -f app proxy`.
7. Open `https://<your-domain>/api/health`; it should return a JSON health response.

## Important release limitations
- The app is still an early functional foundation, not the full planned YAS Chat product.
- Product providers, affiliate tracking/commission settlement, ad manager, DMs/private groups and membership permissions, Q&A votes/replies, admin/moderation UI, email verification/password recovery/MFA, uploads, and audio/video calling are not implemented yet.
- Configure automated encrypted database backups, monitoring, email delivery, abuse controls, and a security review before inviting real users.
- The current chat room is a shared public room. Do not treat it as private messaging.
- Do not insert fabricated products, prices, reviews, commissions, or ad metrics.
- The CI workflow has not yet reported a successful run for this branch. Run the clean build and tests before production launch.
