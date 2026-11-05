---
product: web
version: 2026.10.20
date: 2026-10-20
title: New learner dashboard
type: major
author: tech-team
summary: The learner home page is rebuilt around today's schedule, with continue-watching and pending assignments above the fold.
images:
  - url: https://picsum.photos/seed/eduport-web-dash-a/1200/750
    caption: Dashboard with today's schedule and continue watching
  - url: https://picsum.photos/seed/eduport-web-dash-b/1200/750
    caption: Assignments panel
draft: false
---

## What changed

- **Today first** – the schedule for the current day sits at the top, with live classes highlighted.
- **Continue watching** – last three partially watched classes with progress.
- **Assignments** – pending and overdue items grouped, with due dates.

## Why

Session recordings showed most learners landing on the home page and immediately navigating to the schedule. The new layout removes that step.

## Rollout

Enabled for all learners on October 20 behind the `dashboard_v2` flag; the old page is removed in the next release.
