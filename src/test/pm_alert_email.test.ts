import type { IncomingMessage, ServerResponse } from "node:http";
import { PassThrough } from "node:stream";
import type { ViteDevServer } from "vite";
import { expect, it, vi } from "vitest";
import { pmAlertEmail } from "../../server/pmAlertEmail";

const origin = "https://localhost:8080";
const id = "b893b25d-40fe-4b5d-a15c-5aa7cc8e4c94";

function createRequest(plugin: ReturnType<typeof pmAlertEmail>) {
  let middleware: (request: IncomingMessage, response: ServerResponse, next: () => void) => void;
  const hook = plugin.configureServer;
  if (typeof hook !== "function") throw new Error("Expected email middleware");
  hook({ middlewares: { use(handler: typeof middleware) { middleware = handler; } } } as unknown as ViteDevServer);
  return (priority: string, requestOrigin = origin) => new Promise<{ code: number; status: string }>((resolve, reject) => {
    const request = Object.assign(new PassThrough(), {
      method: "POST", url: "/api/pm-alert-email",
      headers: { origin: requestOrigin, "content-type": "application/json" },
    });
    let code = 0;
    const response = {
      writeHead(nextCode: number) { code = nextCode; },
      end(body: string) { resolve({ code, ...JSON.parse(body) }); },
    };
    middleware(request as unknown as IncomingMessage, response as ServerResponse, () => reject(new Error("Route not handled")));
    request.end(JSON.stringify({
      id, priority, template: "ตรวจแรงดัน", machine: "A-1001", date: "2026-11-25", period: "10:00",
      failures: [{ topic: "ทางเข้า", column: "แรงดัน", value: "25", criterion: "≤ 20 mbar" }],
    }));
  });
}

it("sends configured urgent cases to fixed recipients with a stable delivery key", async () => {
  const deliver = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("{}", { status: 200 }));
  const post = createRequest(pmAlertEmail({
    PM_EMAIL_API_KEY: "test-key", PM_EMAIL_FROM: "from@example.test", PM_EMAIL_TO: "team@example.test",
    PM_EMAIL_ALLOWED_ORIGIN: origin,
  }, deliver));
  expect(await post("medium")).toEqual({ code: 400, status: "invalid" });
  expect(await post("critical", "https://other.example.test")).toEqual({ code: 403, status: "forbidden" });
  expect(await post("critical")).toEqual({ code: 200, status: "accepted" });
  expect(deliver).toHaveBeenCalledTimes(1);
  const [url, options] = deliver.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(options?.headers).toMatchObject({ "Idempotency-Key": `fixflow-pm/${id}` });
  expect(JSON.parse(String(options?.body))).toMatchObject({ to: ["team@example.test"], text: expect.stringContaining("25") });
});

it("reports email setup separately from an inspection save", async () => {
  expect(await createRequest(pmAlertEmail({}))("high")).toEqual({ code: 503, status: "unconfigured" });
});
