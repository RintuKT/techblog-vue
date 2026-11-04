---
title: "SaaS vs self-host: where each one wins, and how we decide"
date: 2026-11-04
author: tech-team
category: insight
tags: [infrastructure, cloud, cost, self-hosting, rds, video, decision-making]
summary: We run our database on RDS and our video transcoding on our own machines. Both are the right call. This is the reasoning behind each, the cases that changed our minds, and the checklist we use before picking managed or self-hosted for anything new.
cover: https://picsum.photos/seed/eduport-saas-selfhost/1200/675
featured: true
draft: false
---

Every few months someone proposes moving something off a managed service to save money, or moving something onto a managed service to stop babysitting it. Both proposals are sometimes right. The mistake is treating it as one question. It is a per-workload question, and the answer depends on what breaks when the thing breaks.

This post sets out how we think about it, with the two clearest examples from our own stack and a few public cases worth knowing.

## The short version

| | Managed (SaaS / IaaS) | Self-hosted |
|---|---|---|
| Wins when | The failure mode is data loss or downtime, the workload is stateful, and the vendor's operational tooling is better than what we would build | The workload is stateless or easily rebuilt, usage is high and steady, and the vendor's unit price is far above raw compute |
| Cost shape | Higher unit price, near-zero operations cost | Lower unit price, real operations cost in people and time |
| What you pay for | Backups, failover, patching, upgrades, monitoring, someone else's 3 AM | Hardware or VMs, plus the hours of the people who keep it running |
| Risk you keep | Vendor pricing changes, lock-in, limited control over tuning | Everything, including the parts you have not thought of yet |
| Typical examples | Primary database, object storage, DNS, email delivery, auth | Batch processing, transcoding, CI runners, caches, internal tools |

The rest of the post is why.

## Case 1: the database stays on RDS

Our Postgres primary and replica run on RDS, two db.m6g.2xlarge instances. We could run Postgres ourselves on EC2 for roughly half the instance price. We do not, and the reason is not the price of the instance. It is everything around it.

**What RDS gives us without a ticket:**

- **Continuous backup.** Transaction logs are shipped every five minutes, so point-in-time recovery is available to any second in the retention window. A bad migration at 7:42 PM can be rolled back to 7:41 PM.
- **Automated failover.** With Multi-AZ, a hardware fault or an AZ problem promotes the standby in about a minute, with the same endpoint. No one has to be awake for it.
- **Patching and minor upgrades** happen in a maintenance window we choose. Major-version upgrades are a tested path, not a weekend project.
- **Storage that grows** without a resize outage, and monitoring (CloudWatch, Performance Insights) that we used directly in the [November 3 peak comparison](#/post/2026-11-04-db-cpu-per-request-fell-54-percent) to measure authentication attempts and CPU per request.

**What self-hosting would mean:** writing and testing the WAL archiving, proving restores actually work every month, building the failover and the fencing so that two primaries never run at once, patching the OS and Postgres, and carrying the pager. That is a part-time person at minimum, and the first time a restore fails is the time it matters.

The cost per request numbers in the peak comparison show the lever we actually have on the database bill: making each request cheaper, which cut CPU per request by 54.5%. That is a much bigger saving than the instance-price gap between RDS and EC2, with none of the operational risk.

**The rule we take from it:** when the failure mode is *losing data* or *being down*, pay for the managed service and spend the engineering time on making the workload cheaper instead.

## Case 2: video transcoding stays self-hosted

Every uploaded class recording is transcoded into an HLS ladder (several bitrates plus the playlist) before it reaches the player. We run this on our own machines with a pipeline we built around ffmpeg.

**Why managed transcoding did not fit:** managed video services price per minute of output, and an HLS ladder multiplies the minutes: a one-hour recording rendered at five bitrates is five hours of billable output. At our monthly recording volume that unit price dominates. Transcoding is also the ideal self-host workload:

- **Stateless.** Input in object storage, output back to object storage. If a worker dies mid-job, the job restarts from the beginning. Nothing is lost.
- **Not latency-sensitive.** A recording that finishes ten minutes later is fine. We can queue, batch, and run on whatever capacity is cheapest.
- **Predictable.** We know roughly how many hours are recorded each week, so capacity planning is simple.
- **Boring to operate.** The failure modes are "worker is down" or "queue is backing up", both of which a single alert covers.

**What it costs us:** the machines, and a few hours a month when ffmpeg or a codec needs attention.

**The numbers** (fill in from the billing export and the pipeline dashboard before publishing):

| | Managed transcoding | Self-hosted pipeline |
|---|---|---|
| Minutes transcoded / month | _n_ | _n_ |
| Cost / month | _₹ at vendor list price × ladder multiplier_ | _machine cost + share of ops time_ |
| Time from upload to playable | _n min_ | _n min_ |
| Incidents in the last 12 months | n/a | _n_ |

**The rule we take from it:** when the workload is stateless, high-volume, and tolerant of delay, self-host and put the savings on the table.

## Public cases worth knowing

These are reported figures from the companies themselves, not our measurements.

- **37signals (Basecamp, HEY) left the cloud.** They moved from AWS to their own hardware in 2023 and have reported expected savings of around $10 million over five years, with the hardware paid off in the first year. The workloads were steady and well understood, and they kept a small ops team. It worked because their usage was flat and predictable, which is the exact condition under which the cloud premium is pure cost.
- **Dropbox built its own storage.** Dropbox moved most user data off S3 onto its own "Magic Pocket" infrastructure in 2015–2016 and reported saving about $75 million over two years. Storage at that scale is a core competency for them, and they had the engineering depth to run it. For almost everyone else, S3 is the right answer.
- **GitLab's 2017 database incident.** An engineer accidentally deleted the production database directory on a self-hosted Postgres. Five backup mechanisms were in place; none had been working, and about six hours of data were lost. This is the canonical self-hosting failure: not the deletion, which can happen anywhere, but the untested backups. A managed database would have had a point-in-time restore. GitLab's own write-up is the best argument for "prove the restore works" that exists.
- **Prerender.io moved off AWS.** They reported cutting roughly $800,000 a year in AWS data-transfer and compute charges by moving a cacheable, stateless rendering workload to bare metal. Same pattern as our transcoder: stateless, high volume, egress-heavy.
- **Managed failover, done quietly.** During AWS us-east-1 incidents, Multi-AZ RDS instances failed over automatically while single-AZ self-managed databases on affected hosts stayed down until someone intervened. The value of managed failover is that it is tested continuously by the vendor at a scale no single team can match.

The pattern across all of them: self-hosting wins on steady, well-understood, stateless workloads at volume. Managed wins on stateful workloads where the cost of being wrong is data loss.

## Hidden costs on both sides

**Self-hosting costs people forget**

- Someone has to own the pager. If the answer is "whoever is around", it is not owned.
- Upgrades are deferred until they are forced. Deferred upgrades become migrations.
- Backups that are never restored are not backups. Schedule a restore test or assume they do not work.
- Capacity is bought ahead, so growth means forecasting, and a wrong forecast means an outage or waste.
- Security patching is continuous and unglamorous.

**Managed services cost people forget**

- Unit prices change. A vendor repricing can turn a good decision into a bad one overnight. Keep the migration path real.
- Lock-in is gradual. Proprietary features are convenient right up until you want to leave.
- Egress and request pricing can dwarf the headline price. Read the bill, not the price page.
- "Zero maintenance" still means someone understands the service well enough to tune it. RDS did not make our connection churn go away; we did.

## The checklist we use

Before choosing managed or self-hosted for anything new, answer these in writing:

1. **What is lost if it dies?** Data → managed, unless we have a tested restore story. Nothing → self-host is on the table.
2. **Is the workload stateful?** Stateful leans managed. Stateless leans self-host.
3. **How steady is usage?** Flat and predictable favours self-host; spiky favours managed or elastic.
4. **What is the vendor's unit price relative to raw compute?** Under 2×, managed is usually worth it. Over 5×, self-host and measure.
5. **Who owns it in six months?** Name the person. If no one, managed.
6. **What is the migration path out?** Write it down for whichever option is chosen.
7. **What does the first year cost, all-in?** Include people time for self-host and egress for managed.

If the answers point to self-host, run it as a real service: alerting, a runbook, and a tested restore or rebuild. If they point to managed, spend the saved time making the workload cheaper, which is where the database savings actually came from.

## Where we are today

| Workload | Choice | Reason |
|---|---|---|
| Postgres primary and replica | Managed (RDS) | Data loss risk, continuous backup, automated failover |
| Object storage | Managed (S3) | Durability, cost at our scale, no credible self-host alternative |
| Video transcoding to HLS | Self-hosted | Stateless, high volume, vendor price per output minute |
| Video delivery | CDN (managed) | Egress pricing and edge presence |
| Web and worker servers | IaaS (EC2) | Elastic enough, fully under our control |
| Error tracking | Self-hosted Sentry | Data stays in-house, steady volume |
| CI runners, caches, internal tools | Self-hosted | Rebuildable, cheap, no data at risk |

None of these is permanent. The transcoding pipeline will be revisited if a vendor's per-minute price drops below our machine cost, and the database will be revisited if a managed option appears that is cheaper for the same guarantees. The point of the checklist is that the revisit is a calculation, not an argument.
