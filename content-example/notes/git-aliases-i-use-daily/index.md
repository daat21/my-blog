---
title: Git aliases I use daily
description: Four shortcuts that save me a surprising amount of typing.
date: 2026-08-12
tags: [Git, Tools]
---

These live in my global Git config:

```ini title="~/.gitconfig"
[alias]
  st = status --short --branch
  last = log -1 --stat
  undo = reset --soft HEAD~1
  graph = log --oneline --graph --decorate
```

The one I use most is `git st`. The one that saves me most is `git undo`.
