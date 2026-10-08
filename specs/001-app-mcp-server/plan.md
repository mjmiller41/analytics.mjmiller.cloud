# Implementation Plan: Agent MCP Server for Deployed Application

**Branch**: `001-app-mcp-server` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-app-mcp-server/spec.md`

## Summary

Enable autonomous AI agents (Claude Desktop, Cursor, Antigravity, OpenDevin, and custom LLM assistants) to interact with the deployed Umami analytics application (`analytics.mjmiller.cloud`). The implementation builds upon the existing `@umami/mcp` package and Next.js `/mcp` route handler, adding website provisioning and configuration tools (`create_website`, `get_website`, `update_website`), tracking snippet generation, and confirmation safety guardrails for destructive actions (`delete_website`). It supports both remote Streamable HTTP / SSE transport (`https://analytics.mjmiller.cloud/mcp` with API key auth) and local stdio process execution.

## Technical Context

**Language/Version**: TypeScript 5.8+ / Node.js 18.18+ (ES modules)

**Primary Dependencies**: `@modelcontextprotocol/server` (v1.27.1+), `@umami/api-client`, `zod`, `debug`

**Storage**: N/A directly for MCP. The MCP server is completely stateless; it dispatches all tool operations to the Umami REST API via `@umami/api-client` (or in-process route handlers), preserving existing PostgreSQL/ClickHouse query layer parity and user/team capability permissions.

**Testing**: Vitest (`packages/mcp/vitest.config.ts`, `vitest run src/app/mcp/route.test.ts`)

**Target Platform**: Linux server (Hostinger Node.js production deployment) and local agent workstations (macOS/Linux/Windows via stdio)

**Project Type**: Monorepo workspace package (`packages/mcp`) + Next.js App Router route (`src/app/mcp/route.ts`)

**Performance Goals**: <3 seconds end-to-end tool response time over public network; <100ms in-process dispatch overhead

**Constraints**:
- Strict fork discipline: All additions to `@umami/mcp` must remain surgical and additive to avoid merge conflicts with upstream `umami-software/umami`.
- Toolchain: Pinned `pnpm 12.3.4` (invoked via `npx --yes pnpm@12.3.4`).
- Safety: Destructive operations (`delete_website`) MUST be gated with a required `confirm: true` parameter to prevent accidental deletion from agent hallucinations.
- Security: Remote `/mcp` endpoint must enforce `MCP_ENABLED=1` and bearer API-key authentication (`umami_<32-chars>`).

**Verification Command**:
```bash
npx --yes pnpm@12.3.4 --filter @umami/mcp test && npx --yes pnpm@12.3.4 vitest run src/app/mcp/route.test.ts
```

**Workspace Rules**: `GEMINI.md` and Constitution ratifying surgical fork discipline, dual-store parity, layer isolation, and engine pinning loaded and respected.

## Exploration Findings

1. **Existing MCP Server (`packages/mcp`)**: Already implements 23 read-only analytics and reporting tools (`list_websites`, `get_website_stats`, `get_website_metrics`, `get_realtime`, `run_funnel`, `get_revenue`, etc.) built on `@modelcontextprotocol/server`.
2. **Existing Remote Route (`src/app/mcp/route.ts`)**: Built-in Next.js App Router route providing Streamable HTTP endpoint for `/mcp`. It checks `MCP_ENABLED=1` and uses `authenticateMcpRequest` to validate self-hosted API keys (`umami_...`).
3. **Existing API Client (`packages/api-client`)**: Provides typed wrappers (`createWebsite`, `getWebsite`, `updateWebsite`, `deleteWebsite`) generated from OpenAPI schemas.
4. **Missing Capabilities from Spec**:
   - `packages/mcp/src/tools/websites.ts` only implements `list_websites`.
   - Missing: `get_website` (single site lookup & tracking snippet), `create_website` (provision new tracked site & generate snippet tag), `update_website`, and `delete_website` (with confirmation guardrail).
   - Deployment configuration instructions: Documenting the `MCP_ENABLED=1` environment variable and agent client setups (Claude Desktop, Cursor, Antigravity).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evaluation |
| :--- | :---: | :--- |
| **I. Surgical Fork Discipline** | PASS | Changes are strictly additive to `packages/mcp/src/tools/websites.ts`. No core files or upstream identifiers are modified or renamed. |
| **II. Upstream Sync & Deployable Main** | PASS | Follows existing `@umami/mcp` structure; future upstream merges will merge cleanly without conflict. |
| **III. Dual-Store Analytics Parity** | PASS | MCP calls `@umami/api-client` endpoints which route through `src/lib/db.ts` (`runQuery`), preserving PostgreSQL and ClickHouse parity. |
| **IV. Architectural Layer & Access Control Discipline** | PASS | MCP does not access database directly; it delegates to the API route handlers which enforce Zod validation and permissions checks. |
| **V. Automated Verification & Toolchain Consistency** | PASS | Uses pinned `pnpm 12.3.4` and runs Vitest automated test suites. |

## Project Structure

### Documentation (this feature)

```text
specs/001-app-mcp-server/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Architectural decisions & research findings
├── data-model.md        # Entities, schemas, and confirmation guardrail states
├── quickstart.md        # Verification and end-to-end testing scenarios
├── contracts/           # Interface and tool contracts
│   ├── tools.json       # MCP Tool JSON schemas
│   ├── http-mcp.md      # Remote Streamable HTTP endpoint contract
│   └── stdio-config.md  # Local stdio runner configuration contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
packages/mcp/
├── bin/
│   └── umami-mcp.js     # CLI entrypoint executable for stdio
├── src/
│   ├── cli.ts           # Stdio CLI runner
│   ├── stdio.ts         # Stdio server setup & environment variable resolution
│   ├── server.ts        # McpServer instantiation & instructions
│   ├── http.ts          # Streamable HTTP handler factory
│   ├── tools/
│   │   ├── index.ts     # Tool exports & toolsets
│   │   └── websites.ts  # [EDIT] list_websites, get_website, create_website, update_website, delete_website
│   ├── lib/
│   │   ├── tool.ts      # Tool definition and registration helpers
│   │   └── errors.ts    # Error categorization and formatting
│   └── server.test.ts   # [EDIT] Automated test suite verifying tool execution
src/app/mcp/
├── route.ts             # Remote Next.js Streamable HTTP route handler
└── route.test.ts        # Verification tests for route gating and authentication
```

**Structure Decision**: Monorepo workspace package layout. Code modifications are isolated to `packages/mcp/src/tools/websites.ts` and `packages/mcp/src/server.test.ts`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | No constitutional gates or boundaries violated. | Purely additive workspace package enhancements. |
