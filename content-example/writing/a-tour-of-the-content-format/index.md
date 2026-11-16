---
title: A tour of the content format
description: Every Markdown feature this site supports, in one place, so the styles always have something to show.
date: 2026-11-10
updated: 2026-11-12
tags: [Markdown, Writing, Design]
---

This post exists to exercise every part of the content format. If something looks off here, it looks off everywhere, so it doubles as a test page for the article styles.

## Text and links

Paragraphs are plain [CommonMark](https://commonmark.org) with [GitHub Flavored Markdown](https://github.github.com/gfm/) on top. Inline code such as `pnpm dev` sits inside a sentence, and _emphasis_, **strong text** and ~~struck-through text~~ work as expected. Bare links like https://example.com turn into links too.

> Good defaults are a kindness to your future self.
>
> A quote can run over more than one paragraph.

### Lists

An unordered list:

- Write in plain Markdown.
- Reference media by a logical path.
- Let the build catch mistakes.

An ordered list:

1. Draft the post.
2. Preview it locally.
3. Publish by pushing to the content repository.

A task list:

- [x] Add alt text to every image
- [ ] Record a shorter video

### Tables

| Extension | Syntax                               | Renders as              |
| --------- | ------------------------------------ | ----------------------- |
| Image     | `![alt](media:path "caption")`       | A figure with a caption |
| Video     | `::video[caption]{src="media:path"}` | A looping, muted video  |
| Callout   | `:::note` or `:::warning`            | An aside                |

## Media

Images live in the media folder and are referenced by path. The title becomes the caption:

![A wireframe of a page with a sidebar on the left and a content column with a heading, text lines and an image placeholder](media:2026/a-tour-of-the-content-format/layout-sketch.png 'The layout sketch, before any styles.')

Videos replace animated GIFs. They play muted, inline and on a loop:

::video[The sidebar collapsing and reopening.]{src="media:2026/a-tour-of-the-content-format/sidebar-demo.mp4"}

## Callouts

:::note
Notes hold helpful asides. They can contain **formatting**, `code` and [links](https://example.com).
:::

:::warning
A colon directly before a word starts a directive, and an unknown directive fails the build. Write `\:` to keep the colon.
:::

## Code

A block with a title shows the file it comes from:

```css title="styles/prose.css"
.prose {
  max-width: 65ch;
  line-height: 1.7;
}
```

Without a title, it is just the code:

```ts
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 200))
}
```

### Shell commands

```sh
pnpm install
pnpm dev
```
