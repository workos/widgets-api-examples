# WorkOS Widgets API Examples

A SaaS-style dashboard that exercises queries and mutations in the WorkOS **Widgets API**

## Modes

| Mode               | When                                                  | Behavior                                                             |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------------------- |
| **Demo** (default) | `WIDGETS_DEMO_MODE=1`, or missing WorkOS env vars     | In-memory GraphQL server at `/api/demo/graphql` with fixture data    |
| **Live**           | All WorkOS env vars set and `WIDGETS_DEMO_MODE` unset | AuthKit sign-in + real `POST /client/token` + `POST /client/graphql` |

Demo mode is the default so you can explore the UI before the Widgets API closed beta is enabled on your account.

## Quick start (demo)

```bash
# from repo root
pnpm install
cd examples/nextjs
cp .env.example .env.local   # already includes WIDGETS_DEMO_MODE=1
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). No WorkOS account required.

Sensitive flows that normally email a code (MFA, email change, create password) accept the demo code **`424242`**. The demo password is `correct-horse-battery-staple`.

## Live mode

1. Enable the Widgets API closed beta with WorkOS.
2. Create an AuthKit app and set redirect URI to `http://localhost:3000/authkit/callback` (and Sign-in URL to `http://localhost:3000/sign-in`).
3. Put credentials in `.env.local` and **remove or set `WIDGETS_DEMO_MODE=0`**.
4. Add yourself to an organization (tokens are org-scoped).
5. `pnpm dev` and sign in.
