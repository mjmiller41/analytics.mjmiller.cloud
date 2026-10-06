# Refactor and Improvement Plan: MJMiller Analytics (Umami Fork)

**Date:** 2026-10-06  
**Target:** `/run/media/michael/storage/Code/analytics.mjmiller.cloud`

---

## Executive Summary

This codebase is a specialized fork of upstream **[Umami](https://github.com/umami-software/umami)** (tracking v3.4.0), customized for deployment to a Hostinger server backed by a managed PostgreSQL instance (Neon). A comprehensive audit was conducted across root configuration, package manifests, build scripts, core libraries (`src/lib/`), UI components and hooks (`src/components/`), API routing layers, test fixtures (`tests/`), and documentation.

The audit identified six critical findings:
1. **Critical Working Tree Syntax Corruption:** An aggressive global search-and-replace of `"Umami"` with `"MJMiller Analytics"` was previously executed across 113 files, inserting spaces into TypeScript identifiers (e.g., `class MJMiller AnalyticsRedisClient`, `export class MJMiller AnalyticsClient`), generating 175 parse errors in Biome, corrupting 40+ localization JSON files, and severely violating fork discipline.
2. **Dead & Abandoned Files:** A 0-byte empty file (`src/lib/sql.ts`), an orphaned root config (`package.components.json`), an ad-hoc dependency audit log (`dependabot-review.md`), and redundant duplicate test suites (`tests/e2e/api-*.spec.ts`).
3. **Dead UI Components & Hooks:** Four completely unreferenced components (`SettingsButton`, `ProfileButton`, `RefreshButton`, `SegmentSaveButton`, `BounceFilter`) and three unused custom hooks (`useDocumentClick`, `usePageParameters`, `useSticky`).
4. **Logic Duplication & Redundant Abstractions:** Duplicate localization download scripts (`download-country-names.js` and `download-language-names.js`), an unnecessary array transformation function (`objectToArray`), and an N+1 multi-table query anti-pattern in permission checks (`getEntity` called in `canViewWebsite`).
5. **Runtime Defects & Edge Cases:** Unhandled Redis disabled paths in `src/lib/load.ts` (`fetchAccount`/`fetchTeam` call Redis without checking `redis.enabled`), a color hex padding bug in `src/lib/colors.ts`, silent build failure swallowing in `scripts/build-prisma-client.js`, and misplaced dependencies (`@playwright/test` and `@svgr/cli` in runtime `dependencies`).
6. **Documentation & Script Drift:** Discrepancies between `CLAUDE.md` and `package.json` (`update-db` vs `db:migrate`, `seed-data` vs `db:seed`, missing `change-password`), plus a strict engine requirement (`pnpm 12.3.4`) that blocks standard pnpm invocations in environments running pnpm 11.x.

---

## Phase 0: Emergency Fix & Fork Alignment (Working Tree Restoration)
> **Goal:** Restore TypeScript syntactic validity and align with the repository's documented fork discipline before undertaking code refactoring.

- [x] **Revert Corrupting Identifier Substitutions Across 113 Files**
  - Target files: `packages/api-client/**/*`, `packages/mcp/**/*`, `src/lib/redis.ts`, `src/lib/mcp/*`, `src/tracker/index.ts`, `src/openapi/document.ts`, `public/intl/messages/*.json`
  - Action: Discard or cleanly revert invalid identifier modifications (such as `class MJMiller AnalyticsRedisClient` -> `class UmamiRedisClient`, `GeneratedMJMiller AnalyticsClient` -> `GeneratedUmamiClient`, `MJMiller AnalyticsClient` -> `UmamiClient`, `MJMiller AnalyticsTracker` -> `UmamiTracker`, `isMJMiller AnalyticsApiError` -> `isUmamiApiError`). Preserve branding changes only in top-level page metadata (`src/app/layout.tsx`) and application branding constants where appropriate.
  - Verification: `npx --yes @biomejs/biome@2.5.13 lint .` runs with 0 parse errors.

---

## Phase 1: Dead Code Removal
> **Goal:** Eliminate unused files, abandoned test fixtures, dead hooks, and obsolete components to reduce cognitive load and maintenance overhead.

- [ ] **Remove 0-Byte Abandoned File `src/lib/sql.ts`**
  - Target files: `src/lib/sql.ts`
  - Action: Delete the empty 0-byte file left over since August 2023.
  - Verification: `git status` shows file deleted; no import references exist.

- [ ] **Remove Root Artifacts `dependabot-review.md` and `package.components.json`**
  - Target files: `dependabot-review.md`, `package.components.json`
  - Action: Delete `dependabot-review.md` (historical one-off audit log from 2026-09-11) and `package.components.json` (orphaned package manifest superseded by `scripts/bump-components.js` writing to `dist/package.json`).
  - Verification: Confirm `pnpm build:components` continues to work cleanly without `package.components.json`.

- [ ] **Remove Dead Custom Hooks**
  - Target files:
    - `src/components/hooks/useDocumentClick.ts`
    - `src/components/hooks/usePageParameters.ts`
    - `src/components/hooks/useSticky.ts`
    - `src/components/hooks/index.ts`
  - Action: Remove the 3 unused hook files and remove their re-exports from `src/components/hooks/index.ts`.
  - Verification: `npx --yes @biomejs/biome@2.5.13 check` passes; no broken imports across the repository.

- [ ] **Remove Dead & Superseded UI Components**
  - Target files:
    - `src/components/input/BounceFilter.tsx` (superseded by inline Checkbox in `WebsiteFilterButton.tsx`)
    - `src/components/input/RefreshButton.tsx` (unreferenced in application)
    - `src/components/input/SegmentSaveButton.tsx` (unreferenced in application)
    - `src/components/input/SettingsButton.tsx` (superseded by `UserButton.tsx`)
    - `src/components/input/ProfileButton.tsx` (superseded by `UserButton.tsx`)
    - `src/index.ts` (remove dead export `export * from '@/components/input/ProfileButton'`)
  - Action: Delete the 5 unused components and remove their references from component index manifests.
  - Verification: `pnpm build` and `npx @biomejs/biome check` verify clean bundle compilation.

- [ ] **Remove Redundant E2E API Tests Duplicating Dedicated API Suite**
  - Target files:
    - `tests/e2e/api-board.spec.ts`
    - `tests/e2e/api-team.spec.ts`
    - `tests/e2e/api-user.spec.ts`
    - `tests/e2e/api-website.spec.ts`
  - Action: Remove these 4 legacy files from `tests/e2e/`. These tests are fully covered with higher fidelity in `tests/api/*.spec.ts` under the dedicated `playwright.api.config.ts` test configuration.
  - Verification: `npx playwright test -c playwright.config.ts --list` shows only UI-centric tests.

- [ ] **Purge Stale ESLint Disable Directives**
  - Target files: 17 files containing `/* eslint-disable no-console */` and `// eslint-disable-next-line` (e.g. `scripts/check-db.js`, `scripts/check-env.js`, `src/app/api/send/route.ts`, etc.)
  - Action: Remove obsolete ESLint comments across scripts and source files since the project now uses Biome.
  - Verification: `git grep "eslint-disable"` returns 0 results.

---

## Phase 2: File Consolidation
> **Goal:** Merge fragmented single-purpose modules and scripts into cohesive units to eliminate duplicated logic.

- [ ] **Consolidate Localization Download Scripts**
  - Source files: `scripts/download-country-names.js`, `scripts/download-language-names.js`
  - Destination: `scripts/download-intl-data.js`
  - Action: Merge the two 60-line files into a single parameterized script supporting `--type=countries|languages|all`. Update `package.json` scripts:
    ```json
    "download:countries": "node scripts/download-intl-data.js --type=countries",
    "download:languages": "node scripts/download-intl-data.js --type=languages",
    "build:languages": "node scripts/download-intl-data.js --type=all"
    ```
  - Verification: Run `node scripts/download-intl-data.js --type=all` and verify `public/intl/country/` and `public/intl/language/` files are correctly populated.

- [ ] **Consolidate URL Utility Modules**
  - Source files: `src/lib/url.ts`, `src/lib/api-url.ts`, `src/lib/get-base-url.ts`, `src/lib/return-url.ts`
  - Destination: Cohesive URL module under `src/lib/url.ts` (or barrel export)
  - Action: Group URL parsing, base URL inference, safe return URL validation, and query string builders into a unified module while preserving backward-compatible named exports.
  - Verification: Run unit tests `src/lib/url.test.ts`, `src/lib/api-url.test.ts`, `src/lib/get-base-url.test.ts`.

---

## Phase 3: Code Simplification & Defect Resolution
> **Goal:** Remove redundant abstractions, fix latent runtime bugs, and streamline database queries.

- [ ] **Eliminate Redundant `objectToArray` Helper**
  - Target files: `src/lib/data.ts`, `src/app/(main)/websites/[websiteId]/(reports)/journeys/Journey.tsx`
  - Action: Replace `objectToArray(nodes)` in `Journey.tsx` with native `Object.values(nodes)` and remove `objectToArray` from `src/lib/data.ts`.
  - Verification: `Journey.tsx` renders and types check cleanly with `Object.values`.

- [ ] **Optimize `canViewWebsite` to Eliminate 4-Table N+1 Query**
  - Target files: `src/permissions/website.ts`
  - Action: Replace `const entity = await getEntity(websiteId)` with `const website = await getWebsite(websiteId)` in `canViewWebsite`. `getEntity` indiscriminately queries `website`, `link`, `pixel`, and `board` in parallel via `Promise.all` on every website authorization check.
  - Verification: Run `vitest run src/permissions/website.test.ts`.

- [ ] **Guard Redis Calls in `fetchAccount` and `fetchTeam`**
  - Target files: `src/lib/load.ts`
  - Action: Add `if (!redis.enabled) return null;` to `fetchAccount` and `fetchTeam` before calling `redis.client.get(...)`. Prevents unexpected connection errors when Redis is disabled (`REDIS_URL` not set).
  - Verification: Run unit tests `src/lib/request.test.ts` and verify no unhandled Redis errors when `REDIS_URL` is omitted.

- [ ] **Fix Hex Color Truncation Bug in `rgb2Hex`**
  - Target files: `src/lib/colors.ts`
  - Action: Update `rgb2Hex` so each component is padded to 2 digits:
    ```ts
    export function rgb2Hex(r: number, g: number, b: number, prefix = '') {
      return `${prefix}${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    ```
  - Verification: Run `vitest run src/lib/colors.test.ts` and add test cases verifying values `< 16` output 6-character hex strings.

- [ ] **Expose Error Details in `scripts/build-prisma-client.js`**
  - Target files: `scripts/build-prisma-client.js`
  - Action: Replace `.catch(() => process.exit(1));` with `.catch(err => { console.error('Prisma client build error:', err); process.exit(1); });`.
  - Verification: Trigger a build failure to confirm readable diagnostic output is preserved.

- [ ] **Correct Package Dependency Groupings in `package.json`**
  - Target files: `package.json`
  - Action: Move `@playwright/test` and `@svgr/cli` from `dependencies` to `devDependencies`. They are only needed during testing and icon generation.
  - Verification: Check that production bundle and container builds don't depend on them at runtime.

---

## Phase 4: Documentation Alignment
> **Goal:** Bring `CLAUDE.md`, `README.md`, and `package.json` into strict synchronization with actual project commands and requirements.

- [ ] **Align `CLAUDE.md` Scripts with `package.json`**
  - Target files: `CLAUDE.md`
  - Changes:
    - Replace `pnpm update-db` with `pnpm db:migrate` (runs `prisma migrate deploy`).
    - Replace `pnpm seed-data` with `pnpm db:seed` (runs `tsx scripts/seed-data.ts`).
    - Note that user password changes can be performed via the Admin UI or by documenting the proper Prisma command.
  - Verification: Review `CLAUDE.md` against `package.json#scripts`.

- [ ] **Document Toolchain Engine Requirements & Workarounds**
  - Target files: `README.md`, `CLAUDE.md`
  - Changes: Document that upstream pins `"engines": { "pnpm": "12.3.4" }`. For environments running pnpm 11.x without upgrading globally, document running `npx --yes pnpm@12.3.4 <command>` or updating pnpm via `pnpm i -g pnpm@12.3.4`.
  - Verification: Verify instructions produce reproducible development setup on standard Node 22/24 environments.

- [ ] **Reinforce Fork Discipline Guidance in Documentation**
  - Target files: `CLAUDE.md`, `GEMINI.md`
  - Changes: Explicitly caution against automated find-and-replace scripts that rename core upstream identifiers (like `UmamiClient` or `@umami/*`), which cause syntax breakage and severe upstream merge conflicts.

---

## Phase 5: Verification & Regression Gate
> **Goal:** Validate that all changes compile, lint cleanly, pass all unit/integration tests, and build successfully.

- [ ] **Code Formatting & Linting**
  - Command: `npx --yes @biomejs/biome@2.5.13 check .`
  - Expected: Zero syntax errors, formatting errors, or lint warnings.

- [ ] **Type Checking**
  - Command: `npx --yes pnpm@12.3.4 check:tracker && npx --yes pnpm@12.3.4 check:api:client`
  - Expected: Clean TypeScript compilation across client, tracker, and server.

- [ ] **Unit Test Suite**
  - Command: `npx --yes pnpm@12.3.4 test` (runs Vitest across all unit tests)
  - Expected: All test suites pass cleanly.

- [ ] **Workspace Packages Build & Test**
  - Command: `npx --yes pnpm@12.3.4 build:packages && npx --yes pnpm@12.3.4 test:packages`
  - Expected: `@umami/api-client` and `@umami/mcp` build and test with 100% success.

- [ ] **Production Next.js Build**
  - Command: `npx --yes pnpm@12.3.4 build:app`
  - Expected: Clean Next.js Turbopack build without errors.
