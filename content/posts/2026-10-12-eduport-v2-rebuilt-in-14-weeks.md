---
title: "Eduport V2: rebuilt in 14 weeks, crash rate down 72%"
date: 2026-10-12
author: mobile
category: achievement
tags: [mobile, flutter, architecture, migration, production]
summary: "Between July and November 2026 we rebuilt the Eduport learner app on a new codebase without changing what students see. Four weeks after release, 90% of our Android users were on it, and the share of users hit by a crash in a week fell from 1.08% to 0.30%."
cover: /images/eduport-v2/cover.png
featured: true
draft: false
---

*V2 reached Google Play on 12 October 2026. The figures in this post run to 7 November.*

## Why we started over

The first version of the Eduport app had grown for four years. It worked, but every change was getting harder to make safely.

- **Code was grouped by layer, not by feature.** The code for live classes alone was spread over eight folders in four layers. Fixing one feature meant understanding all of them.
- **Most checks were manual.** Automated tests covered a small part of the app, so each release leaned on manual testing.
- **Every device was locked to portrait.** Tablets showed an enlarged phone layout and could not rotate.

Fixing this in place would have meant touching almost every file while the old app kept shipping. So in July 2026 we started a new codebase and moved the features across one at a time, while V1 kept getting releases.

## What we kept the same

Students should not notice the switch, except that things work better. So the rebuild was one-to-one on everything a student sees: every screen, the order of every flow, every loading and error state, and what the app sends to our servers. Only the code underneath was new.

Updating had to be invisible too. A student who updates from Google Play stays signed in, and their downloads and study reminders carry over.

## How it went

![Timeline of the rebuild in four phases, foundations, porting features, QA and rollout, from the first commit on 5 July 2026 to 90% of Android users on 7 November](/images/eduport-v2/timeline.png)
*From the first commit on 5 July to 90% of Android users on 7 November.*

- **Foundations, July.** Before the first screen: code style rules, automated checks on every change, a build setup for each app we ship, the first architecture test, and the rule for phones and tablets.
- **Porting features, late July to September.** Home first, then the video player and mini player, downloads, live classes, AI chat, analysis, exams, daily goals, and the question library and quizzes. The upgrade path from V1 came last.
- **QA, late September to early October.** Our QA team tested V2 in rounds, and we fixed what they found.
- **Rollout, from 12 October.** Version 9.2.0 reached its first Google Play users on 12 October. Two follow-up releases came within two weeks.

In all, 224 commits and 152 merged pull requests from a small team.

## One folder per feature, and a test that keeps it that way

![V1 spreads the live-class code over eight folders in four layers; V2 keeps it in one feature folder with presentation, domain and data layers](/images/eduport-v2/architecture.png)
*Where the live-class code lives in each version.*

Each V2 feature lives in one folder with three layers. The presentation layer holds screens, widgets and their state, managed with Cubit or Bloc. The domain layer holds the business rules and has no UI or network code. The data layer talks to our servers and to storage on the device. Presentation and data both depend on the domain layer, never the other way round.

Teams agree on rules like these all the time and drift anyway. Ours are written as an automated test of 23 rules that runs on every pull request. The domain layer stays independent, the UI never reaches into the data layer, features never reach into each other, third-party libraries stay behind our own interfaces, and colours and text sizes come from the design system. A change that breaks a boundary fails before anyone reviews it.

What that gives us:

- **A change stays in one place.** A live-class fix happens in the live-class folder and nowhere else.
- **Each layer can be tested on its own.** Business rules against fake data, state against scripted events, widgets against fixed states. V2 now runs more than 15,000 automated tests.
- **Infrastructure can be replaced in one place.** The network client, the cache and crash reporting each sit behind one interface.

## Tablets get their own layout

![The live class on three devices: V1 on a tablet, locked to portrait; V2 on a phone, with chat under the video; V2 on a landscape tablet, with chat beside the video](/images/eduport-v2/tablets.png)
*The live class. On a landscape tablet, V2 puts the chat beside the video.*

V1 locked every device to portrait. It enlarged sizes on tablets but kept the phone layout. V2 settled the question on day one: if the shortest side of the window is 600 dp or more, it is a tablet, and anything smaller is a phone. Phones stay in portrait. Tablets rotate freely, content is capped at a readable width, and screens can use the extra space.

The live class shows the difference best. On a landscape tablet the chat runs the full height beside the video, instead of a strip under it.

## Did students move, and did it hold up

![Share of Android daily users on V2, from 0% on 11 October to 59% on 19 October and 90% on 7 November](/images/eduport-v2/adoption.png)
*Share of Android daily users on V2, by day.*

Version 9.2.0 reached its first users on 12 October. A week later, 59% of our Android daily users were on V2. By 7 November it was 90%.

To compare reliability, we took one full week of each version on Android, every build included:

| One week, all builds | V1 · 5–11 Oct | V2 · 31 Oct – 6 Nov |
|---|---|---|
| Users who had a crash | 1.08% | 0.30% |
| Users who had an ANR (app not responding) | 1.13% | 0.52% |

Users still on V1 in the second week were at 1.09% and 1.17%, close to V1's numbers before the switch. So the drop comes from the new app, not from a quieter week.

*Source: Firebase Crashlytics, Android. Users are counted per app version, so someone who updated during a week counts once for each version.*

The first release still had problems on some devices. We went through every crash and ANR report and fixed only what we could prove: each fix ships with a test that fails if the fix is removed.

## What changed for the team

- **Reviews focus on behaviour.** Structure mistakes fail the architecture test, so review time goes to what the code does.
- **Every new feature starts from the same shape.** Three layers, the same way of wiring dependencies and screens, and tests at each layer.
- **QA gets builds faster.** A tested build of a change reaches testers' phones in about 20 minutes on Android and 25 on iOS.

## What we learned

- **Write the rules as tests on day one.** Our first architecture test went in during the first week, before most features existed, so every feature was built inside the rules.
- **Test on unusual devices before a rollout.** The problems in 9.2.0 came from particular Android versions and devices that our test phones did not cover.

## Next

- **A faster start.** We are testing a change that shows the last Home screen at once and refreshes it in place.
- **Fewer ANRs.** They are down by half, but they are now the most common problem left.
- **More end-to-end tests** for the flows students use most.

*V2 was built by the Eduport mobile team, with our QA and backend teams behind every release.*
