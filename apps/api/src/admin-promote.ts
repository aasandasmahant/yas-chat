import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: npm run admin:promote -- user@example.com");
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" }, select: { id: true, email: true, role: true } });
  console.log(JSON.stringify(user));
} catch {
  console.error("User not found. Register this account in YAS Chat first, then run this command.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
