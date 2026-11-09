---
title: "Caching from the phone to the database: every layer, when it helps, and how the big platforms do it"
date: 2026-11-09
author: infra
category: insight
tags: [caching, redis, cdn, nginx, varnish, architecture, offline, performance]
summary: "A request can be answered from six different caches before it reaches the database. This is a field guide to each layer, with a city analogy, Python and TypeScript code for a small city-lookup service, Nginx and Varnish configs, the failure modes that bite, and how Facebook, Instagram, YouTube, Netflix, Pinterest, Cloudflare, Akamai and CloudFront build theirs."
featured: false
draft: false
---

The cheapest request is the one that **never reaches the database**. The second cheapest is the one that **never leaves the phone**. Caching is how we get there, and it is also how we end up serving **yesterday's price** or **someone else's account page**. Both outcomes come from the same few decisions: **what** to cache, **where**, for **how long**, and **how to throw it away**.

This post walks through every layer between a learner's phone and our Postgres primary, with working code for each, and closes with how the largest platforms structure theirs.

## A city, to keep the layers straight

Think of data as **groceries** and the database as **the farm**.

| In the city | In the system | Speed | Who shares it |
|---|---|---|---|
| The pantry you stock before a power cut | Offline cache on the device (Service Worker, SQLite) | Instant, even with no network | One person |
| Your fridge | Browser / app HTTP cache, in-process memory | Instant | One person or one process |
| The neighbourhood supermarket | CDN edge (Cloudflare, CloudFront, Akamai) | A short trip | Everyone nearby |
| The building's corner shop | Reverse proxy cache (Nginx, Varnish) | Downstairs | Everyone hitting that server |
| The city warehouse | Cache server (Redis, Memcached) | Across town, fast road | All app servers |
| The farm | Database (Postgres on RDS) | Far away, limited capacity | Source of truth |

The farm can only harvest so fast. Every shop in between exists so that most people never drive there, and every shop has the same two problems: stock goes off (**staleness**), and when a shop runs out, everyone drives to the farm at once (**stampede**). The rest of this post is about managing those two problems layer by layer.

## The full picture

```flow
phone | Phone or browser | **Offline cache** and **HTTP cache** on the device | ~0 ms
-> miss
edge | CDN edge PoP | Cloudflare, CloudFront or Akamai, near the user | 5–40 ms
-> miss
proxy | Reverse proxy | **Nginx** or **Varnish** in front of the app | <1 ms
-> miss
app | App server | **In-process cache**: a dict or Map with LRU | µs
-> miss
cache | Cache server | **Redis** or **Memcached**, shared by every server | ~0.5 ms
-> miss
db | Database | **Postgres on RDS**, the source of truth | 1–50+ ms
caption: Latencies are typical orders of magnitude, not measurements of our stack.
```

The shape matters more than the numbers: each layer down is **slower**, **more shared**, and **more expensive to scale**.

**Why hit ratio is the number to watch.** Every read pays for the cache lookup, and every miss also pays for the query: `average = hit × cache + (1 − hit) × (cache + db)`. With a 0.5 ms cache in front of a 20 ms query:

| Hit ratio | Average read | Reads that reach the database |
|---|---|---|
| 80% | 4.5 ms | 20% |
| 95% | 1.5 ms | 5% |
| 99% | **0.7 ms** | **1%** |

Going from 95% to 99% looks small, but it cuts database reads by **five times**. That is why the last few percent of **hit ratio** are worth chasing.

## The running example: a city lookup service

Every code sample below caches the same thing: a small API that returns a **city by ID**.

```json GET /api/cities/42
{
  "id": 42,
  "name": "Kozhikode",
  "state": "Kerala",
  "country": "IN",
  "timezone": "Asia/Kolkata"
}
```

Cities **change rarely**, **everyone sees the same answer**, and the database query is cheap but not free. That makes it a good candidate for every layer at once.

## Layer 1: in-process cache

The fastest cache is a **dictionary inside the running process**. No network, no serialisation. The trade-offs: **each process has its own copy**, memory is limited, and invalidating it across 24 Gunicorn workers is not practical. Use it for **small, hot, slow-changing data** with a **short TTL**.

**Python**: a small TTL + LRU cache.

```python ttl_cache.py
import time
from collections import OrderedDict
from typing import Any

class TTLCache:
    """In-process cache with a TTL and LRU eviction."""

    def __init__(self, ttl_seconds: float, maxsize: int = 1024):
        self.ttl = ttl_seconds
        self.maxsize = maxsize
        # key -> (expires_at, value), least recently used first
        self._data: OrderedDict = OrderedDict()

    def get(self, key: str, default: Any = None) -> Any:
        item = self._data.get(key)
        if item is None:
            return default
        expires_at, value = item
        if expires_at < time.monotonic():
            del self._data[key]
            return default
        self._data.move_to_end(key)  # mark as recently used
        return value

    def set(self, key: str, value: Any) -> None:
        self._data[key] = (time.monotonic() + self.ttl, value)
        self._data.move_to_end(key)
        if len(self._data) > self.maxsize:
            self._data.popitem(last=False)  # evict the oldest

city_cache = TTLCache(ttl_seconds=60, maxsize=5000)

def get_city(city_id: int) -> dict | None:
    key = f"city:{city_id}"
    city = city_cache.get(key)
    if city is None:
        city = fetch_city_from_db(city_id)
        if city is not None:
            city_cache.set(key, city)
    return city
```

For pure functions with no expiry, Python's built-in `functools.lru_cache` is enough. This class is not thread-safe; wrap `get` and `set` in a lock if you use threads.

**TypeScript**: the same idea with a `Map`, which keeps insertion order and so works as an LRU.

```ts ttl-cache.ts
type Entry<T> = { value: T; expiresAt: number };

export class TTLCache<T> {
  private store = new Map<string, Entry<T>>();

  constructor(private ttlMs: number, private maxSize = 1000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Re-insert so it becomes the most recently used
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    const expiresAt = Date.now() + this.ttlMs;
    this.store.delete(key);
    this.store.set(key, { value, expiresAt });
    if (this.store.size > this.maxSize) {
      // The first key in a Map is the least recently used
      const oldest = this.store.keys().next().value as string;
      this.store.delete(oldest);
    }
  }
}
```

## Layer 2: cache server (Redis, Memcached)

A cache server is **shared by every app server**, **survives deploys**, and can be **invalidated in one place**. This is where most application caching belongs.

### Redis vs Memcached vs the rest

| | Redis / Valkey | Memcached |
|---|---|---|
| Data model | Strings, hashes, lists, sets, sorted sets, streams | Strings (bytes) only |
| Threading | Mostly single-threaded command execution | Multi-threaded |
| Persistence | Optional (RDB snapshots, AOF) | None |
| Replication, failover | Built in (replicas, Sentinel, Cluster) | None; client-side sharding |
| Extras | TTL per key, atomic ops, Lua, pub/sub, leaderboards | Simple and very fast at plain get/set |
| Pick it when | You want one tool for cache, counters, rate limits, queues, leaderboards | You want a huge, flat, simple cache and nothing else |

**Valkey** is the Linux Foundation fork of Redis created in 2024 after Redis changed its licence; it is wire-compatible, and AWS ElastiCache and MemoryDB both support it. **Dragonfly** and **KeyDB** are other Redis-compatible servers aimed at multi-core throughput.

### Patterns for using a cache server

| Pattern | On a read | On a write | Use it for |
|---|---|---|---|
| **Cache-aside** | App checks the cache; on a miss it reads the DB and sets the key | App writes the DB, then **deletes** the key | The default for most reads |
| **Read-through** | The cache, or a library in front of it, loads from the DB on a miss | Same as cache-aside | When a library or proxy owns loading |
| **Write-through** | Served from the cache | App writes the DB **and** the cache in the same request | Data read right after it is written |
| **Write-behind** | Served from the cache | App writes the cache; it flushes to the DB later, in batches | Counters and analytics. **Can lose writes** on a crash |
| **Refresh-ahead** | Served from the cache | Hot keys are reloaded **before they expire** | A few hot keys that must never miss |

**Cache-aside** is the default and the one to start with: **the app owns the logic**, a cache outage degrades to **slower reads rather than errors**, and only data that is actually read gets cached. Here is one cache-aside read for city 42:

```flow
phone | Learner's app | asks for `GET /api/cities/42`
-> request
app | App server | Django or Node runs `get_city(42)`
-> GET city:v1:42
cache | Redis | **miss**: the key is not there yet
-> read on a miss
db | Postgres | returns the row, the source of truth
-> app sets city:v1:42 for 1 hour
cache | Redis | now holds the city
-> response
phone | Learner's app | every later request is a **hit** in Redis
caption: The database is read about once an hour per city, however many learners ask.
```

**Python**: cache-aside with redis-py, including negative caching and TTL jitter.

```python cities.py
import json
import random
import redis

r = redis.Redis(host="localhost", decode_responses=True)
MISSING = "__none__"  # marker for "this city does not exist"

def city_key(city_id: int) -> str:
    # Change v1 to v2 to invalidate every city at once
    return f"city:v1:{city_id}"

def get_city(city_id: int) -> dict | None:
    key = city_key(city_id)
    cached = r.get(key)
    if cached == MISSING:
        return None
    if cached is not None:
        return json.loads(cached)

    city = fetch_city_from_db(city_id)
    if city is None:
        # Negative cache: remember "not found" briefly
        r.set(key, MISSING, ex=60)
    else:
        # Jitter, so keys set together don't expire together
        ttl = 3600 + random.randint(0, 300)
        r.set(key, json.dumps(city), ex=ttl)
    return city

def update_city(city_id: int, fields: dict) -> None:
    save_city_to_db(city_id, fields)
    r.delete(city_key(city_id))  # delete, don't overwrite
```

Two details matter here. **Delete after the write, rather than set the new value.** If two writers race, a delete leaves the cache empty and the next reader loads the truth; two racing sets can leave the older value in the cache indefinitely. **Cache the "not found" answer briefly**, otherwise a client asking for city 999999 in a loop hits the database every time.

**Django**: the framework already does most of this.

```python settings.py · services.py · views.py
# settings.py  (Django 4.0+ ships a Redis backend)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://cache.internal:6379/1",
        "TIMEOUT": 3600,
    }
}

# services.py
from django.core.cache import cache
from .models import City

def get_city(city_id: int) -> dict | None:
    return cache.get_or_set(
        f"city:v1:{city_id}",
        lambda: City.objects.filter(pk=city_id).values().first(),
        timeout=3600,
    )

# views.py: cache a whole response for 15 minutes
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)
def city_list(request):
    ...
```

**TypeScript**: cache-aside with ioredis.

```ts cities.ts
import Redis from "ioredis";

type City = {
  id: number;
  name: string;
  state: string;
  country: string;
  timezone: string;
};

const url = process.env.REDIS_URL ?? "redis://localhost:6379";
const redis = new Redis(url);
const MISSING = "__none__";
const cityKey = (id: number) => `city:v1:${id}`;

export async function getCity(id: number): Promise<City | null> {
  const key = cityKey(id);
  const cached = await redis.get(key);
  if (cached === MISSING) return null;
  if (cached !== null) return JSON.parse(cached) as City;

  const city = await db.findCity(id);
  const ttl = city ? 3600 + Math.floor(Math.random() * 300) : 60;
  const value = city ? JSON.stringify(city) : MISSING;
  await redis.set(key, value, "EX", ttl);
  return city;
}

export async function updateCity(
  id: number,
  fields: Partial<City>,
): Promise<void> {
  await db.updateCity(id, fields);
  await redis.del(cityKey(id));
}
```

### Eviction: what happens when memory is full

A cache that never evicts eventually rejects writes or crashes. Redis decides with `maxmemory-policy`:

| Policy | Evicts | Use when |
|---|---|---|
| `allkeys-lru` | Least recently used key, any key | Pure cache. The usual choice |
| `allkeys-lfu` | Least frequently used key | A few keys are hot for a long time |
| `volatile-lru` | LRU among keys that have a TTL | Same Redis also holds data that must not be evicted |
| `noeviction` | Nothing; writes fail | Redis is a primary store, not a cache |

Rule of thumb: if Redis holds anything you cannot rebuild, it is not only a cache, so give it its own instance.

## Layer 3: reverse proxy cache (Nginx, Varnish)

A reverse proxy sits in front of the app servers and caches **whole HTTP responses**. A hit **never wakes Python or Node** at all. It is ideal for anonymous, identical-for-everyone responses: config endpoints, public lists, rendered pages.

**Nginx**: proxy cache with stale serving and stampede protection.

```nginx /etc/nginx/conf.d/cities.conf
# In the http { } block.
# keys_zone: 50 MB of keys in shared memory.
# max_size:  up to 2 GB of cached responses on disk.
proxy_cache_path /var/cache/nginx/api levels=1:2
                 keys_zone=api_cache:50m max_size=2g
                 inactive=30m use_temp_path=off;

upstream app_upstream { server 127.0.0.1:8000; }

server {
    listen 80;

    location /api/cities/ {
        proxy_pass http://app_upstream;

        proxy_cache      api_cache;
        proxy_cache_key  "$scheme$host$request_uri";

        # Used only when the app sends no Cache-Control
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;

        # On a miss, one request goes to the app; others wait
        proxy_cache_lock on;

        # Serve the old copy while refreshing or failing
        proxy_cache_use_stale error timeout updating
                              http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;

        # Never cache, or serve from cache, logged-in requests
        proxy_cache_bypass $http_authorization;
        proxy_no_cache     $http_authorization;

        # HIT, MISS, STALE, UPDATING, ...
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

Nginx respects the upstream's `Cache-Control` and `Expires` headers ahead of `proxy_cache_valid`, and by default it **does not cache responses that set a cookie**. **Microcaching**, `proxy_cache_valid 200 1s`, is a cheap trick for busy endpoints: even a one-second cache turns a thousand identical requests per second into one.

**Varnish**: a dedicated HTTP cache with its own configuration language (VCL). Its strengths are fine-grained control, grace mode, and fast purges.

```vcl default.vcl
vcl 4.1;

backend app { .host = "127.0.0.1"; .port = "8000"; }

acl purgers { "127.0.0.1"; "10.0.0.0"/8; }

sub vcl_recv {
    # The app sends PURGE /api/cities/42 after an update
    if (req.method == "PURGE") {
        if (!client.ip ~ purgers) {
            return (synth(405, "Not allowed"));
        }
        return (purge);
    }
    if (req.http.Authorization) { return (pass); }
    if (req.url ~ "^/api/cities/") {
        # Cookies would make every request a unique object
        unset req.http.Cookie;
        return (hash);
    }
}

sub vcl_backend_response {
    if (bereq.url ~ "^/api/cities/") {
        set beresp.ttl = 10m;    # fresh for 10 minutes
        set beresp.grace = 24h;  # then serve stale up to 24h
    }
}

sub vcl_deliver {
    if (obj.hits > 0) { set resp.http.X-Cache = "HIT"; }
    else              { set resp.http.X-Cache = "MISS"; }
}
```

**Grace mode** is the important line: if the backend is down, Varnish keeps serving the last good copy instead of an error page.

## Layer 4: HTTP caching and the CDN

Browsers, apps, proxies and CDNs all obey the same contract: the **`Cache-Control` header** your server sends. Get the header right and **every layer above the app works for free**.

| Directive | Meaning |
|---|---|
| `max-age=60` | Any cache may reuse this for 60 seconds |
| `s-maxage=600` | Shared caches (CDN, proxy) may keep it 600 s; overrides `max-age` for them |
| `public` / `private` | `private`: only the user's own browser may store it. **Use for anything user-specific** |
| `no-cache` | Store it, but revalidate with the server before every reuse |
| `no-store` | Never store it anywhere. Use for tokens, payments, personal data |
| `immutable` | This URL's content will never change; do not even revalidate |
| `stale-while-revalidate=86400` | After expiry, serve the old copy and refresh in the background |
| `stale-if-error=86400` | If the origin is failing, keep serving the old copy |
| `ETag` / `If-None-Match` | Revalidation: server answers `304 Not Modified` with no body if unchanged |
| `Vary: Accept-Encoding` | Keep separate copies per value of that request header |

**TypeScript (Express)**: the city endpoint with headers that let the CDN do the work.

```ts server.ts
import express from "express";
import { getCity } from "./cities";

const app = express();

const CITY_CACHE = [
  "public",
  "max-age=60",                   // browser: 1 minute
  "s-maxage=600",                 // CDN: 10 minutes
  "stale-while-revalidate=86400", // then stale up to a day
].join(", ");

app.get("/api/cities/:id", async (req, res) => {
  const city = await getCity(Number(req.params.id));
  if (!city) {
    res.set("Cache-Control", "public, max-age=60");
    res.status(404).end();
    return;
  }
  res.set("Cache-Control", CITY_CACHE);
  // Express adds a weak ETag and answers 304 when it matches
  res.json(city);
});

app.get("/api/me", async (req, res) => {
  // User-specific: never store in a shared cache
  res.set("Cache-Control", "private, no-store");
  res.json(await currentUser(req));
});
```

**Static assets and HLS video** are the easy, high-value case. Build files with a content hash in the name (`app.3f9a1c.js`) and HLS segments (`seg_00042.ts`) never change, so they get `Cache-Control: public, max-age=31536000, immutable` and stay at the edge until evicted. The HLS playlist (`.m3u8`) is the only part that changes during a live class, so it gets a few seconds of TTL. This is why video delivery goes through a CDN even though we transcode on our own machines (see [SaaS vs self-host](/post/2026-11-04-saas-vs-self-host-where-each-one-wins)).

### How a CDN is built

```flow
user | Learner in Kochi | **DNS** or **anycast** picks the nearest PoP
-> request
edge | Edge PoP | Kochi or Chennai, one of **hundreds** | 5–40 ms
-> miss
region | Regional cache | one of **tens**, in large data centers
-> miss
shield | Origin shield | the **one** tier allowed to call the origin
-> miss
origin | Origin | our S3 bucket or Nginx
```

Each tier exists to **protect the one below it**. Without the middle tiers, a new file requested once at every edge would hit the origin hundreds of times. With an origin shield, **the origin sees it once**.

- **Cloudflare** routes users with **anycast**: the same IP address is announced from every data center, so the network itself delivers the user to the nearest one. **Tiered Cache** makes a few upper-tier data centers fetch from the origin on behalf of all the others, and **Cache Reserve** keeps long-tail objects in R2 object storage so they are not evicted. In 2022 Cloudflare replaced Nginx in its proxy layer with **Pingora**, its own Rust proxy.
- **Akamai** takes the opposite approach to placement: a very large number of servers deployed deep inside ISP networks, with a **DNS-based mapping system** that picks a nearby, healthy edge server for each user, and a **tiered distribution** layer of parent caches between edges and origin.
- **AWS CloudFront** has hundreds of **edge locations**, a smaller set of **Regional Edge Caches** with larger storage behind them, and an optional **Origin Shield** in one region as the single point that talks to the origin. **CloudFront Functions** and **Lambda@Edge** can rewrite cache keys and headers at the edge.
- **Fastly** is built on a customised Varnish and exposes VCL to customers, which is why it is popular with teams that want programmable caching and near-instant purges.

### The cache key decides everything

A CDN stores one copy per **cache key**, usually host + path + query string. Three common mistakes:

- **Cookies or auth headers in the key** make every user unique, so the hit ratio collapses to zero.
- **Cookies or auth not in the key, on a personalised page,** serve one user's page to everyone. This is the worst caching bug there is (see the Steam case below).
- **Unnormalised query strings** (`?a=1&b=2` vs `?b=2&a=1`, tracking parameters like `utm_source`) split one object into many.

## Layer 5: offline cache on the device

The last layer is on the learner's phone. Its job is different from the others: not speed, but **availability**. A student on a train should still see the class schedule and the notes they opened yesterday.

| Platform | Tool | Good for |
|---|---|---|
| Web | **HTTP cache** | Assets and API responses, governed by `Cache-Control` |
| Web | **Service Worker + Cache API** | Full offline: app shell, API responses, fallbacks |
| Web | **IndexedDB** | Structured data, queued writes to sync later |
| Android / iOS | **SQLite** (Room, Core Data, Drift) | Local copy of the data the screen needs |
| Android / iOS | **File storage** | Downloaded videos and PDFs |

The common strategies:

| Strategy | How it works | Use it for |
|---|---|---|
| **Cache first** | Serve from the cache; go to the network only on a miss | App shell, fonts, versioned files |
| **Network first** | Try the network and update the cache; **fall back to the cache** when offline | Schedules, profiles, anything that must be fresh when online |
| **Stale-while-revalidate** | Serve the cached copy **now**, fetch a fresh one in the background for next time | Feeds, lists, config |

What a learner on a train sees when the app is **network first**:

```flow
phone | Learner on a train, no signal | opens the class schedule
-> fetch fails
offline | Offline cache | Service Worker on the web, SQLite in the app
-> cache hit
storage | Saved copy | the schedule from the last time they were online
-> rendered
phone | Learner | sees yesterday's schedule, marked **offline**
```

**TypeScript**: a Service Worker for the city app.

```ts sw.ts
/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE = "cities-v1";
const APP_SHELL = ["/", "/index.html", "/app.js", "/app.css"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
});

self.addEventListener("activate", (event) => {
  // Remove caches left by older versions of the app
  const removeOld = async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  };
  event.waitUntil(removeOld());
});

// Network first: fresh when online, last copy when offline
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Cache first: app shell and static files
async function cacheFirst(request: Request): Promise<Response> {
  return (await caches.match(request)) ?? fetch(request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/cities/")) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
```

**Python, on the client side**: the same network-first idea for a script or CLI that calls the API, using a local SQLite file.

```python offline_client.py
import json
import sqlite3
import time
import urllib.request

db = sqlite3.connect("city_cache.db")
db.execute(
    "CREATE TABLE IF NOT EXISTS cache"
    " (url TEXT PRIMARY KEY, body TEXT, saved_at REAL)"
)

def get_json(url: str) -> dict:
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            body = resp.read().decode()
        db.execute(
            "INSERT OR REPLACE INTO cache VALUES (?, ?, ?)",
            (url, body, time.time()),
        )
        db.commit()
        return json.loads(body)
    except OSError:  # offline, DNS failure, timeout, HTTP error
        row = db.execute(
            "SELECT body, saved_at FROM cache WHERE url = ?",
            (url,),
        ).fetchone()
        if row is None:
            raise
        body, saved_at = row
        print(f"offline: using copy from {time.ctime(saved_at)}")
        return json.loads(body)

city = get_json("https://api.example.com/api/cities/42")
```

On mobile, the hard part is not storing data but **sync**: what happens to a write made offline, and who wins when the server changed the same record. Decide that before you build the cache.

## When the cache hurts: the failure modes

| Problem | What happens | Fix |
|---|---|---|
| **Stampede** (thundering herd, dog-piling) | A hot key expires; thousands of requests miss at once and all hit the database | Lock or single-flight so one request refills; serve stale while refreshing; refresh early |
| **Avalanche** | Many keys were set at the same time with the same TTL and expire together | Add random jitter to TTLs; warm the cache gradually after a deploy |
| **Penetration** | Requests for keys that do not exist always miss | Cache "not found" briefly; reject impossible IDs early; a Bloom filter for large ID spaces |
| **Hot key** | One key gets so many reads that its one Redis shard saturates | Local in-process copy for a few seconds; replicate the key under several names |
| **Stale data** | The DB changed and the cache did not | Delete on write; short TTLs; versioned keys; invalidate from the DB change log |
| **Leaked data** | A personalised response is stored in a shared cache | `Cache-Control: private` or `no-store`; never cache responses that depend on auth unless auth is in the key |
| **Cold start** | A new cache node or a flush sends everything to the DB | Warm hot keys before switching traffic; add capacity gradually |

**Stampede protection** in one picture: a lock lets **one** request rebuild an expired key while the rest wait for it.

```flow
user | 1,000 requests | all ask for city 42 the moment its key expires
-> GET city:v1:42 misses for everyone
cache | Redis lock | `SET lock NX`: exactly **one** request wins
-> the winner reads; the rest wait 50 ms and retry
db | Postgres | **one** query instead of 1,000
-> winner sets city:v1:42
cache | Redis | the waiting requests now get a **hit**
```

**Python**: the same lock in code.

```python stampede.py
import json
import time
import uuid

# Delete the lock only if it still holds our token
RELEASE_LOCK = r.register_script("""
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
end
return 0
""")

def get_city_protected(city_id: int) -> dict | None:
    key = city_key(city_id)
    lock_key = f"lock:{key}"

    for _ in range(50):  # wait up to about 2.5 seconds
        cached = r.get(key)
        if cached == MISSING:
            return None
        if cached is not None:
            return json.loads(cached)

        token = str(uuid.uuid4())
        if r.set(lock_key, token, nx=True, ex=10):
            # We hold the lock: rebuild the key
            try:
                city = fetch_city_from_db(city_id)
                if city is None:
                    r.set(key, MISSING, ex=60)
                else:
                    r.set(key, json.dumps(city), ex=3600)
                return city
            finally:
                RELEASE_LOCK(keys=[lock_key], args=[token])

        time.sleep(0.05)  # someone else is rebuilding; wait

    # Waited too long: read the database directly
    return fetch_city_from_db(city_id)
```

The token matters: if the rebuild takes longer than the lock's 10-second expiry, another request may hold the lock by the time we finish, and a plain `DELETE` would release their lock instead of ours.

**TypeScript**: single-flight inside one process, so concurrent requests for the same key share one database call.

```ts single-flight.ts
const inflight = new Map<string, Promise<City | null>>();
// Keep hot keys in this process for 5 seconds
const local = new TTLCache<City | null>(5_000);

export async function getCityShared(
  id: number,
): Promise<City | null> {
  const key = `city:v1:${id}`;
  const hit = local.get(key);
  if (hit !== undefined) return hit;

  // Join a request already in flight for this key
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = getCity(id) // Redis first, then the database
    .then((city) => {
      local.set(key, city);
      return city;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}
```

## Where caching makes the difference, and where it does not

**Good candidates**, ordered roughly by how much they usually save:

1. **Static files and video segments** at the CDN. Immutable, huge, read millions of times.
2. **Config and version endpoints.** Same answer for every user. In the [November 3 peak comparison](/post/2026-11-04-db-cpu-per-request-fell-54-percent), `GET /api/v4/version/app` alone served 143,767 requests in two hours and `GET /api/v3/stickers/config` 45,422. Responses like these can be cached at the edge for a minute with almost no risk.
3. **Public lists and reference data**: courses, syllabus trees, chapter lists, cities. Change rarely, read constantly.
4. **Expensive aggregates**: leaderboards, counts, dashboards. A leaderboard that is 30 seconds old is fine; recomputing it per request is not.
5. **Session and rate-limit state** in Redis. Fast, shared across servers, and expires on its own.

**Poor candidates:**

- **Data that must be exactly current**: payments, wallet balances, exam submissions, stock levels at checkout. Read from the source of truth.
- **Data read once**: a cache with a 2% hit ratio costs memory, adds a network hop to every miss, and saves almost nothing.
- **Writes**: caching does not make writes cheaper. Queues and batching do.
- **Anything you have not measured.** Find the slow query or the hot endpoint first. A cache in front of a query that should have had an index hides the problem until the cache is flushed.

## How the big platforms do it

These summaries come from the companies' own papers and engineering posts.

### Facebook: memcache at a billion requests per second, then TAO

Facebook's 2013 NSDI paper *Scaling Memcache at Facebook* describes a cache-aside memcached tier in front of MySQL serving **more than a billion requests per second** and storing **trillions of items**.

```flow
app | Web server | gets go through **mcrouter**
-> get
cache | memcache | a hit returns at once
-> on a miss: read MySQL, then set the key
db | MySQL | every write lands here first
~> commit log
worker | mcsqueal | a daemon tailing the log
~> delete the changed keys
cache | memcache in every cluster | the next read loads the fresh value
caption: Dashed arrows run in the background, after the write has committed.
```

- **Leases** solve two problems at once. On a miss, memcache hands one client a lease token to refill the key; others wait briefly or get a slightly stale value. That stops stampedes and stops a slow client from writing an outdated value after a newer delete.
- **Invalidation comes from the database, not the app.** A daemon called mcsqueal tails the MySQL commit log and broadcasts deletes, so every cache in the region learns about every committed write.
- **A "gutter" pool** of spare servers takes over the keys of a failed memcache server for a short TTL, so one dead server does not send its whole share of traffic to MySQL.
- **mcrouter**, the routing proxy in front of memcache, was later open-sourced.

For the social graph itself, Facebook built **TAO** (USENIX ATC 2013): a graph-aware, read-through and write-through cache of objects and associations, with leader and follower tiers in each region. Its general-purpose caching engine, **CacheLib** (OSDI 2020), is shared across many services and is open source.

### Instagram: Django, Postgres, memcached and Redis

Instagram started on the same stack we run: Django in front of Postgres, with memcached for caching. Two of its engineering posts are directly useful to us:

- *Storing hundreds of millions of simple key-value pairs in Redis* (2011) explains how they packed a photo-ID-to-user-ID mapping into Redis hashes to cut memory use dramatically.
- *Thundering Herds & Promises* describes storing a **promise** in the cache on a miss, so concurrent requests wait for the one computation already in flight instead of all querying the database. It is the same idea as the single-flight code above, applied across servers.

### YouTube and Google: caches inside the ISP

Video is the extreme case of "read many times, never changes". Google places **Google Global Cache** servers inside ISP networks, so popular YouTube videos are served from the user's own ISP rather than across the internet. On the database side, YouTube built **Vitess** to scale MySQL; it pools connections and deduplicates identical in-flight queries, which is a cache in all but name.

### Netflix: fill the cache before anyone asks

Netflix runs its own CDN, **Open Connect**, with appliances installed inside ISPs. Because it knows what people will watch tomorrow, it **pre-positions** content during off-peak hours, so the cache is filled before demand arrives rather than on the first miss. Inside AWS, Netflix uses **EVCache**, a memcached-based distributed cache replicated across availability zones.

### Pinterest: memcached behind mcrouter

Pinterest runs a large memcached fleet on EC2, fronted by **mcrouter**, the router Facebook open-sourced, which handles sharding, replication and failover so application code just does gets and sets. Its engineering posts on caching are a good read on running memcached at scale on cloud instances.

### Cloudflare, Akamai, CloudFront

Covered in the CDN section above. The three represent three placement strategies: anycast to many large data centers (Cloudflare), DNS mapping to servers deep in ISPs (Akamai), and edge locations backed by regional caches inside a cloud provider (CloudFront).

**The common thread** across all of them: a cache in front of every expensive thing, invalidation driven by the source of truth, explicit protection against stampedes, and a tier whose only job is to shield the origin.

## Real incidents worth remembering

- **Steam, 25 December 2015.** During a traffic attack, a caching configuration change caused pages generated for logged-in users to be cached and served to other users. Valve reported that about 34,000 users had personal information exposed this way. **Lesson:** personalised responses must be `private` or `no-store`, and every cache configuration change needs a test that logged-in pages are never shared.
- **Facebook, 23 September 2010.** An invalid configuration value caused every client that saw it to query the database to fix it, at the same time, and the resulting feedback loop took the site down for about two and a half hours. **Lesson:** this is a stampede. Fallback paths need rate limits and backoff, not just retries.
- **Fastly, 8 June 2021.** A single customer's valid configuration change triggered a latent bug that made most of Fastly's network return errors for under an hour, taking many large sites with it. **Lesson:** a CDN is a dependency like any other. Know what your site does when the edge is down, and keep the origin able to take some direct traffic.

## A checklist before adding a cache

1. **What is slow, and how do we know?** Point at the query, endpoint or dashboard.
2. **Which layer?** The highest one that works: device, CDN, proxy, in-process, Redis, in that order of preference.
3. **What is the key?** Include everything the response depends on, and nothing else. Is any of it user-specific?
4. **How stale can it be?** Write the number down. That is your TTL.
5. **How is it invalidated?** TTL only, delete on write, versioned key, or purge?
6. **What happens on a miss storm?** Lock, single-flight, or stale-while-revalidate.
7. **What happens when the cache is down?** It should be slower, not broken.
8. **How will we see it working?** Hit ratio, latency and database load, before and after.

Caching is not a feature you add once. It is a contract about freshness that every layer has to keep. Write the contract down, measure the hit ratio, and the database will thank you during the next evening peak.
