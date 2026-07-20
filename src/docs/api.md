# mdbin API

mdbin exposes a small HTTP API for creating and editing bins programmatically. All endpoints accept and return JSON.

**Base URL:** `{{BASE_URL}}`

## Authentication

There are no API keys. Each bin is protected by an **edit token** that is returned when the bin is created. Keep it safe — it is the only way to edit a bin later. If you don't supply one, a random token is generated for you.

## Create a bin

`POST /api/bins`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `content` | string | yes | The markdown content of the bin. |
| `customUrl` | string | no | A custom URL slug (6–64 chars: letters, numbers, `-`, `_`). Random if omitted. |
| `token` | string | no | A custom edit token (6–64 chars). Random if omitted. |

### Example

```bash
curl -X POST {{BASE_URL}}/api/bins \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Hello, world!",
    "customUrl": "my-notes",
    "token": "super-secret"
  }'
```

### Response — `201 Created`

```json
{
  "binId": 42,
  "customUrl": "my-notes",
  "token": "super-secret",
  "url": "{{BASE_URL}}/my-notes"
}
```

Save the `binId` and `token` — you'll need both to edit the bin later.

## Edit a bin

`PATCH /api/bins/{binId}`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `content` | string | yes | The new markdown content. Replaces the existing content. |
| `token` | string | yes | The edit token returned when the bin was created. |

### Example

```bash
curl -X PATCH {{BASE_URL}}/api/bins/42 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Updated!",
    "token": "super-secret"
  }'
```

### Response — `200 OK`

```json
{
  "id": 42,
  "customUrl": "my-notes",
  "content": "# Updated!",
  "createdAt": "2026-06-18 12:00:00",
  "updatedAt": "2026-06-18 12:34:56",
  "url": "{{BASE_URL}}/my-notes"
}
```

## Read a bin

Every bin's raw markdown is available without authentication:

`GET /{customUrl}/raw`

```bash
curl {{BASE_URL}}/my-notes/raw
```

## MCP server

mdbin ships a remote [MCP](https://modelcontextprotocol.io) server, so AI assistants can create and edit bins directly. Point your client at:

```
{{BASE_URL}}/mcp
```

For Claude Code:

```bash
claude mcp add --transport http mdbin {{BASE_URL}}/mcp
```

Or add it to a client config file directly:

```json
{
  "mcpServers": {
    "mdbin": {
      "type": "http",
      "url": "{{BASE_URL}}/mcp"
    }
  }
}
```

### Tools

| Tool | Description |
| --- | --- |
| `create_bin` | Create a bin. Returns the URL, `binId`, and edit token. |
| `edit_bin` | Replace a bin's content. Needs `binId` and the edit token. |
| `read_bin` | Fetch a bin's raw markdown by slug. No token needed. |

The server is stateless and unauthenticated — the edit token is passed as a tool argument, exactly like the REST API. Anyone can create and read bins; only a caller holding the right token can edit one.

## Errors

Errors are returned as JSON with an `error` message and an appropriate status code:

```json
{ "error": "Custom URL already taken" }
```

| Status | Meaning |
| --- | --- |
| `400` | Invalid request body or parameters. |
| `401` | Invalid edit token. |
| `404` | Bin not found. |
| `409` | Custom URL already taken. |
