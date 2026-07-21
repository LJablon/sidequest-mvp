type Author = { id: string; name: string | null; image: string | null };

export type ReviewItem = {
  id: string;
  role: string;
  wouldRepeat: boolean;
  body: string | null;
  createdAt: Date;
  author: Author;
};

// Role-aware reviews about one member. Reviews only exist against verified
// completions, so this doubles as trust signal on the public profile.
export default function ReviewsSection({ reviews }: { reviews: ReviewItem[] }) {
  const repeatCount = reviews.filter((r) => r.wouldRepeat).length;
  return (
    <div className="p-6 bg-gray-100 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Reviews</h3>
        {reviews.length > 0 && (
          <span className="text-sm text-gray-500">
            {repeatCount}/{reviews.length} would repeat
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No reviews yet. Reviews come from verified completed quests.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900">
                  {r.author?.name ?? "A member"}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.wouldRepeat
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {r.wouldRepeat ? "Would repeat" : "Would not repeat"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {r.role === "as_poster" ? "quest poster" : "quester"}
              </p>
              {r.body && (
                <p className="mt-2 text-sm text-gray-700">{r.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
