# YAS Chat — Railway and Docker deployment

This is one full-stack workspace and one app service. PostgreSQL is a separate managed database service. Railway can build this repository from GitHub using the root Dockerfile and can deploy it as a persistent service.

## Railway deployment (recommended for first online preview)

1. Sign in to Railway and connect the GitHub account that owns `aasandasmahant/yas-chat`.
2. Create a new Railway project and choose **Deploy from GitHub repo**.
3. Select repository `aasandasmahant/yas-chat`, branch `unified/master-build`. The root `Dockerfile` is used automatically.
4. In the same Railway project, add a **PostgreSQL** database service.
5. In the YAS Chat app service, add these variables. Use Railway's reference-variable picker for `DATABASE_URL` and select the Postgres service's `DATABASE_URL`:
   - `NODE_ENV=production`
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}` (choose the exact database service name in the picker)
   - `JWT_SECRET`: generate a unique 32+ character secret
   - `COOKIE_SECRET`: generate a different unique 32+ character secret
   - `ENCRYPTION_KEY`: exactly 64 hexadecimal characters (generate with `openssl rand -hex 32`)
   - `WEB_ORIGIN`: after the first deploy, set this to the exact HTTPS Railway domain generated for this app, with no trailing slash
   - `SESSION_TTL_SECONDS=604800`
6. Deploy. The Docker entrypoint runs Prisma migrations before starting the API. The `railway.toml` health check uses `/api/health`.
7. In the app service Settings → Networking, generate a public domain. Set `WEB_ORIGIN` to that exact domain and redeploy.
8. Open `https://YOUR-RAILWAY-DOMAIN/api/health`. Expected response includes `"status":"ok"`.
9. Open the app, create your own account, then use Railway's service shell to run `npm run admin:promote -- your-login-email@example.com`. This grants the first administrator role to that existing account. Do not expose this command as a public route.
10. Sign in again. The **Admin** tab is available only to accounts with the database ADMIN role.

Railway automatically builds from the connected GitHub branch when new commits are pushed. Variables are configured in the service's Variables tab; do not commit secrets into Git. See the official docs: https://docs.railway.com/services, https://docs.railway.com/variables, https://docs.railway.com/builds/dockerfiles.

## Admin controls currently scaffolded

- Audio/video subscription feature switches and monthly INR price fields.
- Ad placement switches: home, product, chat, persistent panel, audio-call and video-call placements.
- Integration credential storage for ClickBank, ShareASale, Razorpay, Stripe, LiveKit, Twilio, YouTube and translation provider.
- Provider credentials are encrypted at rest using AES-256-GCM. Keep `ENCRYPTION_KEY` stable and backed up: losing it makes saved integration credentials unreadable.
- Admin changes are audited.

## Important: what these controls do and do not mean

This release is a deployable foundation/preview, not the complete commercial platform. The admin panel stores configuration and credentials securely, but does not itself implement live payment collection, ad delivery, affiliate API synchronization, or audio/video calling. Those need provider-specific adapters, webhook signature verification, subscription entitlement checks, WebRTC signaling, TURN/SFU infrastructure, moderation, privacy/consent, and end-to-end tests. The server deliberately forces payment checkout off and public configuration warns that call/ad delivery is not active. Do not charge users or advertise calls as working until these modules are completed and tested.

Current chat is a single public global room only. Private messages and group rooms are not enabled. The current community feature supports posts but not full Q&A answers/voting. No product listings are fabricated; results appear only after a verified provider feed populates the database.

## Local Docker deployment

1. Copy `deploy.env.example` to `.env`.
2. Generate unique secrets:
   - `openssl rand -hex 32` for `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`, and `ENCRYPTION_KEY`.
3. Set `DOMAIN` and `WEB_ORIGIN=https://your-domain`.
4. Point DNS to the server and open TCP 80/443.
5. Run `docker compose up -d --build`.
6. Check `docker compose ps` and `docker compose logs -f app proxy`.

## Release checks

- GitHub Actions must pass `db:generate`, typecheck and production build.
- Run auth, admin authorization, CSRF, rate-limit, socket room, database migration and browser E2E tests.
- Review dependency vulnerabilities; CI previously reported advisories and type errors. Do not mark production-ready until the latest CI is green and those advisories have been triaged.
- Configure backups, monitoring, email verification/password reset, legal pages, privacy/consent and incident response before public launch.
