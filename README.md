<p align="center">
  <img src="https://content.umami.is/website/images/umami-logo.png" alt="Umami Logo" width="100">
</p>

<h1 align="center">Umami</h1>

<p align="center">
  <i>Umami is a privacy-first analytics platform. Traffic, campaigns, behavior, conversions, and revenue in one place — no cookies, no surveillance, self-hosted or in the cloud.</i>
</p>

<p align="center">
  <a href="https://github.com/umami-software/umami/releases"><img src="https://img.shields.io/github/release/umami-software/umami.svg" alt="GitHub Release" /></a>
  <a href="https://github.com/umami-software/umami/blob/master/LICENSE"><img src="https://img.shields.io/github/license/umami-software/umami.svg" alt="MIT License" /></a>
  <a href="https://github.com/umami-software/umami/actions"><img src="https://img.shields.io/github/actions/workflow/status/umami-software/umami/ci.yml" alt="Build Status" /></a>
  <a href="https://cloud.umami.is/share/LGazGOecbDtaIwDr/umami.is" style="text-decoration: none;"><img src="https://img.shields.io/badge/Try%20Demo%20Now-Click%20Here-brightgreen" alt="Umami Demo" /></a>
</p>

---

## 🚀 Getting Started

A detailed getting started guide can be found at [umami.is/docs](https://umami.is/docs/).

---

## 🛠 Installing from Source

### Requirements

- A server with Node.js version 18.18+.
- A PostgreSQL database version v12.14+.
- pnpm version 12.3.4 (or run via `npx --yes pnpm@12.3.4 <command>`).

### Get the source code and install packages

```bash
git clone https://github.com/umami-software/umami.git
cd umami
pnpm install
```

### Configure Umami

Create an `.env` file with the following:

```bash
DATABASE_URL=connection-url
```

Optional: set `API_URL` to change the base URL used by internal UI API calls.
Relative paths are served under `BASE_PATH`; absolute URLs are proxied through the local `/api` route.
For example, `API_URL=/internal-api` or `API_URL=https://api.example.com/api`.

Optional: set `TWO_FACTOR_ENCRYPTION_KEY` to a 64-character hex string to enable two-factor
authentication. Generate one with `openssl rand -hex 32`. Two-factor authentication is unavailable
and cannot be required until this key is set.

MCP is disabled by default. Set `MCP_ENABLED=1` to enable the `/mcp` endpoint, then
authenticate with an API key generated under Settings → API keys.

The connection URL format:

```bash
postgresql://username:mypassword@localhost:5432/mydb
```

### Build the Application

```bash
pnpm run build
```

The build step will create tables in your database if you are installing for the first time. It will also create a login user with username **admin** and password **umami**.

### Start the Application

```bash
pnpm run start
```

By default, this will launch the application on `http://localhost:3000`. You will need to either [proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) requests from your web server or change the [port](https://nextjs.org/docs/api-reference/cli#production) to serve the application directly.

---

## 🐳 Installing with Docker

Umami provides Docker images as well as a Docker compose file for easy deployment.

Docker image:

```bash
docker pull docker.umami.is/umami-software/umami:latest
```

Docker compose (Runs Umami with a PostgreSQL database):

```bash
docker compose up -d
```

---

## 🔄 Getting Updates

To get the latest features, simply do a pull, install any new dependencies, and rebuild:

```bash
git pull
pnpm install
pnpm build
```

To update the Docker image, simply pull the new images and rebuild:

```bash
docker compose pull
docker compose up --force-recreate -d
```

---

## 🤖 AI Agent & MCP Integration

This application includes a built-in [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that allows AI coding assistants and agents (Claude Desktop, Cursor, Antigravity, OpenDevin, and custom LLM workflows) to interact with your analytics data and manage tracked properties.

### Setup & Prerequisites

1. **Enable the MCP endpoint**: Set `MCP_ENABLED=1` in your environment variables (`.env`).
2. **Generate an API key**: Log in to the dashboard, navigate to **Settings → API keys**, and generate a key (`umami_...`).

### Connection Methods

#### 1. Remote Streamable HTTP (SSE)
For remote or cloud-hosted agents, connect directly to the Streamable HTTP endpoint:

- **Endpoint URL**: `https://analytics.mjmiller.cloud/mcp` (or your custom domain)
- **Headers**:
  ```http
  Authorization: Bearer umami_<your-api-key>
  ```

#### 2. Local Stdio Runner
For local desktop assistants (Claude Desktop, Cursor, Antigravity CLI), configure the server via stdio:

##### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "umami-analytics": {
      "command": "node",
      "args": ["/path/to/analytics.mjmiller.cloud/packages/mcp/dist/cli.js"],
      "env": {
        "UMAMI_URL": "https://analytics.mjmiller.cloud",
        "UMAMI_API_TOKEN": "umami_<your-api-key>"
      }
    }
  }
}
```

##### Cursor / Antigravity (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "umami-analytics": {
      "command": "node",
      "args": ["packages/mcp/bin/umami-mcp.js"],
      "env": {
        "UMAMI_URL": "https://analytics.mjmiller.cloud",
        "UMAMI_API_TOKEN": "umami_<your-api-key>"
      }
    }
  }
}
```

### Available Tools

- **Websites & Configuration**:
  - `list_websites`: Discover accessible websites (returns ID, name, domain).
  - `get_website`: Inspect detailed website metadata and retrieve ready-to-use `<script defer src="..." data-website-id="..."></script>` embed snippet.
  - `create_website`: Provision a new tracked domain and immediately return its tracking tag.
  - `update_website`: Update display name or domain of an existing website.
  - `delete_website`: Permanently delete a website and historical analytics data (**requires `confirm: true`** safety guardrail).
- **Traffic & Analytics**:
  - `get_website_stats`: Totals for pageviews, unique visitors, visits, bounce rates, and visit duration.
  - `get_website_metrics`: Ranked breakdowns (top pages, referrers, browsers, devices, countries, UTM channels).
  - `get_realtime`: Active visitors and paths viewed in the last 5 minutes.
  - `get_website_traffic`: Time series metrics by minute, hour, day, month, or year.
  - `get_events`, `get_sessions`, `run_funnel`, `get_revenue`, `get_performance`: Deep custom events, session journeys, and conversion funnels.

---

## 🛟 Support

<p align="center">
  <a href="https://github.com/umami-software/umami"><img src="https://img.shields.io/badge/GitHub--blue?style=social&logo=github" alt="GitHub" /></a>
  <a href="https://twitter.com/umami_software"><img src="https://img.shields.io/badge/Twitter--blue?style=social&logo=twitter" alt="Twitter" /></a>
  <a href="https://linkedin.com/company/umami-software"><img src="https://img.shields.io/badge/LinkedIn--blue?style=social&logo=linkedin" alt="LinkedIn" /></a>
  <a href="https://umami.is/discord"><img src="https://img.shields.io/badge/Discord--blue?style=social&logo=discord" alt="Discord" /></a>
</p>

[release-shield]: https://img.shields.io/github/release/umami-software/umami.svg
[releases-url]: https://github.com/umami-software/umami/releases
[license-shield]: https://img.shields.io/github/license/umami-software/umami.svg
[license-url]: https://github.com/umami-software/umami/blob/master/LICENSE
[build-shield]: https://img.shields.io/github/actions/workflow/status/umami-software/umami/ci.yml
[build-url]: https://github.com/umami-software/umami/actions
[github-shield]: https://img.shields.io/badge/GitHub--blue?style=social&logo=github
[github-url]: https://github.com/umami-software/umami
[twitter-shield]: https://img.shields.io/badge/Twitter--blue?style=social&logo=twitter
[twitter-url]: https://twitter.com/umami_software
[linkedin-shield]: https://img.shields.io/badge/LinkedIn--blue?style=social&logo=linkedin
[linkedin-url]: https://linkedin.com/company/umami-software
[discord-shield]: https://img.shields.io/badge/Discord--blue?style=social&logo=discord
[discord-url]: https://discord.com/invite/4dz4zcXYrQ
