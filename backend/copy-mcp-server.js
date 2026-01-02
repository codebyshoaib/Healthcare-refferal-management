import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, "../mcp-server");
const targetDir = path.join(__dirname, "mcp-server");

console.log("Copying mcp-server to backend/mcp-server...");

if (fs.existsSync(targetDir)) {
    console.log("Removing existing backend/mcp-server...");
    fs.rmSync(targetDir, { recursive: true, force: true });
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursiveSync(sourceDir, targetDir);

console.log("MCP server copied to backend/mcp-server");
console.log("Ready for Railway deployment!");

