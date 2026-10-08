# Quickstart & Verification Guide: Agent MCP Server

This guide outlines end-to-end verification scenarios to validate that agents can interact with the deployed Umami analytics application via the Model Context Protocol (MCP).

## Prerequisites

1. **Deployed Instance Access**: The app is accessible at `https://analytics.mjmiller.cloud`.
2. **Environment Variable**: `MCP_ENABLED=1` is set in the server environment (e.g. Hostinger app panel or `.env`).
3. **API Key**: Generate a valid API key in the Umami UI:
   - Navigate to **Settings → API keys**
   - Click **Create API key**, assign a name (e.g. `Agent Key`), and copy the generated key (`umami_...`).
4. **Local Toolchain**: `npx --yes pnpm@12.3.4` available.

---

## Scenario 1: Automated Unit & Integration Tests

Verify that all MCP tool schemas, handlers, and HTTP endpoint authorization guards pass automated checks.

```bash
# Test MCP package tools and stdio integration
npx --yes pnpm@12.3.4 --filter @umami/mcp test

# Test remote /mcp route authentication and enable gates
npx --yes pnpm@12.3.4 vitest run src/app/mcp/route.test.ts
```

**Expected Outcome**: All tests pass cleanly (27+ tests in `@umami/mcp`, 5 tests in `src/app/mcp/route.test.ts`).

---

## Scenario 2: Remote HTTP MCP Verification (cURL)

Verify that the deployed remote endpoint responds correctly to authentication and rejects unauthorized requests.

### Unauthorized Check
```bash
curl -i https://analytics.mjmiller.cloud/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
**Expected Outcome**: `HTTP/1.1 401 Unauthorized` with `{"error":"invalid_request","error_description":"Missing bearer API key."}`.

### Authorized Tools Discovery
```bash
curl -i https://analytics.mjmiller.cloud/mcp \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
**Expected Outcome**: `HTTP/1.1 200 OK` returning tool definitions including `list_websites`, `get_website`, `create_website`, `delete_website`, `get_website_stats`, `get_website_metrics`, and `get_realtime`.

---

## Scenario 3: End-to-End Agent Journey via Stdio

Test running the MCP server locally over stdio connected to the deployed application:

### Step 1: Launch stdio session with environment variables
```bash
UMAMI_URL="https://analytics.mjmiller.cloud" \
UMAMI_API_TOKEN="<YOUR_API_KEY>" \
node packages/mcp/bin/umami-mcp.js
```

### Step 2: Send JSON-RPC initialize payload
Send via stdin:
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}
```
**Expected Outcome**: Returns server capabilities, server name `umami`, and version `0.1.0`.

### Step 3: Call `list_websites`
```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_websites","arguments":{}}}
```
**Expected Outcome**: Returns registered websites with their `id`, `name`, and `domain`.

### Step 4: Call `create_website` & retrieve snippet
```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"create_website","arguments":{"name":"Test Staging","domain":"staging.example.com"}}}
```
**Expected Outcome**: Returns newly created website identifier and the tracking `<script>` snippet tag.

### Step 5: Test Safety Guardrail on `delete_website`
```json
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"delete_website","arguments":{"websiteId":"<CREATED_ID>"}}}
```
**Expected Outcome**: Aborts deletion safely, returns a prompt warning that data will be lost, and asks to re-run with `confirm: true`.

Re-running with `confirm: true`:
```json
{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"delete_website","arguments":{"websiteId":"<CREATED_ID>","confirm":true}}}
```
**Expected Outcome**: Successfully deletes the test website and confirms removal.
