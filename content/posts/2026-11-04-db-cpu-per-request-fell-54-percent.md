---
title: DB CPU per request fell 54.5% during the evening peak
date: 2026-02-01
author: infra
category: cost
tags: [database, postgres, rds, connection-reuse, latency, production]
summary: Compared with the previous Tuesday, November 3 served 5.8% more origin requests while combined primary and replica CPU cost fell from 35.21 to 16.01 milliseconds per request. Overall latency improved and connection churn nearly disappeared.
cover: https://assets.eduport.app/techblog/django-postgres-optimization-jark.png
featured: true
draft: false
---

*Infrastructure · Production peak comparison · November 3, 2026 peak, reviewed November 4.*

All windows: 6:30–8:30 PM IST · prod, prod2 and dashboard web services · two 8-vCPU RDS instances · no production settings changed by this review.

> **Attribution has a limit.** Request volume and route mix are comparable, but SQL work per request also changed. The 54.5% reduction is the measured production outcome; connection reuse's precise share cannot be separated from these observations alone. Existing slow-tail and application-error issues remain.

## Compare the same two-hour peak

October 27 is the preferred reference because it is the previous Tuesday, traffic is similar, and replica query work is closer than on November 2. November 2 is retained as a sensitivity check. November 3 traffic was 5.8% higher than October 27 over the same 120-minute window.

| Measure | October 27 · before | November 3 · reuse | Change |
|---|---|---|---|
| Origin HTTP requests | 1,521,887 | 1,610,070 | +5.8% |
| Requests / second | 211.37 | 223.62 | |
| Primary CPU ms / request | 24.65 | 8.80 | 64.3% lower |
| Replica CPU ms / request | 10.56 | 7.21 | 31.8% lower |
| **Combined CPU ms / request** | **35.21** | **16.01** | **54.5% lower** |
| Primary CPU seconds · integrated | 37,515 | 14,170 | |
| Replica CPU seconds · integrated | 16,068 | 11,601 | |
| Primary average / peak CPU | 65.1% / 79.4% | 24.6% / 29.9% | 40.5 pp mean drop |
| Replica average / peak CPU | 27.9% / 48.7% | 20.1% / 39.6% | 7.8 pp mean drop |

CPU cost integrates all 120 one-minute CPU averages × 8 vCPUs and divides by aligned origin requests. It includes Celery, analytics and other database background work. Peak CPU uses CloudWatch Maximum; all peak CPU series contain 120 samples.

Against the November 2 sensitivity baseline (4.0% less traffic than November 3), combined CPU per request fell 56.4%.

## Response times improved, including on the same routes

These percentiles merge request-duration histograms from all three servers. They are whole-window percentiles, including failed and locally answered requests, rather than averages of minute-level percentiles.

| Origin request duration | Oct 27 | Nov 2 | Nov 3 | Vs previous Tuesday |
|---|---|---|---|---|
| p95 | 1,299 ms | 2,304 ms | **379 ms** | 70.8% lower |
| p99 | 3,693 ms | 9,415 ms | **2,807 ms** | 24.0% lower |

Nginx `request_time` measures the origin-server request lifecycle, including server/proxy queues and response transfer. It does not measure the complete browser-to-Cloudflare-to-origin round trip ([Nginx definition](https://nginx.org/en/docs/http/ngx_http_core_module.html#var_request_time)).

Holding the previous Tuesday's route weights fixed over 38 comparable routes covering about 91% of forwarded requests gives p95 **1,252 → 327 ms** and p99 **3,630 → 2,614 ms**. The improvement is visible within common endpoints, not just from a different endpoint mix.

Per-route figures cover requests with an upstream response status. Local replies and aborts without that status remain included in the whole-site percentiles above. The 20 busiest of the 38 complete route comparisons, reference October 27:

| Route | Requests · before / after | p95 · before → after | p99 · before → after |
|---|---|---|---|
| `POST /api/v3/sync/screen-time` | 180,846 / 186,029 | 1,180 → 158 ms | 3,578 → 2,250 ms |
| `GET /api/v4/version/app` | 126,493 / 143,767 | 1,163 → 121 ms | 3,580 → 2,307 ms |
| `GET /api/v3/dailytasks/list` | 117,991 / 130,986 | 1,287 → 327 ms | 3,618 → 2,428 ms |
| `GET /api/v3/analytics/leaderboard/coins` | 113,442 / 125,123 | 1,064 → 137 ms | 3,446 → 2,211 ms |
| `GET /api/v3/syllabus/subtopic` | 80,097 / 85,935 | 1,104 → 155 ms | 3,515 → 2,250 ms |
| `GET /api/v3/study-quiz/checkpoint-quiz` | 79,849 / 85,733 | 1,099 → 162 ms | 3,462 → 2,317 ms |
| `GET /api/v3/syllabus/chapter-content/` | 63,911 / 68,381 | 1,168 → 157 ms | 3,621 → 2,291 ms |
| `POST /api/v3/external-id` | 61,869 / 66,969 | 1,117 → 161 ms | 3,501 → 2,350 ms |
| `POST /api/v3/subtopic/video-progress-update` | 58,239 / 62,122 | 1,207 → 246 ms | 3,586 → 2,391 ms |
| `GET /api/v3/analytics/streak/now` | 58,748 / 60,942 | 1,115 → 140 ms | 3,527 → 2,143 ms |
| `POST /api/v3/study-quiz/submit/checkpoint-quiz` | 41,645 / 51,939 | 1,223 → 221 ms | 3,711 → 2,517 ms |
| `GET /api/v3/stickers/config` | 45,877 / 45,422 | 1,114 → 141 ms | 3,556 → 2,214 ms |
| `POST /api/v3/study-quiz/submit/non-adaptive-quiz` | 30,016 / 40,430 | 1,198 → 190 ms | 3,659 → 2,371 ms |
| `GET /api/v3/home` | 37,582 / 38,241 | 1,755 → 1,496 ms | 4,455 → 10,180 ms |
| `GET /api/v3/syllabus/last-chapter-activity/` | 37,800 / 37,233 | 1,126 → 125 ms | 3,488 → 2,214 ms |
| `GET /api/v3/syllabus/chapters` | 30,780 / 29,550 | 1,211 → 250 ms | 3,515 → 2,034 ms |
| `GET /api/v3/onboarding/contact` | 28,855 / 29,420 | 1,063 → 121 ms | 3,538 → 2,174 ms |
| `GET /api/v3/exams/all` | 31,256 / 23,726 | 1,277 → 442 ms | 3,595 → 2,193 ms |
| `GET /api/v3/version/app` | 24,853 / 14,969 | 1,100 → 114 ms | 3,508 → 2,425 ms |
| `POST /api/v3/resources/attachment-progress-update` | 16,961 / 14,187 | 1,291 → 185 ms | 3,642 → 2,360 ms |

> **Follow-up: home still has a slow tail.** `GET /api/v3/home` p99 was **4.455 s on Oct 27, 11.898 s on Nov 2, and 10.180 s on Nov 3**. The tail remains worse than the previous Tuesday, but the problem was already present before this rollout. This review does not establish its cause.

## No observed connection-error regression; application errors remain

| Measure | Oct 27 | Nov 2 | Nov 3 |
|---|---|---|---|
| HTTP 5xx · count / per 10,000 | 529 / 3.476 | 1,076 / 6.950 | 548 / 3.404 |
| HTTP 500 · count / per 10,000 | 202 / 1.327 | 739 / 4.773 | 292 / 1.814 |
| HTTP 502 · count | 327 | 337 | 256 |
| Client aborts · HTTP 499 · per 10,000 | 7.780 | 51.264 | 3.447 |
| Request timeouts · HTTP 408 · count | 17 | 39 | 61 |
| Captured DB connection error events | Incomplete coverage | 0 observed | 0 observed |
| Other captured DB error events | Incomplete coverage | 0 observed | 8 · existing truncation issue |

Overall HTTP 5xx rate stayed approximately flat against the previous Tuesday and improved against November 2. HTTP 500 alone increased versus the previous Tuesday, even as 502s and client aborts fell. HTTP 408 counts rose from 17 to 61; these are request timeouts, not evidence of DB connection failures.

No OperationalError, InterfaceError, stale-connection, SSL-closure or connection-exhaustion events were found in the captured November 2–3 Sentry results or the matching retained Gunicorn journal checks. This is an observation within those sources, not proof that every failure was captured.

November 3 had **8 unhandled DataError / StringDataRightTruncation events** on `/api/v3/subtopic/video-progress-update` (**0.050 captured events per 10,000 origin requests**). The [existing issue PROD-59RZ08KB](https://sentry.eduport.in/organizations/eduport/issues/131973/) first appeared on October 31, before connection reuse. November 2's matched window had zero captured database errors. Log lines can duplicate an exception; the event count uses Sentry's 8 events rather than the 16 matching traceback lines.

October 27 Sentry error data was unavailable, and the dashboard service journal did not retain that window; no complete DB-error rate is claimed for that baseline. Current tracing configuration is 5%; sampled Sentry spans were not used as the request denominator or the primary p95/p99 source. Errors and tracing have different capture paths. Captured error events are not a census of failed requests.

## How much can be attributed to connection reuse?

**Observed: combined DB CPU/request fell 54.5% versus Oct 27 and 56.4% versus Nov 2.** The primary's CPU/request fell 64.3%; the replica's fell 31.8% against Oct 27. This controls traffic volume, but not all changes in query cost, cache behavior or background work.

| Work per HTTP request · vs Oct 27 | Primary before → after | Replica before → after |
|---|---|---|
| Authentication attempts / request | 0.960 → 0.013 | 0.173 → 0.004 |
| Committed transactions / request | 9.61 → 8.96 | 1.31 → 1.27 |
| Tuples fetched / request | 2,180 → 633 | 3,704 → 2,717 |
| Tuples returned / request | 19,519 → 15,727 | 11,256 → 9,734 |

The route-share difference is only 3.6 percentage points in total variation. However, fetched tuples per request dropped sharply, particularly on primary. Endpoint mix alone therefore cannot explain or rule out other changes to query work.

**Conditional connection-cost estimate: about 11.3 CPU ms/request.** Transfer the isolated benchmark's approximately 10.13 ms CPU cost per avoided connection to the drop in authentication attempts per request. This produces about **9.6 ms on primary + 1.7 ms on replica**, equivalent to roughly **32% of the old combined CPU/request**.

This is a mechanism-based scenario, not a measured causal saving or a decomposition of the 54.5% outcome. Authentication attempts may include failed or unrelated clients; connection cost under production contention may differ from `SELECT 1` on the isolated instance. No production A/B test or synthetic load was run.

## CPU stayed lower while request volume stayed comparable

*Chart to add: three matched evening peaks showing primary CPU, replica CPU and requests per second, full 120-minute series. October 27 is gray, November 2 amber, November 3 blue. November 3 has much lower primary CPU despite similar or higher HTTP traffic. Source: AWS/RDS CPUUtilization and complete retained origin access logs. Upload `peak-timeline.svg` and replace this paragraph with `![caption](https://...)`.*

## Retained connections fit within available memory

| Resource | Oct 27 | Nov 2 | Nov 3 |
|---|---|---|---|
| Primary open connections · average / maximum | 18.7 / 29 | 20.4 / 40 | 48.9 / 52 |
| Primary free memory · minimum | 20.92 GiB | 20.90 GiB | 20.37 GiB |
| Primary swap · maximum | 2.83 MiB | 2.83 MiB | 4.58 MiB |
| Replica open connections · average / maximum | 26.1 / 34 | 22.7 / 37 | 63.9 / 76 |
| Replica free memory · minimum | 20.69 GiB | 20.86 GiB | 20.59 GiB |
| Replica swap · maximum | 5.52 MiB | 5.32 MiB | 5.32 MiB |

More open connections are expected under reuse. Primary swap increased by about 1.8 MiB at the peak, while more than 20 GiB remained free on each instance. Swap samples are incomplete in the historical windows; missing samples were not filled with zero.

After-peak inspection found all 24 web workers started after the environment edits, with Gunicorn service masters restarted around 12:51 PM IST on November 3. Fresh settings probes resolved `60 / True` for both aliases on all three web hosts and `0 / False` on Celery. Fresh probes do not introspect existing worker memory; the restart chronology and native counter drop provide the supporting production evidence.

## Scope and evidence

Measurement and coverage:

- Exactly 6:30 PM inclusive to 8:30 PM exclusive IST for Oct 27, Nov 2 and Nov 3. Origin request timestamps are recorded at completion.
- All 120 CPU minutes have matching request-count coverage. Retained files bracket each window on all three hosts; selected JSON records had zero parse errors or missing duration fields.
- Scope includes Eduport app virtual hosts on prod, prod2 and dashboard, both successful and failed responses. Englishwaves logs, static/health routes with access logging disabled, browser timing and edge cache hits are excluded. It counts origin requests, including retries, not unique visitors.
- CPU seconds = Σ(CPU% ÷ 100 × 8 × 60). CPU ms/request = CPU seconds × 1,000 ÷ aligned origin requests. The combined figure sums both databases' CPU seconds.
- RDS class is db.m6g.2xlarge, 8 vCPUs per instance, verified with AWS APIs and matching the earlier benchmark configuration. Hardware changes between historical samples were not directly observed.
- Authentication counters are cumulative. Only valid adjacent minute differences are used, with request counts from those same intervals. Coverage is 119 minutes for most series and 117 minutes for Oct 27 replica because of a missing sample. No counter gap is interpreted as zero.
- Latency percentiles use integer millisecond histograms and nearest-rank quantiles. Request counts and histograms reconcile exactly. Same-route results include only endpoints with complete histograms across the compared hosts.
- All production checks were read-only. No service restarts, configuration changes, deployments, database writes or load generation were performed.

Calculated results and methods, after-peak runtime verification, Sentry query results, CloudWatch exports and access-log aggregates are retained in the review folder beside the original report (`data/analysis.json`, `data/runtime-verification.json`, `data/sentry-query-results.json`, `data/2026-11-03-cloudwatch.json`, `data/2026-10-27-cloudwatch.json`, `data/nginx-prod-complete.json`, `peak-timeline.png`).

References: [AWS RDS metric definitions](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-metrics.html) · [Nginx request_time definition](https://nginx.org/en/docs/http/ngx_http_core_module.html#var_request_time). Customer identifiers and raw request logs were not exported.
