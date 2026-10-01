# Jev SDK Monorepo

This repository uses pnpm workspaces and Turborepo. The SDK package lives in `packages/jev-sdk`, and its demo app lives in `apps/demo`.

## Commands

- `pnpm install` installs workspace dependencies.
- `pnpm build` builds workspace packages.
- `pnpm typecheck` type-checks workspace packages.
- `pnpm dev` runs the demo app (set `TYPESAFE_API_KEY` in the environment first).

The SDK package is configured for ESM and CommonJS output with TypeScript declarations. Its public API is exported from `packages/jev-sdk/src/index.ts`.