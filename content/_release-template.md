---
product: web                 # key from content/products.yaml: web, ios, android, staff, sales, content, studio
version: 1.0.0               # app version, build number, or a date tag for dashboards
date: 2026-01-01
title: Short headline for this release
type: release                # release | major | hotfix | beta
author: tech-team            # optional; key from content/authors.yaml
summary: One or two sentences on what this release is about. Shown in the list.
images:                      # remote URLs only; screenshots, before/after, store listing
  - url: https://example.com/screens/feature-1.png
    caption: What the screenshot shows
  - url: https://example.com/screens/feature-2.png
    caption: Another screen
links:                       # optional
  - label: App Store
    url: https://apps.apple.com/...
  - label: Release PR
    url: https://github.com/...
draft: true                  # set false to publish
---

## New

- **Feature name** – what it does and who it is for.
- **Another feature** – one line is enough; the screenshots carry the rest.

## Improved

- What got faster, simpler, or more reliable.

## Fixed

- Bugs closed in this release.

## Notes

Rollout plan, feature flags, migration steps, known issues.
