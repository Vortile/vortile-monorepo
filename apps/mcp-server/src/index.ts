import http from "node:http";
import { geminiTools, executeToolCall, processWhatsAppMessage } from "@vortile/mcp";

try {
  process.loadEnvFile("../../apps/admin/.env.local");
} catch {
  // Ignore if env file not found
}

const PORT = Number(process.env.MCP_SERVER_PORT) || 3003;

const parseJsonBody = (req: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
};

const sendJson = (res: http.ServerResponse, statusCode: number, data: any) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // 1. Healthcheck
  if (pathname === "/health" || pathname === "/") {
    sendJson(res, 200, {
      status: "online",
      service: "vortile-mcp-server",
      protocol: "model-context-protocol-v1",
      registeredTools: geminiTools.length,
      model: "google/gemini-2.5-flash",
      uptime: process.uptime(),
    });
    return;
  }

  // 2. List all MCP Tools
  if (req.method === "GET" && pathname === "/mcp/tools") {
    sendJson(res, 200, {
      success: true,
      tools: geminiTools,
    });
    return;
  }

  // 3. Direct Tool Execution via MCP
  if (req.method === "POST" && pathname === "/mcp/execute") {
    try {
      const body = await parseJsonBody(req);
      const { toolName, args = {}, restaurantId = "rest_vorti_marmitex" } = body;

      if (!toolName) {
        sendJson(res, 400, { error: "toolName is required" });
        return;
      }

      const result = await executeToolCall(toolName, args, restaurantId);
      sendJson(res, 200, { success: true, ...result });
      return;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || "Internal MCP Execution Error" });
      return;
    }
  }

  // 4. Conversational WhatsApp Gemini MCP Processing
  if (req.method === "POST" && pathname === "/mcp/chat") {
    try {
      const body = await parseJsonBody(req);
      const {
        message,
        senderRole = "kitchen",
        restaurantId = "rest_vorti_marmitex",
        history = [],
      } = body;

      if (!message) {
        sendJson(res, 400, { error: "message is required" });
        return;
      }

      const aiResponse = await processWhatsAppMessage({
        message,
        senderRole,
        restaurantId,
        history,
      });

      sendJson(res, 200, { success: true, ...aiResponse });
      return;
    } catch (err: any) {
      sendJson(res, 500, { error: err.message || "Internal AI Processing Error" });
      return;
    }
  }

  // 5. Standard JSON-RPC 2.0 MCP Endpoint (tools/list & tools/call)
  if (req.method === "POST" && pathname === "/mcp/rpc") {
    try {
      const body = await parseJsonBody(req);
      const { jsonrpc, id, method, params } = body;

      if (jsonrpc !== "2.0") {
        sendJson(res, 400, { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } });
        return;
      }

      if (method === "tools/list") {
        sendJson(res, 200, {
          jsonrpc: "2.0",
          id,
          result: {
            tools: geminiTools.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.parameters,
            })),
          },
        });
        return;
      }

      if (method === "tools/call") {
        const { name, arguments: callArgs } = params || {};
        const result = await executeToolCall(name, callArgs || {});
        sendJson(res, 200, {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: result.humanMessage }],
            data: result.result,
          },
        });
        return;
      }

      sendJson(res, 404, {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
      return;
    } catch (err: any) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: err.message || "Internal RPC Error" },
      });
      return;
    }
  }

  sendJson(res, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`🚀 [Vortile MCP Server] Running on http://localhost:${PORT}`);
  console.log(`🔌 Registered ${geminiTools.length} MCP Tools backed by SQLite and Gemini 2.5 Flash.`);
});
