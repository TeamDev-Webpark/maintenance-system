import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const maximumBodyBytes = 32_768;
const idPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

function respond(response: ServerResponse, code: number, status: string) {
  response.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify({ status }));
}

function getBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size <= maximumBodyBytes) chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(size <= maximumBodyBytes ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : null);
      } catch {
        resolve(null);
      }
    });
    request.on("error", reject);
  });
}

const priorityLabels = { high: "ด่วน", critical: "วิกฤต" };

function shortText(value: unknown, maximum = 350): string {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, maximum) : "";
}

export function pmAlertEmail(env: Record<string, string | undefined>, deliver = fetch): Plugin {
  const key = env.PM_EMAIL_API_KEY;
  const from = env.PM_EMAIL_FROM;
  const to = env.PM_EMAIL_TO?.split(",").map((value) => value.trim()).filter(Boolean);
  const origin = env.PM_EMAIL_ALLOWED_ORIGIN;
  const attempts: number[] = [];

  async function send(request: IncomingMessage, response: ServerResponse) {
    if (request.method !== "POST") return respond(response, 405, "method");
    if (!key || !from || !to?.length || !origin) {
      request.resume();
      return respond(response, 503, "unconfigured");
    }
    if (request.headers.origin !== origin || !request.headers["content-type"]?.startsWith("application/json")) {
      request.resume();
      return respond(response, 403, "forbidden");
    }
    const payload = await getBody(request);
    if (!payload || typeof payload !== "object") return respond(response, 400, "invalid");
    const fields = payload as Record<string, unknown>;
    const { priority } = fields;
    const id = shortText(fields.id);
    const template = shortText(fields.template, 120);
    const machine = shortText(fields.machine);
    const date = shortText(fields.date, 10);
    const period = shortText(fields.period, 15);
    const failures = Array.isArray(fields.failures) ? fields.failures.filter((item) => item && typeof item === "object") : [];
    if ((priority !== "high" && priority !== "critical") || !idPattern.test(id) || !template || !machine ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) || !failures.length) {
      return respond(response, 400, "invalid");
    }
    const now = Date.now();
    while (attempts.length && attempts[0] < now - 60_000) attempts.shift();
    if (attempts.length >= 15) return respond(response, 429, "rate_limited");
    attempts.push(now);

    const workOrder = `REQ-PM-${id.toUpperCase()}`;
    const subject = `[FixFlow PM · ${priorityLabels[priority]}] ${workOrder}`;
    const lines = [
      `เครื่องจักร ${machine}`,
      `เช็กชีท ${template}`,
      `รอบตรวจ ${[date, period].filter(Boolean).join(" · ")}`,
      `ใบแจ้งซ่อม ${workOrder}`,
      "",
      ...failures.slice(0, 20).map((item) => `- ${shortText(item.topic)} · ${shortText(item.column)} = ${shortText(item.value)} (เกณฑ์ ${shortText(item.criterion)})`),
      "",
      "ดูผลตรวจทั้งหมดได้ในเมนูแจ้งเตือน PM ของ FixFlow",
    ];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const result = await deliver("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `fixflow-pm/${id}` },
        body: JSON.stringify({ from, to, subject, text: lines.join("\n") }),
        signal: controller.signal,
      });
      return result.ok ? respond(response, 200, "accepted") : respond(response, 502, "failed");
    } finally {
      clearTimeout(timeout);
    }
  }

  const middleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (request.url?.split("?")[0] !== "/api/pm-alert-email") return next();
    void send(request, response).catch(() => respond(response, 502, "failed"));
  };

  return {
    name: "fixflow-pm-alert-email",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
