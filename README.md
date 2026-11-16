# my-blog

Source code for [damingchen.com](https://damingchen.com), a personal site and blog.

Built with Next.js, React, TypeScript and Tailwind CSS. Version 3 is under active development on the `v3` branch; version 2 is archived on the `legacy-v2` branch.

## Development

Requirements: Node.js 26 and pnpm (enabled through Corepack).

```bash
corepack enable
pnpm install
pnpm dev
```

| Command          | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Start the development server                        |
| `pnpm build`     | Create a production build                           |
| `pnpm start`     | Serve the production build                          |
| `pnpm typecheck` | Type-check the project                              |
| `pnpm lint`      | Lint, including architecture and design-token rules |
| `pnpm format`    | Format all files with Prettier                      |
| `pnpm check`     | Format check, lint and type-check together          |

Tests:

| Command         | Purpose                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`     | Unit tests (Vitest)                                                                                                  |
| `pnpm test:e2e` | End-to-end smoke tests (Playwright) at phone, tablet and desktop sizes in both colour schemes; builds the site first |

Run `pnpm exec playwright install chromium firefox` once before the first end-to-end run. Every page is tested in Chromium at four sizes and both colour schemes, with Firefox spot checks on a phone and a desktop.

Content and media:

| Command                       | Purpose                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm media:build`            | Pre-optimise images (AVIF and WebP at several widths) and copy videos into `public/_media`; runs before `dev` and `build` |
| `pnpm media:gif2mp4 <in.gif>` | Convert an animated GIF into a web-friendly MP4 (needs `ffmpeg`)                                                          |
| `pnpm content:sync`           | Fetch the private content repository; runs before `build` and does nothing without credentials                            |

Locally and in CI, content is read from `CONTENT_DIR`, defaulting to `content-example/`.
On Vercel Production/Preview, `CONTENT_SOURCE` defaults to `github`: text is fetched from
`CONTENT_REPO` at `CONTENT_REPO_REF` (default `main`) using the server-only, read-only
`CONTENT_REPO_TOKEN`. Set `CONTENT_SOURCE=filesystem` to opt out. See `.env.example`.

Builds still sync content and process media. They capture a server-only text baseline
with the deployed media tree. Runtime text is admitted only after full validation and
only against that media tree. Unsafe/unavailable content falls back to this process's
last validated snapshot, then the build baseline; cold instances may serve older text.
New media always requires a build. The generated baseline must not be published as a
static asset or committed to the repository.

`POST /api/revalidate` accepts a strict JSON body with `version: 1`, a signed Unix-seconds
`timestamp`, `repository`, `ref`, `before`, `after`, and repository-relative changed
`paths` (include deleted paths and both rename sides). Sign the exact raw bytes with
HMAC-SHA256 using `CONTENT_REVALIDATE_SECRET` and send `X-Content-Signature: sha256=<hex>`.
The secret must contain at least 64 random hexadecimal characters. Requests expire
after five minutes; size limits are 64 KiB and 1,000 paths. Only fully validated current
HEAD content can expire the mapped tags. HTTP 409 means a media/unknown path requires
a deployment, 422 means invalid content, and 503 means unavailable configuration or
upstream. A successful response expires tags; pages regenerate on their next visit.
Existing browser navigation caches may need a refresh. All secrets stay server-side.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). Git hooks format and lint staged files before each commit, check the commit message, and run the checks and unit tests before each push. CI runs everything, including the end-to-end tests, on every push.

## License

The source code is released under the [MIT License](LICENSE). Articles, images and other site content are not part of this repository and are not covered by this license.
