# WorkOS Widgets API examples

Example apps that demonstrate the WorkOS **Widgets API** (Client API GraphQL).

## Examples

| Directory                              | Stack                                 |
| -------------------------------------- | ------------------------------------- |
| [`examples/nextjs`](./examples/nextjs) | Next.js 16 + AuthKit + TanStack Query |

See that package’s README for setup. Until the Widgets API closed beta is enabled
on your WorkOS account, run with `WIDGETS_DEMO_MODE=1` (the default in `.env.example`)
to use the in-memory GraphQL mock.

```bash
pnpm install
cd examples/nextjs
cp .env.example .env.local
pnpm dev
```
