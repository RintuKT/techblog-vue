---
title: Welcome to the Eduport Tech Blog
date: 2026-11-04
author: tech-team
category: insight
tags: [meta, writing]
summary: What this blog is for, what belongs here, and how to publish a post in under five minutes.
cover: https://picsum.photos/seed/eduport-welcome/1200/675
featured: true
draft: false
---

## What this is

An internal, engineering-only record of what we ship, what we improve, what we tried, and what we learned. It is not marketing. Short, honest posts with numbers beat long polished ones.

## What belongs here

- **Achievements** – a milestone reached, a target hit.
- **Improvements** – something got measurably faster, smaller, or more reliable.
- **Releases and new features** – what went out and why.
- **What we tried** – experiments, including the ones that did not work.
- **Cost optimization** – anything that lowered the bill, with before and after figures.
- **Insights and thoughts** – patterns noticed, opinions worth sharing.

## How to publish

1. Copy `content/_template.md` to `content/posts/YYYY-MM-DD-short-slug.md`.
2. Fill the front matter. `author` must match a key in `content/authors.yaml`; add yourself there if missing.
3. Write the body in Markdown. Tables, code blocks and images in `public/` all work.
4. Set `draft: false`, commit, push. The site rebuilds from the files; there is no database to update.

## House style

- Lead with the result. Put the number in the title when there is one.
- Say what changed, not just that something changed.
- Include before/after figures and the measurement window.
- Write what you would want to read six months from now when the same problem returns.
