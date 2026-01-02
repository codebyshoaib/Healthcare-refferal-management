# HTTP Gateway for MCP Server

This document explains the HTTP gateway architecture that connects the Express backend to the MCP server.

## Architecture Overview

```
Frontend (HTTP)
    ↓
Backend API (/api/mcp/suggest)
    ↓
MCP Client Gateway (mcpClient.ts)
    ↓
MCP Server Process (spawned child process)
    ↓
MCP Tool (suggest_referral_organization)
    ↓
Database Query
    ↓
Response (JSON)
```

## How It Works

### 1. HTTP Request

The frontend makes an HTTP request to the backend:

```
GET /api/mcp/suggest?patient_zip_code=90210&organization_type=clinic
```

### 2. Backend Controller

The `mcp.controller.ts` receives the request and calls the MCP client gateway:

```typescript
const result = await callSuggestReferralOrganization({
  patient_zip_code,
  organization_type,
  sender_org_id,
});
```

### 3. MCP Client Gateway

The `mcpClient.ts` service:

- Spawns the MCP server as a child process (if not already running)
- Establishes stdio communication with the MCP server
- Sends MCP protocol messages (JSON-RPC 2.0)
- Receives and parses responses
- Returns the result to the controller

### 4. MCP Server

The MCP server (`mcp-server/src/server.ts`):

- Receives tool call requests via stdio
- Executes the `suggest_referral_organization` tool
- Queries the database
- Returns results in MCP protocol format

## Key Files

- **`backend/src/controllers/mcp.controller.ts`**: HTTP endpoint handler
- **`backend/src/services/mcpClient.ts`**: MCP client gateway
- **`mcp-server/src/server.ts`**: MCP server implementation

## Benefits

1. **Single Source of Truth**: The MCP server contains the actual business logic
2. **Reusability**: The MCP server can be used by other MCP clients (like Cursor, Claude Desktop, etc.)
3. **Separation of Concerns**: HTTP layer is separate from MCP protocol layer
4. **Testability**: MCP server can be tested independently

## Process Management

- **Lazy Startup**: The MCP server process is spawned on first request (not at backend startup)
- **Singleton Pattern**: The same process is reused for all subsequent requests (efficient)
- **Process Lifecycle**: The process stays alive as long as the backend is running
- **Automatic Recovery**: If the process crashes or exits unexpectedly, it will be automatically respawned on the next request
- **Cleanup**: Process is killed when backend shuts down (SIGINT, SIGTERM, or exit)
- **Health Checks**: Each request verifies the process is still alive before use

## Error Handling

- Timeout: 30 seconds for tool calls
- Process errors: Logged and returned as HTTP 500
- Connection errors: Automatic retry on next request

## Deployment Considerations

### Local Development

- MCP server runs as a child process
- Requires `tsx` to be available in PATH
- Uses `.env` from `mcp-server/` directory

### Production (Railway)

- Ensure `tsx` is installed: `pnpm add -D tsx` in backend
- MCP server process runs alongside backend
- Both share the same database connection
- Consider process limits and resource usage

## Testing

Test the gateway:

```bash
# Start backend
cd backend
pnpm dev

# In another terminal, test the endpoint
curl "http://localhost:3000/api/mcp/suggest?patient_zip_code=90210"
```

## Troubleshooting

### MCP server not starting

- Check that `mcp-server/.env` exists and has database credentials
- Verify `tsx` is installed: `npx tsx --version`
- Check backend logs for spawn errors

### Timeout errors

- Increase timeout in `mcpClient.ts` (default: 30s)
- Check database connection in MCP server
- Verify MCP server is responding to initialize requests

### Process not reusing

- Check that `initialized` flag is being set correctly
- Verify process is not being killed prematurely
- Check for error handlers that might be resetting state
