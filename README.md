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

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/); a Git hook checks them, and formats and lints staged files before each commit.

## License

The source code is released under the [MIT License](LICENSE). Articles, images and other site content are not part of this repository and are not covered by this license.
