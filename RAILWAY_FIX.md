# Railway Deployment Fix Guide

## Issues Fixed

1. **CORS Configuration** - Already configured correctly
2. **502 Bad Gateway** - Likely due to MCP server not starting properly
3. **Better Error Handling** - Added comprehensive logging

## Railway Configuration

### Step 1: Update Railway Build Command

In Railway Dashboard → Your Service → Settings:

**Build Command:**

```bash
pnpm install && pnpm build:railway
```

This will:

1. Install backend dependencies
2. Copy `mcp-server/` to `backend/mcp-server/`
3. Install mcp-server dependencies
4. Build mcp-server (TypeScript → JavaScript)
5. Build backend (TypeScript → JavaScript)

**Start Command:**

```bash
pnpm start
```

### Step 2: Verify Environment Variables

Make sure these are set in Railway:

- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV=production` - Important for using compiled code
- `API_TOKEN` - For API authentication
- `FRONTEND_URL` - Your Vercel frontend URL (optional, CORS handles `.vercel.app`)

### Step 3: Check Railway Logs

After deployment, check Railway logs for:

1. **MCP Server Directory Found:**

   ```
   [MCP Client] Using MCP server directory: /app/mcp-server
   ```

2. **MCP Server Starting:**

   ```
   [MCP Client] Starting MCP server: node dist/server.js
   ```

3. **Database Connection:**

   ```
   [MCP Server]: Database connection successful!
   ```

4. **MCP Server Running:**
   ```
   [MCP Server]: MCP server is now running and listening on stdio
   ```

### Step 4: Test the Endpoint

Once deployed, test:

```
GET https://your-railway-url.up.railway.app/api/mcp/suggest?patient_zip_code=12345
```

With headers:

```
Authorization: Bearer YOUR_API_TOKEN
```

## Troubleshooting

### Error: "MCP server directory not found"

**Solution:** The build command didn't copy mcp-server. Make sure `pnpm build:railway` is in your build command.

### Error: "Cannot find module 'dist/server.js'"

**Solution:** MCP server didn't build. Check that:

1. `mcp-server/package.json` has `build` script
2. `pnpm build:railway` runs successfully
3. `backend/mcp-server/dist/server.js` exists after build

### Error: "Database connection failed"

**Solution:** Check:

1. `DATABASE_URL` is set correctly in Railway
2. Database is accessible from Railway
3. Database credentials are correct

### Error: "MCP initialization timeout"

**Solution:** MCP server is starting but not responding. Check:

1. MCP server logs in Railway
2. Database connection is working
3. No errors in MCP server startup

### 502 Bad Gateway

**Common causes:**

1. Backend crashed on startup (check logs)
2. MCP server failed to start (check logs)
3. Missing environment variables
4. Port not configured correctly

**Fix:** Check Railway logs for the exact error message.

## Manual Verification

If you want to test locally with production-like setup:

```bash
cd backend
node copy-mcp-server.js
cd mcp-server
pnpm install
pnpm build
cd ..
pnpm build
NODE_ENV=production pnpm start
```

Then test:

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  "http://localhost:3000/api/mcp/suggest?patient_zip_code=12345"
```
