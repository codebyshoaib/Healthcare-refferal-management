# Moving MCP Server to Backend Directory

## Quick Fix for Railway Deployment

Since Railway's root is set to `backend/`, it can't access `../mcp-server` during build. The simplest solution is to move `mcp-server/` into `backend/`.

## Steps

1. **Move the directory:**
   ```bash
   # From repo root
   mv mcp-server backend/mcp-server
   ```

2. **Update .gitignore (if needed):**
   Make sure `backend/mcp-server/node_modules` is ignored (it should be already)

3. **Commit the change:**
   ```bash
   git add backend/mcp-server
   git commit -m "Move mcp-server into backend/ for Railway deployment"
   git push
   ```

4. **Update Railway Build Command:**
   In Railway Dashboard → Settings → Build Command:
   ```
   pnpm install && pnpm build:railway
   ```
   
   The `build:railway` script now just builds mcp-server directly (no copy needed).

## What Changed

- ✅ Removed copy script from build process
- ✅ Updated path resolution to check `backend/mcp-server` first
- ✅ Simplified build command

## Local Development

For local development, you can either:
- Keep `mcp-server` in `backend/` (works for both local and Railway)
- Or create a symlink: `ln -s ../mcp-server backend/mcp-server` (Unix/Mac only)

The code will automatically find it in either location.

