# Healthcare Referral Management - MCP Server

This is a Model Context Protocol (MCP) server implementation for the Healthcare Referral Management system. It provides intelligent Smart Referral Matching to suggest the best organizations for referrals.

## Features

### Smart Referral Matching Tool

- **Tool**: `suggest_referral_organization`
- Suggests the best organization to send a referral to based on:
  - **Coverage Area**: Which organizations cover the patient's zip code (exact match, city, county, or state level)
  - **Historical Success**: Acceptance rates and referral history
  - **Specialty Matching**: Organization type matching
  - **Recency**: Recent successful referrals get bonus points
- Returns ranked suggestions with match scores (0-100) and detailed reasoning

## Prerequisites

- Node.js 18+ and pnpm (or npm)
- PostgreSQL database
- Access to the same database as the main backend

## Setup

### 1. Install Dependencies

```bash
cd mcp-server
pnpm install
```

### 2. Configure Environment

Create a `.env` file in the `mcp-server` directory:

```env
# Option 1: Using DATABASE_URL (recommended for cloud deployments)
DATABASE_URL=postgresql://user:password@host:port/database

# Option 2: Using individual variables
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

### 3. Verify Database Connection

The server will automatically test the database connection on startup. You should see:

```
Initializing MCP server...
Database connection successful!
```

## Running the Server

### Quick Start Options:

**Option 1: Automatic** - The backend HTTP gateway starts it automatically:

```bash
cd ../backend
pnpm dev
```

The server listens on stdio (standard input/output) for MCP protocol messages.

### Direct API Testing (via Backend)

The backend exposes a REST API endpoint that uses the same logic:

```bash
# Get suggestions with optional filters
curl "http://localhost:3000/api/mcp/suggest?patient_zip_code=90210&organization_type=clinic&sender_org_id=your-org-id"
```

### Frontend Integration (Recommended)

The frontend has integrated the Smart Referral Matching tool:

1. Navigate to **"Send Referral"** page
2. Select a sender organization
3. Enter a patient zip code
4. Click **"Get Suggestions"** button
5. View ranked suggestions with match scores
6. Click **"Select"** to auto-fill the receiver organization

## Available Tool

### `suggest_referral_organization`

**Description**: Suggest the best organization to send a referral to based on multiple factors.

**Parameters**:

- `patient_zip_code` (string, required): Patient's zip code
- `organization_type` (string, optional): Filter by organization type (e.g., "clinic", "pharmacy")
- `sender_org_id` (string, optional): UUID of sender organization (to exclude self-referrals)

**Returns**:

```json
{
  "zip_code": "90210",
  "organization_type": "clinic",
  "suggestions": [
    {
      "organization": {
        "id": "uuid",
        "name": "Best Clinic",
        "type": "clinic",
        "contact_info": {...}
      },
      "match_score": 85.5,
      "coverage_level": "zip_code",
      "acceptance_stats": {
        "acceptance_rate": 90.5,
        "success_rate": 95.0,
        "total_referrals": 20,
        "recent_accepted": 3
      },
      "reasons": [
        "Covers 90210 at zip code level",
        "90.5% acceptance rate (20 total referrals)",
        "Matches requested type: clinic",
        "3 recent accepted referrals"
      ]
    }
  ],
  "total_found": 10
}
```

## Scoring Algorithm

The referral matching uses a scoring system (0-100 points):

- **Coverage Match** (40 points max):

  - Exact zip code match: 40 points
  - City match: 30 points
  - County match: 20 points
  - State match: 10 points

- **Acceptance Rate** (30 points max):

  - Based on historical acceptance rate: `(acceptance_rate / 100) * 30`

- **Type Match** (20 points):

  - If organization type matches requested type: +20 points

- **Recency Bonus** (10 points max):
  - Recent accepted referrals (last 30 days): `min(recent_accepted * 2, 10)`

## Architecture

```
mcp-server/
├── src/
│   ├── server.ts      # MCP server implementation
│   └── db.ts          # Database connection
├── package.json
├── tsconfig.json
└── .env               # Environment variables
```

The server uses:

- **@modelcontextprotocol/sdk**: MCP SDK for server implementation
- **pg**: PostgreSQL client
- **zod**: Schema validation
- **dotenv**: Environment variable management

## Integration with Frontend

The MCP server functionality is exposed through an **HTTP Gateway** architecture:

### Architecture

```
Frontend → Backend API → MCP Client Gateway → MCP Server → Database
```

### Backend API Endpoint

- `GET /api/mcp/suggest?patient_zip_code=90210&organization_type=clinic` - Get suggestions

The backend (`backend/src/services/mcpClient.ts`) acts as an HTTP gateway that:

1. Spawns the MCP server as a child process
2. Communicates via stdio using MCP protocol
3. Converts HTTP requests to MCP tool calls
4. Returns JSON responses

The frontend (`SendReferralPage.tsx`) integrates these endpoints to show AI-powered suggestions when sending referrals.

### Benefits

- **Single Source of Truth**: Business logic lives in the MCP server
- **Reusable**: MCP server can be used by other MCP clients (Cursor, Claude Desktop, etc.)
- **Clean Separation**: HTTP layer separate from MCP protocol layer

## Notes

- The server uses **stdio transport**, which means it communicates via standard input/output
- When run directly, it appears to "do nothing" - this is normal! It's waiting for MCP protocol messages
- All logging goes to stderr to avoid interfering with the protocol
- The server automatically tests the database connection on startup

## 🐛 Troubleshooting

### Server exits immediately

- Check your `.env` file has correct database credentials
- Verify database is accessible
- Check error messages in stderr

### No suggestions returned

- Verify organizations exist in the database
- Check that organizations have coverage areas set
- Ensure organizations have `receiver` or `both` role

### Database connection errors

- Verify DATABASE*URL or DB*\* variables are correct
- Check database is running and accessible
- Verify network/firewall settings

## Other Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

**Shoaib Ud Din**
