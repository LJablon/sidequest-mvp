import { redirect } from "next/navigation";
import getCurrentUser from "@/src/app/actions/getCurrentUser";
import {
  getVerifiedQuestLog,
  getPendingCompletions,
  getReviewsReceived,
  getMyPostedQuests,
  getOtherUsers,
  getMyReviewedCompletionIds,
} from "./data";
import { recordCompletion, confirmCompletion, leaveReview } from "./actions";
import QuestLogSection from "@/src/components/QuestLogSection";
import ReviewsSection from "@/src/components/ReviewsSection";

const BANNERS: Record<string, string> = {
  recorded: "Completion recorded. It becomes verified once the other person confirms.",
  confirmed: "Confirmed. If both parties have confirmed, it's now in your Quest Log.",
  reviewed: "Review submitted.",
};
const ERRORS: Record<string, string> = {
  missing: "Something was missing from that request.",
  notyourquest: "You can only record completions for quests you posted.",
  self: "You can't complete your own quest.",
  alreadylogged: "That quest has already been logged as completed.",
  notverified: "You can only review a verified completion.",
  reviewed: "You've already reviewed that completion.",
  notyours: "That completion isn't yours to review.",
};

export default async function MyQuestLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const { recorded, confirmed, reviewed, error } = await searchParams;

  const [verified, pending, reviews, myQuests, others, reviewedIds] =
    await Promise.all([
      getVerifiedQuestLog(me.id),
      getPendingCompletions(me.id),
      getReviewsReceived(me.id),
      getMyPostedQuests(me.id),
      getOtherUsers(me.id),
      getMyReviewedCompletionIds(me.id),
    ]);

  const waitingOnMe = pending.filter((c) =>
    c.questerId === me.id ? !c.questerConfirmed : !c.posterConfirmed,
  );
  const waitingOnThem = pending.filter((c) =>
    c.questerId === me.id ? c.questerConfirmed : c.posterConfirmed,
  );
  const reviewable = verified.filter((c) => !reviewedIds.has(c.id));

  const banner = [recorded && "recorded", confirmed && "confirmed", reviewed && "reviewed"].find(
    Boolean,
  ) as string | undefined;

  return (
    <div className="absolute inset-0 top-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Quest Log</h1>
          <p className="text-gray-500 mt-1">
            Verified completed quests and reviews. Confirm the ones waiting on
            you to add them to your log.
          </p>
        </div>

        {banner && (
          <div className="rounded-lg border border-theme-green bg-green-50 px-4 py-2 text-sm text-green-800">
            {BANNERS[banner]}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">
            {ERRORS[error] ?? "Something went wrong."}
          </div>
        )}

        {/* Record a completion (poster side). */}
        {myQuests.length > 0 && others.length > 0 && (
          <section className="p-6 bg-gray-100 rounded-2xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Record a completed quest
            </h2>
            <form action={recordCompletion} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Your quest
                </label>
                <select name="questId" className="w-full rounded-md border border-gray-300 p-2 text-sm">
                  {myQuests.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Completed by
                </label>
                <select name="questerId" className="w-full rounded-md border border-gray-300 p-2 text-sm">
                  {others.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? "Member"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="bg-theme-green text-white rounded-md px-4 py-2 text-sm font-semibold"
                >
                  Record completion
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Waiting for my confirmation. */}
        {waitingOnMe.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Waiting for your confirmation
            </h2>
            <ul className="space-y-3">
              {waitingOnMe.map((c) => {
                const iAmQuester = c.questerId === me.id;
                const other = iAmQuester ? c.poster : c.quester;
                return (
                  <li key={c.id} className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">
                      {c.questTitle}{" "}
                      <span className="font-normal text-gray-600">
                        {iAmQuester ? "posted by " : "completed by "}
                        {other?.name ?? "a member"}
                      </span>
                    </p>
                    <form action={confirmCompletion} className="mt-3 flex flex-wrap items-center gap-4">
                      <input type="hidden" name="completionId" value={c.id} />
                      <label className="flex items-center gap-2 text-xs text-gray-500">
                        <input type="checkbox" name="prompted" />
                        Someone reminded me to confirm
                      </label>
                      <button
                        type="submit"
                        className="bg-theme-green text-white rounded-md px-4 py-2 text-sm font-semibold"
                      >
                        Yes, this happened — confirm
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Waiting on the other person. */}
        {waitingOnThem.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Waiting on the other person
            </h2>
            <ul className="space-y-2">
              {waitingOnThem.map((c) => (
                <li key={c.id} className="p-3 bg-white rounded-lg border border-gray-200 text-sm">
                  <span className="font-medium text-gray-900">{c.questTitle}</span>
                  <span className="text-gray-500"> · awaiting their confirmation</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Verified log. */}
        <QuestLogSection entries={verified} ownerId={me.id} />

        {/* Leave reviews on verified completions not yet reviewed. */}
        {reviewable.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Leave a review
            </h2>
            <ul className="space-y-3">
              {reviewable.map((c) => {
                const iAmQuester = c.questerId === me.id;
                const other = iAmQuester ? c.poster : c.quester;
                return (
                  <li key={c.id} className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">
                      Review <span className="font-medium">{other?.name ?? "a member"}</span>{" "}
                      for <span className="font-medium">{c.questTitle}</span>
                    </p>
                    <form action={leaveReview} className="space-y-2">
                      <input type="hidden" name="completionId" value={c.id} />
                      <input
                        name="body"
                        placeholder="A sentence about how it went (optional)"
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input type="checkbox" name="wouldRepeat" defaultChecked />
                          Would repeat
                        </label>
                        <button
                          type="submit"
                          className="bg-theme-green text-white rounded-md px-4 py-2 text-sm font-semibold"
                        >
                          Submit review
                        </button>
                      </div>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Reviews about me. */}
        <ReviewsSection reviews={reviews} />
      </div>
    </div>
  );
}
