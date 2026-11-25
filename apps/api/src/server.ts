import Fastify, { FastifyRequest } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import fastifyStatic from "@fastify/static";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { Server as SocketServer } from "socket.io";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(2592000).default(604800)
}).parse(process.env);

const prisma = new PrismaClient();
const app = Fastify({
  logger: { level: env.NODE_ENV === "production" ? "info" : "debug", redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"] },
  bodyLimit: 1024 * 1024,
  trustProxy: env.NODE_ENV === "production"
});

await app.register(helmet, { global: true, contentSecurityPolicy: false });
await app.register(cors, { origin: [env.WEB_ORIGIN], credentials: true, methods: ["GET", "POST", "PATCH", "DELETE"] });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
await app.register(cookie, { secret: env.COOKIE_SECRET });
await app.register(jwt, { secret: env.JWT_SECRET, cookie: { cookieName: "yas_session", signed: false }, sign: { expiresIn: env.SESSION_TTL_SECONDS } });

const webDistCandidates = [resolve(process.cwd(), "../web/dist"), resolve(process.cwd(), "apps/web/dist")];
const webDist = webDistCandidates.find(path => existsSync(path)) ?? webDistCandidates[0];
if (existsSync(webDist)) {
  await app.register(fastifyStatic, { root: webDist, prefix: "/" });
}

app.decorate("authenticate", async (request: FastifyRequest) => {
  try { await request.jwtVerify(); }
  catch { throw Object.assign(new Error("Unauthorized"), { statusCode: 401 }); }
});

function requireOrigin(request: FastifyRequest) {
  const origin = request.headers.origin;
  if (origin !== env.WEB_ORIGIN) throw Object.assign(new Error("Invalid request origin"), { statusCode: 403 });
}
function requireCsrf(request: FastifyRequest) {
  const cookieToken = request.cookies.csrf_token;
  const headerToken = request.headers["x-csrf-token"];
  if (!cookieToken || typeof headerToken !== "string" || cookieToken.length < 32 || cookieToken !== headerToken) {
    throw Object.assign(new Error("CSRF validation failed"), { statusCode: 403 });
  }
}
function setCsrf(reply: any) {
  const token = randomBytes(32).toString("hex");
  reply.setCookie("csrf_token", token, { httpOnly: false, secure: env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: env.SESSION_TTL_SECONDS });
  return token;
}
function setSession(reply: any, user: { id: string; role: string }) {
  const token = app.jwt.sign({ sub: user.id, role: user.role });
  reply.setCookie("yas_session", token, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: env.SESSION_TTL_SECONDS });
}

app.get("/api/health", async () => ({ status: "ok", service: "yas-chat-api", time: new Date().toISOString() }));
app.get("/api/csrf", async (_request, reply) => ({ csrfToken: setCsrf(reply) }));

const registerSchema = z.object({
  email: z.string().email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(60)
});
app.post("/api/auth/register", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async (request, reply) => {
  requireOrigin(request);
  const input = registerSchema.safeParse(request.body);
  if (!input.success) return reply.code(400).send({ error: "Invalid registration details", details: input.error.flatten().fieldErrors });
  const existing = await prisma.user.findUnique({ where: { email: input.data.email } });
  if (existing) return reply.code(409).send({ error: "An account with this email already exists" });
  const passwordHash = await argon2.hash(input.data.password, { type: argon2.argon2id });
  const user = await prisma.user.create({ data: { email: input.data.email, passwordHash, displayName: input.data.displayName } });
  setSession(reply, user);
  return reply.code(201).send({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
});

const loginSchema = z.object({ email: z.string().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) });
app.post("/api/auth/login", { config: { rateLimit: { max: 8, timeWindow: "15 minutes" } } }, async (request, reply) => {
  requireOrigin(request);
  const input = loginSchema.safeParse(request.body);
  if (!input.success) return reply.code(400).send({ error: "Invalid email or password" });
  const user = await prisma.user.findUnique({ where: { email: input.data.email } });
  if (!user || !(await argon2.verify(user.passwordHash, input.data.password))) return reply.code(401).send({ error: "Invalid email or password" });
  setSession(reply, user);
  return { user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } };
});

app.get("/api/auth/me", { preHandler: [(app as any).authenticate] }, async (request: any, reply) => {
  const user = await prisma.user.findUnique({ where: { id: request.user.sub }, select: { id: true, email: true, displayName: true, role: true, locale: true } });
  if (!user) return reply.code(401).send({ error: "Unauthorized" });
  return { user };
});
app.post("/api/auth/logout", async (request, reply) => {
  requireOrigin(request); requireCsrf(request);
  reply.clearCookie("yas_session", { path: "/" });
  reply.clearCookie("csrf_token", { path: "/" });
  return { success: true };
});

app.get("/api/discover/products", async (request, reply) => {
  const query = z.object({
    q: z.string().trim().max(120).optional(),
    category: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(24)
  }).safeParse(request.query);
  if (!query.success) return reply.code(400).send({ error: "Invalid search parameters" });
  const { q, category, page, pageSize } = query.data;
  const where = {
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(category ? { category } : {})
  };
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.product.count({ where })
  ]);
  return { items: rows.map(p => ({ ...p, price: Number(p.price), updatedAt: p.updatedAt.toISOString() })), total, page, pageSize, notice: rows.length ? undefined : "No connected, verified product feed has supplied results yet. No demo products are shown." };
});

app.get("/api/community/posts", async (request, reply) => {
  const page = Math.max(1, Math.min(1000, Number((request.query as any)?.page) || 1));
  const posts = await prisma.communityPost.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20, include: { author: { select: { id: true, displayName: true } } } });
  return { items: posts, page, pageSize: 20 };
});
app.post("/api/community/posts", { preHandler: [(app as any).authenticate] }, async (request: any, reply) => {
  requireOrigin(request); requireCsrf(request);
  const input = z.object({ title: z.string().trim().min(4).max(180), body: z.string().trim().min(1).max(10000) }).safeParse(request.body);
  if (!input.success) return reply.code(400).send({ error: "Invalid post", details: input.error.flatten().fieldErrors });
  const post = await prisma.communityPost.create({ data: { ...input.data, authorId: request.user.sub } });
  return reply.code(201).send({ post });
});

const io = new SocketServer(app.server, { cors: { origin: env.WEB_ORIGIN, credentials: true }, maxHttpBufferSize: 64 * 1024 });
io.use((socket, next) => {
  try {
    if (socket.handshake.headers.origin !== env.WEB_ORIGIN) return next(new Error("Invalid origin"));
    const raw = socket.handshake.headers.cookie ?? "";
    const token = raw.split(";").map(v => v.trim()).find(v => v.startsWith("yas_session="))?.slice("yas_session=".length);
    if (!token) return next(new Error("Authentication required"));
    const payload = app.jwt.verify<{ sub: string; role: string }>(decodeURIComponent(token));
    socket.data.userId = payload.sub;
    next();
  } catch { next(new Error("Authentication required")); }
});
io.on("connection", socket => {
  socket.on("room:join", async (roomId: unknown, ack?: (value: unknown) => void) => {
    if (typeof roomId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(roomId)) return ack?.({ error: "Invalid room" });
    await socket.join(roomId);
    const history = await prisma.message.findMany({ where: { roomId }, orderBy: { createdAt: "desc" }, take: 50, include: { author: { select: { id: true, displayName: true } } } });
    ack?.({ messages: history.reverse() });
  });
  socket.on("message:send", async (payload: unknown, ack?: (value: unknown) => void) => {
    const parsed = z.object({ roomId: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/), body: z.string().trim().min(1).max(5000) }).safeParse(payload);
    if (!parsed.success || !socket.rooms.has(parsed.data.roomId)) return ack?.({ error: "Invalid message or room not joined" });
    const message = await prisma.message.create({ data: { roomId: parsed.data.roomId, authorId: socket.data.userId, body: parsed.data.body }, include: { author: { select: { id: true, displayName: true } } } });
    io.to(parsed.data.roomId).emit("message:new", message);
    ack?.({ success: true, message });
  });
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error({ err: error }, "request failed");
  const status = Number((error as any).statusCode) || 500;
  reply.code(status >= 400 && status < 600 ? status : 500).send({ error: status >= 500 ? "Internal server error" : error.message });
});
app.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith("/api/") || request.url.startsWith("/socket.io/")) return reply.code(404).send({ error: "Not found" });
  if (existsSync(resolve(webDist, "index.html"))) return reply.sendFile("index.html");
  return reply.code(404).send({ error: "Web app has not been built. Run npm run build." });
});

const close = async () => { await app.close(); await prisma.$disconnect(); };
process.on("SIGINT", close);
process.on("SIGTERM", close);
await app.listen({ port: env.PORT, host: "0.0.0.0" });
app.log.info({ port: env.PORT }, "YAS Chat API started");
