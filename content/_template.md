---
# ─────────────────────────────────────────────────────────────────────────────
# Eduport Tech Blog · default post template
# Copy this file to content/posts/YYYY-MM-DD-short-slug.md and fill it in.
# The file name becomes the URL. Everything between the --- lines is metadata.
# ─────────────────────────────────────────────────────────────────────────────
title: Lead with the result, with the number in it
date: 2026-01-01
author: tech-team             # key from content/authors.yaml (add yourself there first)
category: improvement         # achievement | improvement | release | feature | experiment | cost | insight
tags: [database, latency]     # lowercase, 2–5 tags; reuse existing ones where possible
summary: One or two sentences that could stand alone in a chat message. Shown in the list and as the opening line of the post.
cover: https://example.com/path/to/cover.png   # optional, remote URL, 1200×675 works best
featured: false               # true pins the post in the sidebar
draft: true                   # set to false to publish
---

## Context

Two or three sentences. What was the problem, what triggered the work, and what did we measure before touching anything? Name the system, the date range, and the metric.

## What we did

The concrete change, in the order it happened. Link the PR, ticket, or dashboard so the next reader can follow the trail:

- **Short label** – one line on what changed and why.
- **Another change** – keep each bullet to one idea.

Show a snippet only if it is the point of the post:

```sql
-- the query before
SELECT * FROM enrollments WHERE user_id = $1;
```

## Result

Numbers before and after, same window on both sides. A small table beats a paragraph:

| Metric | Before | After | Change |
|---|---|---|---|
| p95 latency | 420 ms | 180 ms | −57% |
| DB CPU per request | 35.2 ms | 16.0 ms | −54.5% |

A screenshot of the graph helps when the shape matters, not just the number. Remote URLs only:

![Primary CPU during the evening peak, before and after](https://example.com/path/to/graph.png)

> Pull out the one sentence you want people to remember, as a quote.

## What we learned

What surprised us, what we would do differently, and what is still open. Honest beats polished: a failed experiment with a clear reason is a good post.

## Follow-ups

- [ ] The next step, with an owner if there is one.
- [ ] A thing to re-check in a month.

---

*House style, delete before publishing: result in the title, numbers with units and a window, one idea per bullet, link the evidence, no marketing voice. See content/STYLE.md.*
