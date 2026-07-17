import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@g-ra.dev";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin user ready: ${admin.email} (role=${admin.role})`);

  const existing = await prisma.project.findUnique({
    where: { key: "DEMO" },
  });

  if (!existing) {
    const project = await prisma.project.create({
      data: {
        name: "Demo Project",
        key: "DEMO",
        description: "A starter project created by the seed script.",
        createdById: admin.id,
        members: {
          create: { userId: admin.id, role: "ADMIN" },
        },
        statuses: {
          create: [
            { name: "Backlog", color: "#94a3b8", position: 0 },
            { name: "To Do", color: "#3b82f6", position: 1 },
            { name: "In Progress", color: "#f59e0b", position: 2 },
            { name: "Done", color: "#22c55e", position: 3 },
          ],
        },
        customFields: {
          create: [
            { name: "Priority", type: "SELECT", options: JSON.stringify(["Low", "Medium", "High", "Critical"]), position: 0 },
            { name: "Estimate", type: "NUMBER", position: 1 },
          ],
        },
      },
    });

    await prisma.ticketSequence.create({
      data: { projectId: project.id, lastNumber: 0 },
    });

    console.log(`Seed project created: ${project.key}`);
  } else {
    console.log("Seed project already exists, skipping.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
