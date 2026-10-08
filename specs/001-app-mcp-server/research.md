# Research & Architectural Decisions: Agent MCP Server for Deployed Application

## 1. Extension Architecture for MCP Server

### Decision
Extend the existing `@umami/mcp` package (`packages/mcp`) and Next.js `/mcp` route (`src/app/mcp/route.ts`) additively rather than creating a separate standalone package or microservice.

### Rationale
- **Existing Foundation**: The repository already includes a full-featured Model Context Protocol (MCP) server package (`@umami/mcp`) that utilizes `@modelcontextprotocol/server` (v1.27.1+) and communicates with the application through `@umami/api-client`.
- **Dual Connection Modes**: The existing architecture already supports both connection models required for agent interaction:
  1. **Remote Streamable HTTP Endpoint**: Hosted at `/mcp` (`src/app/mcp/route.ts`) in Next.js App Router, using in-process dispatch with zero external network overhead when deployed.
  2. **Local Stdio Process**: Hosted via `packages/mcp/src/cli.ts` (`bin/umami-mcp.js`), executing as a local command for desktop agents (Claude Desktop, Cursor, local Antigravity CLI) communicating over HTTPS to `https://analytics.mjmiller.cloud/api`.
- **Constitutional Alignment**: Adheres to Constitution Principle I (Surgical Fork Discipline) and Principle IV (Architectural Layer & Access Control Discipline). Adding tools to `packages/mcp/src/tools/websites.ts` is purely additive and merge-friendly.

### Alternatives Considered
- *Separate Standalone MCP Repository*: Would duplicate API clients, schema definitions, and require separate deployment/build infrastructure. Rejected to maintain single-repository coherence.
- *Direct Database MCP Server*: Exposing direct database connection (Neon Postgres) to agents. Rejected because it violates the constitution (Principle I & Principle IV) and bypasses user/team authorization gates and multi-store query routing.

---

## 2. Website Management & Tracking Snippet Tools

### Decision
Add four new management tools to `packages/mcp/src/tools/websites.ts` and expose them through `@umami/mcp`:
1. `get_website`: Retrieve metadata for a single website by `websiteId`, including formatted tracking script snippet.
2. `create_website`: Provision a new tracked website with `name`, `domain`, and optional `teamId`, returning the created record and tracking snippet.
3. `update_website`: Update a website's `name` or `domain`.
4. `delete_website`: Safely remove a tracked website, guarded by a confirmation parameter.

### Rationale
- `@umami/api-client` already exposes typed operations for `createWebsite`, `getWebsite`, `updateWebsite`, and `deleteWebsite`.
- Returning a generated tracking snippet (`<script defer src="${baseUrl}/script.js" data-website-id="${id}"></script>`) directly in tool outputs enables agents to complete end-to-end setup tasks (e.g. creating a site and immediately inserting tracking tags into codebases or CMS configurations).

### Alternatives Considered
- *Read-only analytics only*: Omitting creation/management tools. Rejected because User Stories 3 and 4 in `spec.md` specifically require site provisioning and configuration capabilities for agents.

---

## 3. Destructive Action Safety Guardrails

### Decision
Implement a mandatory confirmation pattern for destructive tools (`delete_website`):
- The tool's schema requires an optional boolean `confirm: z.boolean().optional()`.
- If `confirm !== true`, the tool handler does **not** call the API client. Instead, it returns a structured warning message detailing the target website name, domain, ID, and a warning that all associated analytics data will be permanently removed, instructing the caller to re-invoke with `confirm: true` if intentional.
- The tool annotations specify `{ readOnlyHint: false, destructiveHint: true, idempotentHint: false }`.

### Rationale
- AI agents occasionally hallucinate parameters or invoke tools unintentionally when exploring capabilities.
- Requiring an explicit confirmation loop prevents accidental production data deletion (satisfying Success Criterion SC-003).

### Alternatives Considered
- *Unconditional execution*: Trusting the agent prompt. Rejected due to high risk of data destruction.
- *Strict read-only lock in code*: Disallowing deletions entirely. Rejected because administrative agents need the capability when explicitly commanded by the owner.

---

## 4. Agent Connection Protocols (Remote vs. Local Stdio)

### Decision
Support both connection topologies seamlessly:
1. **Remote Streamable HTTP (SSE)**:
   - URL: `https://analytics.mjmiller.cloud/mcp`
   - Headers: `Authorization: Bearer umami_<api-key>`
   - Enabled by setting `MCP_ENABLED=1` in the production environment.
2. **Local Stdio**:
   - Command: `npx @umami/mcp` (or local path `node packages/mcp/bin/umami-mcp.js`)
   - Environment variables:
     - `UMAMI_URL=https://analytics.mjmiller.cloud`
     - `UMAMI_API_TOKEN=umami_<api-key>`

### Rationale
- Different agent tools have different connection capabilities:
  - Claude Desktop, Cursor, and local IDE assistants excel with `stdio` configuration.
  - Web-based agents and cloud-hosted bots (such as remote Antigravity instances) require remote HTTP/SSE endpoints.
- Both use the identical underlying MCP server definition (`createUmamiMcpServer`).

---

## 5. Authentication & Deployment Configuration

### Decision
Use self-hosted API keys (`umami_<32-chars>`) generated in the Umami Admin UI under **Settings → API keys**.
- The deployed instance on Hostinger must have `MCP_ENABLED=1` set in `.env` (or Hostinger application environment variables).
- In-process authentication (`src/lib/mcp/auth.ts`) validates the key hash against the Neon Postgres database.
- Path-based security rules prevent API keys from accessing account credential endpoints (password resets, 2FA, user admin), ensuring least-privilege containment for the agent.
