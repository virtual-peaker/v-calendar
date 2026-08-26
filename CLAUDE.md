# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Two live lineages — check your branch before trusting any command

This is a fork of the upstream `v-calendar`, published privately as `@virtual-peaker/v-calendar`.
**Two majors are maintained simultaneously, on different branches, and they are entirely
different codebases.**

| | Vue 2 lineage | Vue 3 lineage |
|---|---|---|
| Branch | `master` | `vp/v3-fixes` (and `v3`) |
| Source | JavaScript + Vue SFCs | TypeScript + Vue SFCs |
| Build | `vue-cli-service build --target lib`, once per component | `tsx build/build.ts` |
| Tests | `vue-cli-service test:unit` (Jest) | **vitest** |
| Dev server | `serve` / `dev` scripts exist | **neither script exists** |

Both are published and both are consumed **at the same time** by
`vue-component-library`, which installs them side by side under the npm aliases
`@virtual-peaker/v-calendar-v2` and `@virtual-peaker/v-calendar-v3` and picks one at runtime.
Neither lineage is deprecated. A fix often needs porting to the other branch by hand — the
histories have diverged too far to cherry-pick.

**Everything below describes the Vue 3 lineage**, which is what this submodule is checked out to.
If `git rev-parse --abbrev-ref HEAD` says `master`, none of it applies.

This is not hypothetical: the monorepo's root `CLAUDE.md` documented the `master` commands
(`yarn build` for four library targets, `npm run serve`, `npm run dev`, Jest) against the v3
checkout for a long time. Every one of those commands fails here.

## Commands

```bash
npm run build      # tsx build/build.ts — types + all four bundle formats
npm run build:docs # VitePress docs in docs/
npm run build:all  # library + docs
npm test           # vitest (watch mode)
npm run lint       # ESLint
npm run format     # Prettier write over src/
```

Run a single test file: `npx vitest run tests/unit/specs/<file>`

**`prepare` runs `npm run build`**, so a plain `npm install` triggers a full `vue-tsc` type
emit plus four Vite builds. Installs are slow here, and a type error anywhere in `src/` fails
the install rather than a later build step.

There is **no dev server**. Use the docs (`docs/`, VitePress) for interactive work.

## The Build

`build/build.ts` runs, in order:

1. `vue-tsc --declaration --emitDeclarationOnly` → `dist/types`
2. `vite build` once per format — `es`, `mjs`, `cjs`, `iife` — each with its own config under
   `build/configs/`
3. Copies `dist/es/style.css` up to `dist/style.css`
4. **Writes `dist/cjs/package.json` containing `{"type": "commonjs"}`**

Step 4 is not incidental and must not be removed. The package root declares `"type": "module"`,
which makes every plain `.js` file beneath it resolve as an ES module — including `dist/cjs`,
which is genuinely CommonJS. Without the nested `package.json`, bundlers and Node throw
`ReferenceError: exports is not defined` on the CJS build. A nested `package.json` overriding
`type` for its own subtree is Node's supported fix.

This matters downstream: **VCL deliberately imports `dist/cjs/index.js`** rather than the default
ESM entry, because the ESM bundle re-exports Vue 3-only bindings that webpack treats as hard build
errors inside a Vue 2 app. If you change the `exports` map or the CJS output, expect to break VCL's
Vue 2 consumers — and note that their failure appears at *build* time in a completely different
repository.

## Linting Misses TypeScript

`npm run lint` runs ESLint with `--ext .js,.vue`. The Vue 3 source tree is roughly half `.ts`
files, and **none of them are linted.** Lint passing is not evidence the TypeScript is clean;
`npm run build` is, since `vue-tsc` type-checks as it emits.

## Tests

Vitest, configured inline in `vite.config.ts` under the `test` key — there is no separate
`vitest.config.ts`. Specs live in `tests/unit/specs/`, with shared setup in `tests/unit/setup.ts`,
helpers in `tests/unit/util/`, and fixed timezone data in `tests/timezones.ts` (date libraries
behave differently per zone; use it rather than relying on the machine's).

## Pull Requests

Follow the `## Problem` / `## Solution` / `## Test plan` format defined in the `CLAUDE.md` at the
monorepo root. State which lineage the change targets, and whether the other branch needs the
same fix.
