---
title: DB CPU per request fell 54.5% during the evening peak
date: 2026-11-04
author: infra
category: cost
tags: [database, postgres, latency, production]
summary: Compared with the previous Tuesday, November 3 served 5.8% more origin requests while combined primary and replica CPU cost fell from 35.21 to 16.01 milliseconds per request. Overall latency improved and connection churn nearly disappeared.
draft: false
---

## Context

This compares the evening peak on **Tuesday, November 3, 2026** against the previous Tuesday. Peak windows were taken from the same hour range on both days, and numbers were reviewed on November 4.

## Headline

Combined primary and replica CPU cost per origin request dropped by more than half, even though the site served more traffic.

| Metric | Previous Tuesday | November 3 | Change |
|---|---|---|---|
| Origin requests (peak) | baseline | +5.8% | more traffic |
| DB CPU per request (primary + replica) | 35.21 ms | 16.01 ms | −54.5% |
| Connection churn | present | near zero | — |
| Overall latency | baseline | improved | — |

## What changed

_Fill in the specific changes that landed between the two peaks (for example: query rewrites, index additions, connection pooling settings, caching layers). Link the pull requests or tickets so the next reader can follow the trail._

## Why it matters

- **Cost:** CPU per request is the number that drives how many database instances we need at peak. Halving it pushes the next resize out considerably.
- **Headroom:** the system absorbed 5.8% more requests with less database work, so the gain is not an artefact of lower load.
- **Stability:** connection churn disappearing means fewer reconnect storms and steadier latency tails.

## Follow-ups

- Keep the same peak comparison running weekly so regressions show up as a number, not a feeling.
- Document the pooling and query changes in the runbook.
