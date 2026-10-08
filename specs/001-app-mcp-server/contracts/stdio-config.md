# Contract: Local Stdio MCP Configuration

## Stdio Runner Overview

- **Binary**: `packages/mcp/bin/umami-mcp.js` (or `npx @umami/mcp` when packaged)
- **Transport**: Standard Input/Output (`stdio`) JSON-RPC
- **Process Entrypoint**: `packages/mcp/src/cli.ts` -> `serveUmamiStdio()`

## Environment Variables

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `UMAMI_URL` | Yes (or `UMAMI_API_URL`) | Base URL of deployed Umami application | `https://analytics.mjmiller.cloud` |
| `UMAMI_API_URL` | No | Overrides full API base URL | `https://analytics.mjmiller.cloud/api` |
| `UMAMI_API_TOKEN` | Yes | Self-hosted API key or login token | `umami_1234567890abcdef...` |

## Client Configuration Examples

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "analytics": {
      "command": "node",
      "args": ["/home/michael/Code/analytics.mjmiller.cloud/packages/mcp/dist/index.js"],
      "env": {
        "UMAMI_URL": "https://analytics.mjmiller.cloud",
        "UMAMI_API_TOKEN": "umami_<your-api-key>"
      }
    }
  }
}
```

### Antigravity / Cursor (`.cursor/mcp.json` or Antigravity MCP settings)
```json
{
  "mcpServers": {
    "umami-analytics": {
      "command": "node",
      "args": ["/home/michael/Code/analytics.mjmiller.cloud/packages/mcp/bin/umami-mcp.js"],
      "env": {
        "UMAMI_URL": "https://analytics.mjmiller.cloud",
        "UMAMI_API_TOKEN": "umami_<your-api-key>"
      }
    }
  }
}
```
