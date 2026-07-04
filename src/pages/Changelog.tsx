import { useEffect, useState } from "react";
import { BUILD_SHA } from "../buildInfo";

interface GHPull {
  number: number;
  title: string;
  body: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  html_url: string;
  user: { login: string; avatar_url: string } | null;
}

interface GHComment {
  id: number;
  body: string;
  user: { login: string; avatar_url: string } | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PrBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      nodes.push(<div key={key++} className="h-1.5" />);
    } else if (line.startsWith("## ")) {
      nodes.push(
        <p key={key++} className="text-sm font-semibold text-relic-parchment/90 mt-3 first:mt-0">
          {line.slice(3)}
        </p>
      );
    } else if (line.trimStart().startsWith("- [x] ")) {
      nodes.push(
        <div key={key++} className="flex items-start gap-2 text-sm text-relic-parchment/50">
          <span className="text-emerald-400 shrink-0 mt-0.5 leading-none">✓</span>
          <span className="line-through">{line.trimStart().slice(6)}</span>
        </div>
      );
    } else if (line.trimStart().startsWith("- [ ] ")) {
      nodes.push(
        <div key={key++} className="flex items-start gap-2 text-sm text-relic-parchment/60">
          <span className="text-relic-parchment/30 shrink-0 mt-0.5 leading-none">○</span>
          <span>{line.trimStart().slice(6)}</span>
        </div>
      );
    } else if (line.trimStart().startsWith("- ")) {
      nodes.push(
        <div key={key++} className="flex items-start gap-2 text-sm text-relic-parchment/60">
          <span className="text-relic-parchment/30 shrink-0 mt-1 leading-none">·</span>
          <span>{line.trimStart().slice(2)}</span>
        </div>
      );
    } else if (line.startsWith("🤖")) {
      // skip generated-with footer
    } else {
      nodes.push(
        <p key={key++} className="text-sm text-relic-parchment/60">
          {line}
        </p>
      );
    }
  }

  return <div className="space-y-1">{nodes}</div>;
}

function PrCard({
  pr,
  isLive,
}: {
  pr: GHPull;
  isLive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<GHComment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      setLoadingComments(true);
      try {
        const r = await fetch(
          `https://api.github.com/repos/JasonSchneider/TabletopRelics/issues/${pr.number}/comments`
        );
        setComments(await r.json());
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  }

  return (
    <div
      className={[
        "card overflow-hidden",
        isLive ? "ring-1 ring-relic-glow/40" : "",
      ].join(" ")}
    >
      <button
        onClick={toggle}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isLive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-relic-glow/20 text-relic-glow border border-relic-glow/30 font-display tracking-wider uppercase shrink-0">
                Live
              </span>
            )}
            <span className="text-relic-parchment/40 text-xs font-mono shrink-0">
              #{pr.number}
            </span>
            <span className="text-sm text-relic-parchment font-medium leading-snug">
              {pr.title}
            </span>
          </div>
          <p className="text-xs text-relic-parchment/40">
            {formatDate(pr.merged_at!)}
            {pr.merge_commit_sha && (
              <span className="ml-2 font-mono opacity-60">
                {pr.merge_commit_sha.slice(0, 7)}
              </span>
            )}
          </p>
        </div>
        <span
          className={[
            "text-relic-parchment/30 shrink-0 mt-1 transition-transform duration-150",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 4 L6 8 L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-white/8">
          {/* PR body */}
          <div className="px-5 pt-4 pb-4">
            {pr.body ? (
              <PrBody body={pr.body} />
            ) : (
              <p className="text-sm text-relic-parchment/40 italic">No description.</p>
            )}
          </div>

          {/* Comments */}
          <div className="border-t border-white/8 px-5 py-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-relic-parchment/40">
              Comments
            </p>
            {loadingComments ? (
              <p className="text-xs text-relic-parchment/40">Loading…</p>
            ) : !comments?.length ? (
              <p className="text-xs text-relic-parchment/30 italic">No comments.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  {c.user?.avatar_url && (
                    <img
                      src={c.user.avatar_url}
                      alt={c.user.login}
                      className="w-6 h-6 rounded-full shrink-0 mt-0.5 opacity-60"
                    />
                  )}
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs text-relic-parchment/50">
                      <span className="font-medium">{c.user?.login}</span>
                      <span className="mx-1 opacity-50">·</span>
                      {formatDate(c.created_at)}
                    </p>
                    <p className="text-sm text-relic-parchment/60 whitespace-pre-wrap break-words">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 pb-4">
            <a
              href={pr.html_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-relic-parchment/40 hover:text-relic-parchment/70 transition-colors"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export function Changelog() {
  const [prs, setPrs] = useState<GHPull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/changelog.json")
      .then((r) => r.json())
      .then((data: GHPull[]) => {
        setPrs(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-relic-rune font-display text-sm tracking-widest uppercase">
          Updates
        </p>
        <h1 className="text-3xl sm:text-4xl">Changelog</h1>
        <p className="text-relic-parchment/70 text-sm max-w-2xl">
          Every merged change to the Tabletop Relics app.
          {BUILD_SHA !== "dev" && (
            <span className="ml-2 font-mono text-relic-parchment/40 text-xs">
              deployed {BUILD_SHA.slice(0, 7)}
            </span>
          )}
        </p>
      </header>

      {loading && (
        <p className="py-12 text-center text-sm text-relic-parchment/40">Loading…</p>
      )}
      {error && (
        <p className="py-12 text-center text-sm text-relic-parchment/40">
          Could not load changelog from GitHub.
        </p>
      )}

      <div className="space-y-3">
        {prs.map((pr) => (
          <PrCard
            key={pr.number}
            pr={pr}
            isLive={BUILD_SHA !== "dev" && pr.merge_commit_sha === BUILD_SHA}
          />
        ))}
      </div>
    </div>
  );
}
