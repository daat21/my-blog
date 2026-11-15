---
title: Designing for slow networks
description: A few habits that keep pages usable on a train, in a lift or at the far end of a long cable.
date: 2026-09-22
tags: [Performance, Design]
---

Most of the time I build on a fast laptop with a fast connection. Most of the people reading what I build are not so lucky, so I try to keep a few habits.

## Send less

The fastest request is the one you never make. Before adding a dependency, I check what it costs and whether the platform already does the job.

- Prefer HTML and CSS for anything that does not need to react to input.
- Load fonts with `font-display: swap` so text shows up straight away.
- Give every image a width and a height, so the layout does not jump.

## Show something early

A page that streams its shell first feels faster than one that waits for everything. Server rendering gets the words on screen while the rest arrives.

```ts
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)
const response = await fetch('/api/forecast', { signal: controller.signal })
```

## Test on a slow profile

Browser developer tools can throttle the network. I keep a slow profile switched on for a day every few weeks, and I always find something to fix.
