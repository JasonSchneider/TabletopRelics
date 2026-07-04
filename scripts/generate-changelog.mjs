// Fetches merged PRs from GitHub at build time and writes public/changelog.json.
// Requires GITHUB_TOKEN env var (a fine-grained PAT with read access to pull requests).
// If the token is absent the file is written as an empty array so the build still succeeds.
import { writeFileSync } from "fs";

const REPO = "JasonSchneider/TabletopRelics";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.warn("[changelog] No GITHUB_TOKEN — writing empty changelog.json");
  writeFileSync("public/changelog.json", "[]");
  process.exit(0);
}

const res = await fetch(
  `https://api.github.com/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "tabletop-relics-build",
    },
  }
);

if (!res.ok) {
  console.error(`[changelog] GitHub API ${res.status}: ${await res.text()}`);
  writeFileSync("public/changelog.json", "[]");
  process.exit(0);
}

const data = await res.json();
const merged = data
  .filter((p) => p.merged_at !== null)
  .sort((a, b) => new Date(b.merged_at).getTime() - new Date(a.merged_at).getTime())
  .map((p) => ({
    number: p.number,
    title: p.title,
    body: p.body,
    merged_at: p.merged_at,
    merge_commit_sha: p.merge_commit_sha,
    html_url: p.html_url,
    user: p.user ? { login: p.user.login, avatar_url: p.user.avatar_url } : null,
  }));

writeFileSync("public/changelog.json", JSON.stringify(merged, null, 2));
console.log(`[changelog] Wrote ${merged.length} PRs to public/changelog.json`);
