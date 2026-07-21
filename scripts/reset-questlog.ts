// Wipes ALL Quest Log demo data (every Completion and Review row). Safe while
// the feature is demo-only; do NOT run once real completions exist.
//
//   bunx tsx scripts/reset-questlog.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.deleteMany({});
  const completions = await prisma.completion.deleteMany({});
  console.log(
    `Deleted ${reviews.count} review(s) and ${completions.count} completion(s).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
