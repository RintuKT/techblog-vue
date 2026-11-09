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

## Code and diagrams

**Code blocks** are coloured automatically. Put the language after the opening fence, and optionally a file name after it; the file name shows in the block's header bar.

````markdown
```python cities.py
def get_city(city_id: int) -> dict | None:
    ...
```
````

Supported: `python`, `ts`, `js`, `vue`, `sql`, `bash`, `nginx`, `vcl`, `json`, `yaml`, `http`, `html`, `css`, `dockerfile`, `kotlin`, `swift`, `dart`, `go`. Keep lines under about 66 characters so they fit the column without sideways scrolling; put long comments on their own line.

**Flow diagrams** draw a request path as icon cards joined by arrows. Use a `flow` block instead of ASCII art:

````markdown
```flow
phone | Learner's app | asks for `GET /api/cities/42` | ~0 ms
-> request
app | App server | runs `get_city(42)`
-> miss
db | Postgres | the source of truth | 1–50 ms
~> commit log
worker | Background job | runs after the write
caption: One line under the diagram.
```
````

- A card is `kind | title | detail | metric`. Detail and metric are optional; title and detail accept **bold** and `code`.
- `-> label` is an arrow, `~> label` a dashed arrow for background or async steps. The label is optional.
- Kinds and their icons: `user`, `phone`, `browser`, `laptop` (people and devices); `edge`, `cdn`, `region`, `datacenter`, `shield`, `origin` (network and data centers); `proxy`, `app`, `process`, `worker`, `code` (servers and processes); `cache`, `db`, `storage`, `queue`, `log`, `offline`, `timer`.

**Bold** the few words a skimming reader should not miss: the result, the rule, the term being defined. If everything is bold, nothing is.

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
