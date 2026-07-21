import Link from "next/link";

type Party = { id: string; name: string | null; image: string | null };

export type QuestLogEntry = {
  id: string;
  questId: string | null;
  questTitle: string;
  tags: string[];
  posterId: string;
  questerId: string;
  createdAt: Date;
  artifactNote: string | null;
  artifactUrl: string | null;
  poster: Party;
  quester: Party;
};

// Verified-completion timeline for one member's profile. `ownerId` frames each
// entry by that member's role (they completed it, or they posted it).
export default function QuestLogSection({
  entries,
  ownerId,
}: {
  entries: QuestLogEntry[];
  ownerId: string;
}) {
  return (
    <div className="p-6 bg-gray-100 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Quest Log</h3>
        {entries.length > 0 && (
          <span className="text-sm text-gray-500">{entries.length} verified</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No verified quests yet. Completed quests appear here once both people
          confirm.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const ownerIsQuester = e.questerId === ownerId;
            const other = ownerIsQuester ? e.poster : e.quester;
            return (
              <li
                key={e.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">
                    {ownerIsQuester ? "Completed " : "Posted "}
                    {e.questId ? (
                      <Link
                        href={`/ad/${e.questId}`}
                        className="text-theme-green hover:underline"
                      >
                        {e.questTitle}
                      </Link>
                    ) : (
                      <span>{e.questTitle}</span>
                    )}
                    <span className="text-gray-600">
                      {ownerIsQuester ? " for " : " · completed by "}
                      {other?.name ?? "a member"}
                    </span>
                  </p>
                  <span className="text-xs whitespace-nowrap rounded-full bg-green-100 text-green-800 font-semibold px-2 py-0.5">
                    verified ✓
                  </span>
                </div>

                {e.tags && e.tags.length > 0 && (
                  <div className="flex flex-wrap mt-2">
                    {e.tags.map((t, i) => (
                      <span key={i} className="text-sm tag mr-1 mt-1">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {e.artifactNote && (
                  <p className="mt-2 text-sm text-gray-600">
                    {e.artifactNote}
                    {e.artifactUrl && (
                      <>
                        {" · "}
                        <a
                          href={e.artifactUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-theme-green hover:underline"
                        >
                          view
                        </a>
                      </>
                    )}
                  </p>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  {new Date(e.createdAt).toLocaleDateString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
