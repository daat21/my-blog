---
title: A tiny CSS reset
description: The handful of rules I start every stylesheet with.
date: 2026-10-30
tags: [CSS]
---

Modern browsers agree on most things now, so my reset has shrunk to a few lines:

```css title="reset.css"
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  line-height: 1.5;
}

img,
video {
  display: block;
  max-width: 100%;
  height: auto;
}
```

Everything else belongs in the design tokens.
