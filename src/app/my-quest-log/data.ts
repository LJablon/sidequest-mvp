// Read helpers for the Quest Log feature. Plain async functions (no "use
// server") imported by server components. Additive — nothing here mutates.
import prisma from "@/libs/prismadb";

const party = { select: { id: true, name: true, image: true } } as const;

/** Verified completions this user took part in (as quester or poster). */
export async function getVerifiedQuestLog(userId: string) {
  return prisma.completion.findMany({
    where: {
      OR: [{ questerId: userId }, { posterId: userId }],
      posterConfirmed: true,
      questerConfirmed: true,
    },
    include: { poster: party, quester: party },
    orderBy: { createdAt: "desc" },
  });
}

/** Completions this user is part of that are not yet fully confirmed. */
export async function getPendingCompletions(userId: string) {
  return prisma.completion.findMany({
    where: {
      OR: [{ questerId: userId }, { posterId: userId }],
      NOT: { posterConfirmed: true, questerConfirmed: true },
    },
    include: { poster: party, quester: party },
    orderBy: { createdAt: "desc" },
  });
}

/** Reviews written about this user (role-aware). */
export async function getReviewsReceived(userId: string) {
  return prisma.review.findMany({
    where: { subjectId: userId },
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Quests this user posted that have NOT been logged yet — the pool they can
 * still mark completed. A quest already tied to a completion is excluded so it
 * can't be logged twice (idempotent: one completion per quest).
 */
export async function getMyPostedQuests(userId: string) {
  return prisma.quest.findMany({
    where: { userId, completions: { none: {} } },
    select: { id: true, title: true, tags: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Other members, to pick who completed a quest. */
export async function getOtherUsers(userId: string) {
  return prisma.user.findMany({
    where: { id: { not: userId }, activeStatus: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Completion ids this user has already reviewed (to hide the review form). */
export async function getMyReviewedCompletionIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.review.findMany({
    where: { authorId: userId },
    select: { completionId: true },
  });
  return new Set(rows.map((r) => r.completionId));
}
