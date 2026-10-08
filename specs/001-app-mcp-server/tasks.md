# Tasks: Agent MCP Server for Deployed Application

**Input**: Design documents from `specs/001-app-mcp-server/`
- Spec: `specs/001-app-mcp-server/spec.md`
- Plan: `specs/001-app-mcp-server/plan.md`
- Research: `specs/001-app-mcp-server/research.md`
- Data Model: `specs/001-app-mcp-server/data-model.md`
- Contracts: `specs/001-app-mcp-server/contracts/`
- Quickstart: `specs/001-app-mcp-server/quickstart.md`

**Local Verification Command**:
```bash
npx --yes pnpm@12.3.4 --filter @umami/mcp test && npx --yes pnpm@12.3.4 vitest run src/app/mcp/route.test.ts
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify dependencies and environment configurations for the MCP server.

- [x] T001 Verify pinned toolchain and workspace package dependencies for `@umami/mcp` in `packages/mcp/package.json`
- [x] T002 [P] Verify environment configuration schema and defaults for `MCP_ENABLED` in `src/app/mcp/route.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core helpers and shared utilities that block user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Implement tracking snippet generator helper in `packages/mcp/src/lib/snippet.ts`
- [x] T004 [P] Add unit test suite for tracking snippet generation in `packages/mcp/src/lib/snippet.test.ts`
- [x] T005 Update tool export index to prepare for website management tools in `packages/mcp/src/tools/index.ts`
- [x] T006 Run foundational verification check (`npx --yes pnpm@12.3.4 --filter @umami/mcp test`) to confirm shared helpers pass cleanly

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Analytics Inspection & Querying (Priority: P1) 🎯 MVP

**Goal**: Enable AI agents to query summary stats, ranked breakdowns, and realtime activity for any website over customizable dates.

**Independent Test**: An agent invokes `get_website_stats`, `get_website_metrics`, and `get_realtime` with valid parameters and receives structured metrics matching the contract.

### Tests & Verification for User Story 1

- [x] T007 [P] [US1] Add test cases for `get_website_stats`, `get_website_metrics`, and `get_realtime` in `packages/mcp/src/server.test.ts`
- [x] T008 [US1] Verify schema validations and date range formatting across analytics tools in `packages/mcp/src/tools/stats.ts`, `packages/mcp/src/tools/metrics.ts`, and `packages/mcp/src/tools/realtime.ts`
- [x] T009 [US1] Run local verification command (`npx --yes pnpm@12.3.4 --filter @umami/mcp test`) to confirm User Story 1 passes cleanly

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Website Discovery & Inventory Exploration (Priority: P1)

**Goal**: Enable AI agents to list websites and inspect detailed metadata for a single website by ID, including tracking snippet.

**Independent Test**: An agent calls `list_websites` to discover sites by domain and calls `get_website` to retrieve full details and tracking code.

### Tests & Verification for User Story 2

- [x] T010 [P] [US2] Add test cases for `list_websites` and `get_website` in `packages/mcp/src/server.test.ts`
- [x] T011 [US2] Implement `get_website` tool in `packages/mcp/src/tools/websites.ts` with `websiteId` parameter and snippet formatting
- [x] T012 [US2] Register `get_website` in server tool suite in `packages/mcp/src/server.ts` and `packages/mcp/src/tools/index.ts`
- [x] T013 [US2] Run local verification command (`npx --yes pnpm@12.3.4 --filter @umami/mcp test`) to confirm User Story 2 passes cleanly

**Checkpoint**: User Stories 1 AND 2 are both functional independently.

---

## Phase 5: User Story 3 - Website Provisioning & Tracking Configuration (Priority: P2)

**Goal**: Enable AI agents to register new tracked websites and update existing website settings, returning embed code immediately.

**Independent Test**: An agent calls `create_website` to register a domain and `update_website` to change its name, receiving the updated website record and tracking `<script>` tag.

### Tests & Verification for User Story 3

- [x] T014 [P] [US3] Add unit test cases for `create_website` and `update_website` in `packages/mcp/src/server.test.ts`
- [x] T015 [US3] Implement `create_website` tool in `packages/mcp/src/tools/websites.ts` accepting `name` (max 100 characters), `domain`, and optional `teamId`
- [x] T016 [US3] Implement `update_website` tool in `packages/mcp/src/tools/websites.ts` accepting `websiteId`, optional `name`, and optional `domain`
- [x] T017 [US3] Register `create_website` and `update_website` in `packages/mcp/src/tools/index.ts` and `packages/mcp/src/server.ts`
- [x] T018 [US3] Run local verification command (`npx --yes pnpm@12.3.4 --filter @umami/mcp test`) to confirm User Story 3 passes cleanly

**Checkpoint**: User Stories 1, 2, and 3 work together and pass verification.

---

## Phase 6: User Story 4 - Safe Operational Guardrails for Destructive Actions (Priority: P3)

**Goal**: Prevent accidental data deletion by requiring an explicit `confirm: true` parameter on destructive tools like `delete_website`.

**Independent Test**: Calling `delete_website` without `confirm: true` returns a safety warning and does not delete; calling with `confirm: true` executes the deletion.

### Tests & Verification for User Story 4

- [x] T019 [P] [US4] Add test cases verifying rejection without `confirm: true` and success with `confirm: true` in `packages/mcp/src/server.test.ts`
- [x] T020 [US4] Implement `delete_website` tool in `packages/mcp/src/tools/websites.ts` with destructive tool annotations and required confirmation gate
- [x] T021 [US4] Register `delete_website` in `packages/mcp/src/tools/index.ts` and `packages/mcp/src/server.ts`
- [x] T022 [US4] Run local verification command (`npx --yes pnpm@12.3.4 --filter @umami/mcp test`) to confirm User Story 4 passes cleanly

**Checkpoint**: All user stories are independently functional with safety guardrails enforced.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, client configuration examples, and end-to-end regression testing.

- [x] T023 [P] Update `packages/mcp/README.md` to document new website management tools, confirmation safety flags, and stdio/remote configs
- [x] T024 [P] Verify remote route authentication and gating tests in `src/app/mcp/route.test.ts`
- [x] T025 Run full verification suite (`npx --yes pnpm@12.3.4 --filter @umami/mcp test && npx --yes pnpm@12.3.4 vitest run src/app/mcp/route.test.ts`)
- [x] T026 Validate runnable scenarios against `specs/001-app-mcp-server/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories.
- **User Stories (Phases 3-6)**:
  - US1 (Analytics Inspection): Depends on Phase 2.
  - US2 (Website Discovery & Get Website): Depends on Phase 2.
  - US3 (Website Provisioning): Depends on Phase 2 and US2.
  - US4 (Destructive Guardrails): Depends on Phase 2 and US2.
- **Polish (Phase 7)**: Depends on completion of all user stories.

### Parallel Opportunities

- Within Phase 1: T001 and T002 can run in parallel.
- Within Phase 2: T003 and T004 can run in parallel.
- Tests marked `[P]` across user stories can be authored in parallel.
- Documentation updates (T023) and route tests (T024) can run in parallel during Polish.

---

## Parallel Example: User Story 2 & 3

```bash
# Author tests for User Story 2 & 3 in parallel:
Task: "T010 [P] [US2] Add test cases for list_websites and get_website in packages/mcp/src/server.test.ts"
Task: "T014 [P] [US3] Add unit test cases for create_website and update_website in packages/mcp/src/server.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocking prerequisite)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify User Story 1 with `npx --yes pnpm@12.3.4 --filter @umami/mcp test`
5. Deploy or test live analytics querying

### Incremental Delivery

1. Phase 1 + 2 → Foundational helpers verified.
2. Phase 3 (US1) → Core traffic analytics querying operational (MVP).
3. Phase 4 (US2) → Site discovery & single site inspection with embed code retrieval.
4. Phase 5 (US3) → Site creation & updating for automated agent site onboarding.
5. Phase 6 (US4) → Confirmation-guarded site deletion.
6. Phase 7 → Full test pass & documentation updates.
