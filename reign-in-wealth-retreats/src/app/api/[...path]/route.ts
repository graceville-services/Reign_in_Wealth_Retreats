import { after } from "next/server";
import { handle } from "@/lib/server/api";
import { flushOutbox } from "@/lib/server/email";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function route(request: Request, context: Context) {
  const { path } = await context.params;
  const response = await handle(request, path);
  // Durable messages are queued before response; delivery starts after it, with cron as the retry path.
  if (
    request.method === "POST" &&
    response.ok &&
    !["jobs", "admin/jobs"].includes(path.join("/"))
  )
    after(async () => {
      try {
        await flushOutbox();
      } catch (error) {
        console.error(
          "[email-outbox]",
          error instanceof Error ? error.name : "Delivery error",
        );
      }
    });
  return response;
}
export { route as GET, route as POST, route as PATCH, route as DELETE };
