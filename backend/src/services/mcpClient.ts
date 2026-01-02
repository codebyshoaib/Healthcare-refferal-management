import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mcpProcess: ChildProcess | null = null;
let requestId = 0;
let initialized = false;
const pendingRequests = new Map<
  number,
  { resolve: (value: any) => void; reject: (error: Error) => void }
>();

async function ensureMcpProcess(): Promise<ChildProcess> {
  if (mcpProcess && !mcpProcess.killed && initialized) {
    if (mcpProcess.exitCode === null) {
      return mcpProcess;
    } else {
      console.warn("MCP server process has exited, respawning...");
      mcpProcess = null;
      initialized = false;
    }
  }

  const mcpServerDir = path.join(__dirname, "../../../mcp-server");

  mcpProcess = spawn("npx", ["tsx", "src/server.ts"], {
    cwd: mcpServerDir,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "development",
    },
  });

  let buffer = "";

  mcpProcess.stdout?.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          if (response.id !== undefined && pendingRequests.has(response.id)) {
            const { resolve, reject } = pendingRequests.get(response.id)!;
            pendingRequests.delete(response.id);

            if (response.error) {
              reject(new Error(response.error.message || "MCP server error"));
            } else {
              if (response.result?.content?.[0]?.text) {
                try {
                  const parsed = JSON.parse(response.result.content[0].text);
                  resolve(parsed);
                } catch {
                  resolve(response.result);
                }
              } else {
                resolve(response.result);
              }
            }
          }
        } catch (e) {}
      }
    }
  });

  mcpProcess.stderr?.on("data", (data: Buffer) => {
    const output = data.toString();
    if (output.includes("Error") || output.includes("Failed")) {
      console.error("[MCP Server Error]:", output.trim());
    }
  });

  mcpProcess.on("exit", (code, signal) => {
    console.warn(
      `MCP server process exited (code: ${code}, signal: ${signal}). Will respawn on next request.`
    );
    mcpProcess = null;
    initialized = false;
    pendingRequests.forEach(({ reject }) => {
      reject(new Error("MCP server process exited unexpectedly"));
    });
    pendingRequests.clear();
  });

  mcpProcess.on("error", (error) => {
    console.error("MCP server process error:", error);
    mcpProcess = null;
    initialized = false;
  });

  await initializeMcpConnection();

  return mcpProcess;
}

async function initializeMcpConnection(): Promise<void> {
  if (initialized && mcpProcess && !mcpProcess.killed) {
    return;
  }

  if (!mcpProcess) {
    throw new Error("MCP process not started");
  }

  const id = ++requestId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("MCP initialization timeout"));
    }, 15000);

    pendingRequests.set(id, {
      resolve: () => {
        clearTimeout(timeout);
        initialized = true;
        resolve();
      },
      reject: (error) => {
        clearTimeout(timeout);
        initialized = false;
        reject(error);
      },
    });

    const initRequest = {
      jsonrpc: "2.0",
      id,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "backend-gateway",
          version: "1.0.0",
        },
      },
    };

    mcpProcess!.stdin?.write(JSON.stringify(initRequest) + "\n");

    setTimeout(() => {
      const initializedNotification = {
        jsonrpc: "2.0",
        method: "notifications/initialized",
      };
      mcpProcess!.stdin?.write(JSON.stringify(initializedNotification) + "\n");
    }, 100);
  });
}

async function sendMcpToolCall(toolName: string, args: any): Promise<any> {
  let process = await ensureMcpProcess();

  if (!process || process.killed || process.exitCode !== null) {
    console.warn("MCP process died, respawning...");
    mcpProcess = null;
    initialized = false;
    process = await ensureMcpProcess();
  }

  const id = ++requestId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("MCP server request timeout (30s)"));
    }, 30000);

    pendingRequests.set(id, {
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });

    const request = {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    process.stdin?.write(JSON.stringify(request) + "\n");
  });
}

export async function callSuggestReferralOrganization(params: {
  patient_zip_code: string;
  organization_type?: string;
  sender_org_id?: string;
}): Promise<any> {
  return await sendMcpToolCall("suggest_referral_organization", {
    patient_zip_code: params.patient_zip_code,
    ...(params.organization_type && {
      organization_type: params.organization_type,
    }),
    ...(params.sender_org_id && { sender_org_id: params.sender_org_id }),
  });
}

export function cleanupMcpClient() {
  if (mcpProcess) {
    mcpProcess.kill();
    mcpProcess = null;
  }
  pendingRequests.clear();
  initialized = false;
}

process.on("exit", cleanupMcpClient);
process.on("SIGINT", cleanupMcpClient);
process.on("SIGTERM", cleanupMcpClient);
