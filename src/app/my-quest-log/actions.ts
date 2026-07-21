"use server";

import prisma from "@/libs/prismadb";
import getCurrentUser from "@/src/app/actions/getCurrentUser";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Poster records that a quester completed one of their quests. This logs the
// poster's own confirmation immediately; the quester confirms independently.
export async function recordCompletion(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const questId = String(formData.get("questId") ?? "");
  const questerId = String(formData.get("questerId") ?? "");
  if (!questId || !questerId) redirect("/my-quest-log?error=missing");

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.userId !== me!.id) redirect("/my-quest-log?error=notyourquest");
  if (questerId === me!.id) redirect("/my-quest-log?error=self");

  // Idempotency guard: one completion per quest. Refuse a second even if a
  // stale form or double-submit slips a completed quest through.
  const already = await prisma.completion.findFirst({ where: { questId: quest.id } });
  if (already) redirect("/my-quest-log?error=alreadylogged");

  await prisma.completion.create({
    data: {
      questId: quest.id,
      questTitle: quest.title,
      tags: quest.tags,
      posterId: me!.id,
      questerId,
      posterConfirmed: true,
      posterConfirmedAt: new Date(),
    },
  });
  revalidatePath("/my-quest-log");
  redirect("/my-quest-log?recorded=1");
}

// The other party confirms the completion happened. Dual confirm = verified.
export async function confirmCompletion(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const completionId = String(formData.get("completionId") ?? "");
  const prompted = String(formData.get("prompted") ?? "") === "on";
  const c = await prisma.completion.findUnique({ where: { id: completionId } });
  if (!c) redirect("/my-quest-log?error=missing");

  const now = new Date();
  if (c!.questerId === me!.id && !c!.questerConfirmed) {
    await prisma.completion.update({
      where: { id: c!.id },
      data: { questerConfirmed: true, questerConfirmedAt: now, questerPrompted: prompted },
    });
  } else if (c!.posterId === me!.id && !c!.posterConfirmed) {
    await prisma.completion.update({
      where: { id: c!.id },
      data: { posterConfirmed: true, posterConfirmedAt: now, posterPrompted: prompted },
    });
  }
  revalidatePath("/my-quest-log");
  redirect("/my-quest-log?confirmed=1");
}

// Leave a role-aware review — only allowed on a verified completion you were in.
export async function leaveReview(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const completionId = String(formData.get("completionId") ?? "");
  const wouldRepeat = String(formData.get("wouldRepeat") ?? "") === "on";
  const body = String(formData.get("body") ?? "").trim();

  const c = await prisma.completion.findUnique({ where: { id: completionId } });
  if (!c) redirect("/my-quest-log?error=missing");
  if (!(c!.posterConfirmed && c!.questerConfirmed)) redirect("/my-quest-log?error=notverified");

  const iAmPoster = c!.posterId === me!.id;
  const iAmQuester = c!.questerId === me!.id;
  if (!iAmPoster && !iAmQuester) redirect("/my-quest-log?error=notyours");

  const existing = await prisma.review.findFirst({
    where: { completionId, authorId: me!.id },
  });
  if (existing) redirect("/my-quest-log?error=reviewed");

  await prisma.review.create({
    data: {
      completionId,
      authorId: me!.id,
      subjectId: iAmPoster ? c!.questerId : c!.posterId,
      // role = the review AUTHOR's role in the completion, so the card can read
      // "<author> · quest poster" / "<author> · quester".
      role: iAmPoster ? "as_poster" : "as_quester",
      wouldRepeat,
      body: body || null,
    },
  });
  revalidatePath("/my-quest-log");
  redirect("/my-quest-log?reviewed=1");
}
