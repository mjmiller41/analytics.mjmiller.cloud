# MJMiller Analytics Constitution

## Core Principles

### I. Surgical Fork Discipline (NON-NEGOTIABLE)
Every modification to upstream code must be surgical, minimal, and merge-friendly.
- The project is a personal operational fork of upstream `umami-software/umami` (v3.2.0+), maintained by Michael J. Miller to track personal domains.
- Developers and agents MUST prioritize configuration (environment variables) and additive files over modifying upstream files.
- Upstream source files MUST NOT be touched unless no configuration or additive extension path exists.
- Global search-and-replace on upstream identifiers (`Umami`, `UmamiClient`, `@umami/*`, database table/column names) is strictly PROHIBITED; doing so breaks package boundaries, causes TypeScript compiler errors, and produces merge conflicts.
- Every commit touching an upstream file MUST document the precise rationale in the commit message body to facilitate future upstream rebases/merges.

### II. Upstream Sync & Deployable Main
The repository operates under a dual-remote topology with an always-deployable `main` branch.
- Remotes MUST maintain `origin` as the personal fork (`git@github.com:mjmiller41/analytics.mjmiller.cloud.git`) and `upstream` as the canonical source (`https://github.com/umami-software/umami.git`).
- Syncs MUST be conducted periodically via `git fetch upstream && git merge upstream/master` (or rebasing topic branches) to prevent fork drift.
- The `main` branch MUST remain continuously deployable to production.
- Non-trivial development work MUST occur on isolated task branches (`feature/*`, `fix/*`).

### III. Dual-Store Analytics Parity
Analytical query layers must preserve parity between relational and columnar storage engines.
- The database routing spine in `src/lib/db.ts` (`runQuery({ prisma, clickhouse, kafka })`) MUST be respected as the single entry point for data queries.
- Analytics aggregations are maintained across two backends and MUST remain synchronized:
  1. `src/queries/prisma/*` (PostgreSQL via Prisma)
  2. `src/queries/sql/*` (hand-written SQL running on both PostgreSQL and ClickHouse)
- Any modification or addition to analytics metrics, event aggregations, or filters in PostgreSQL MUST be mirrored and tested for ClickHouse compatibility.

### IV. Architectural Layer & Access Control Discipline
System boundaries, request validation, and permission checks must be rigorously enforced across all data paths.
- Execution MUST follow strict unidirectional layer ordering: `app` (routes/pages) → `lib` (core utilities) and `components` (UI) → `queries` (data access).
- In authenticated API routes, input MUST be parsed using Zod schemas (`src/lib/request.ts`), followed immediately by capability checks (`src/permissions/*`) before executing queries.
- Authentication relies on signed JWT tokens via `APP_SECRET`; secret material MUST NOT be hardcoded or logged.
- The public collection pipeline (`src/tracker/index.js` → `/script.js`, `/api/send`, `/p/[slug]`, `/q/[slug]`) must remain unauthenticated, lightweight, and resilient against ad-blockers and high traffic.
- User-facing strings MUST use `next-intl` (`useMessages`); hardcoded UI strings are forbidden to preserve internationalization integrity.

### V. Automated Verification & Toolchain Consistency
Work is not complete until verified by automated tools adhering to pinned engine and environment constraints.
- Toolchain engine pinning MUST be respected: `pnpm 12.3.4` (invoked directly or via `npx --yes pnpm@12.3.4`).
- All code changes MUST pass automated quality gates:
  - Linting & formatting: `pnpm check` (Biome).
  - Test suites: `pnpm test` (Vitest unit tests; supply `DATABASE_URL="postgresql://user:pass@localhost:5432/dummy"` when running offline without an active database).
  - Build pipeline: `pnpm build` (ensuring Turbopack compilation, Prisma client generation, and tracker bundles succeed).
- Regressions in build or test commands MUST be addressed autonomously before completing tasks.

## Technology Stack & Infrastructure Constraints

The application architecture is constrained by specific self-hosted infrastructure requirements:
- **Runtime & Bundler**: Next.js 16 (App Router) with React 19, TypeScript, and Turbopack on Node.js 18.18+.
- **Database Architecture**: Managed PostgreSQL (hosted on Neon, dedicated `umami` database, direct non-pooler connection) accessed via Prisma 7 and `@prisma/adapter-pg`. MySQL is unsupported in this version.
- **Optional Auxiliary Services**: ClickHouse, Redis, and Kafka remain entirely optional and inactive unless their corresponding connection URLs (`CLICKHOUSE_URL`, `REDIS_URL`, Kafka env vars) are explicitly provided.
- **Production Host**: Hosted as a long-running Node.js process on Hostinger behind a reverse proxy, connected to Neon PostgreSQL.

## Development & Spec Kit Workflow

Custom development and maintenance follow structured quality gates:
- **Spec Kit Lifecycle**: New features or major modifications MUST proceed through the standard Spec Kit phases: `speckit.specify` → `speckit.clarify` → `speckit.plan` → `speckit.checklist` → `speckit.tasks` → `speckit.implement`.
- **Merge Impact Evaluation**: Before implementing customizations, agents and developers must assess whether changes can be implemented via environment variables (`TRACKER_SCRIPT_NAME`, `COLLECT_API_ENDPOINT`, `BASE_PATH`, etc.) or additive components to minimize upstream drift.
- **Documentation Maintenance**: Project-specific rules in `GEMINI.md`, `AGENTS.md`, and this constitution must be kept up-to-date with any structural or workflow evolutions.

## Governance

This constitution defines the non-negotiable engineering standards for the `analytics.mjmiller.cloud` repository.
- **Precedence**: This document supersedes ad-hoc coding patterns or conflicting upstream conventions that jeopardize fork maintainability or personal hosting constraints.
- **Amendments**: Proposed changes to principles or architectural constraints require updating this document, recording an amendment date, and incrementing the version number according to semantic versioning.
- **Versioning Policy**:
  - **MAJOR**: Changes that break governance continuity, drop fork discipline (e.g. moving to a hard-fork detached from upstream), or rearchitect core layers.
  - **MINOR**: Addition of new principles, structural constraints, or major workflow adaptations.
  - **PATCH**: Wording improvements, typos, and clarifying adjustments.
- **Compliance & Review**: All commits, pull requests, and automated agent activities must be validated against these principles. Use `GEMINI.md` and this constitution as persistent runtime references.

**Version**: 1.0.0 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-08
