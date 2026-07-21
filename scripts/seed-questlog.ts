// Additive demo seed for the Quest Log feature. Creates one verified
// completion (dual-confirmed) plus a review from each side between two existing
// users, so profiles render with content. Safe to re-run (adds another entry).
//
//   bunx tsx scripts/seed-questlog.ts     (or: bun run scripts/seed-questlog.ts)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const quest = await prisma.quest.findFirst({ orderBy: { createdAt: "desc" } });
  if (!quest) {
    console.error("No quests found — post a quest first, then re-run.");
    return;
  }
  const poster = await prisma.user.findUnique({ where: { id: quest.userId } });
  const quester = await prisma.user.findFirst({
    where: { id: { not: quest.userId }, activeStatus: true },
  });
  if (!poster || !quester) {
    console.error("Need at least two users in the database.");
    return;
  }

  const now = new Date();
  const completion = await prisma.completion.create({
    data: {
      questId: quest.id,
      questTitle: quest.title,
      tags: quest.tags,
      posterId: poster.id,
      questerId: quester.id,
      posterConfirmed: true,
      posterConfirmedAt: now,
      questerConfirmed: true,
      questerConfirmedAt: now,
      artifactNote: "Seeded demo completion.",
    },
  });

  await prisma.review.createMany({
    data: [
      {
        completionId: completion.id,
        authorId: poster.id,
        subjectId: quester.id,
        role: "as_poster", // author (poster) reviewing the quester
        wouldRepeat: true,
        body: "Showed up and did great work. Would book again.",
      },
      {
        completionId: completion.id,
        authorId: quester.id,
        subjectId: poster.id,
        role: "as_quester", // author (quester) reviewing the poster
        wouldRepeat: true,
        body: "Clear about what they needed and paid promptly.",
      },
    ],
  });

  console.log(
    `Seeded completion ${completion.id}: ${poster.name} <-> ${quester.name} on "${quest.title}"`,
  );
  console.log(`View profiles: /profile/${quester.id} and /profile/${poster.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
