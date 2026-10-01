# Jev SDK Monorepo

This repository uses pnpm workspaces and Turborepo. The SDK package lives in `packages/jev-sdk`.

## Commands

- `pnpm install` installs workspace dependencies.
- `pnpm build` builds workspace packages.
- `pnpm typecheck` type-checks workspace packages.

The SDK package is configured for ESM and CommonJS output with TypeScript declarations. Its source entry point is `packages/jev-sdk/src/index.ts`.