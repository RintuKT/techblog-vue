# Eduport Tech Blog · style guide

Internal engineering blog. Readers are colleagues who know the systems. Write for the person who hits the same problem six months from now.

## Choosing what to write

Anything with a result counts: a milestone, a measured improvement, a release, a feature, an experiment (including failed ones), a cost saving, or an insight worth sharing. If there is no result yet, it is a draft.

## Title

- Lead with the result. Put the number in it when there is one.
  Good: *DB CPU per request fell 54.5% during the evening peak*.
  Weak: *Database optimisation work*.
- Under 80 characters. No question marks, no clickbait.

## Summary

One or two sentences that could be pasted into a chat message and make sense alone. It is shown in the list and as the opening line of the post.

## Body

Use the headings from `content/_template.md`: **Context → What we did → Result → What we learned → Follow-ups**. Skip a heading if there is nothing to say under it; do not pad.

- One idea per paragraph, one idea per bullet.
- Numbers always carry a unit and a measurement window (*35.2 ms per request, Tuesday evening peak*).
- Compare like with like: same window, same traffic shape, same metric definition.
- Link the evidence: PR, ticket, dashboard, runbook.
- Code blocks only when the code is the point. Tables for before/after figures.
- Plain language. No marketing voice, no superlatives, no "we are excited".
- Write "we" for the team and name the people who did the work in the body or as the author.

## Images

Remote URLs only (bucket, CDN, Drive share link). Nothing binary in the repo.

- `cover:` 1200×675 or similar 16:9. Used on the post page and as the list thumbnail.
- Inline: `![caption](https://...)`. The alt text is the caption; make it say what the graph shows.
- Phone screenshots in release notes: 800×1600 or the native size.

## Metadata

| Field | Rule |
|---|---|
| `author` | A key from `content/authors.yaml`. Add yourself before your first post. |
| `category` | One of: achievement, improvement, release, feature, experiment, cost, insight. |
| `tags` | Lowercase, 2–5, reuse existing tags (see the Topics list on the home page). |
| `date` | The day it is published, `YYYY-MM-DD`. |
| `featured` | Only for posts the whole team should see; keep to a handful at a time. |
| `draft` | `true` while writing. Drafts show in `npm run dev` only. |

## Releases

Release notes are separate from posts and live in `content/releases/`. Use `content/_release-template.md`. Headings there are **New → Improved → Fixed → Notes**; version, date, and product are required, screenshots are strongly encouraged.

## Before you publish

1. Title has the result. Summary stands alone.
2. Every number has a unit and a window.
3. Evidence is linked.
4. `draft: false`, commit, push.
