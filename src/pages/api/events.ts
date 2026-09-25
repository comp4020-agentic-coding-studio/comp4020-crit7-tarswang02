import type { APIRoute } from "astro";
import type { Deadline } from "../../lib/db";
import { bus } from "../../lib/events";

// The minimal server-sent-events (SSE) pattern: a long-lived streaming
// response the browser consumes with `new EventSource("/api/events")`.
// SSE is one-directional (server → browser) and plain HTTP, which makes it
// the simplest live channel that works everywhere — reach for WebSockets
// only when the client needs to push over the same connection.
//
// Two named event kinds, not the default unnamed "message": an added
// deadline and a toggled one need different client-side handling (prepend vs
// find-and-patch), and a named `event:` frame is how the browser tells them
// apart.
export const GET: APIRoute = () => {
  let onAdded: (deadline: Deadline) => void;
  let onToggled: (deadline: Deadline) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<string>({
    start(controller) {
      // an opening comment so the client (and the post-deploy CI probe) sees
      // bytes immediately, and a periodic one so proxies don't drop the
      // connection as idle
      controller.enqueue(": connected\n\n");
      heartbeat = setInterval(() => controller.enqueue(": ping\n\n"), 30_000);
      onAdded = (deadline) => {
        controller.enqueue(`event: deadline-added\ndata: ${JSON.stringify(deadline)}\n\n`);
      };
      onToggled = (deadline) => {
        controller.enqueue(`event: deadline-toggled\ndata: ${JSON.stringify(deadline)}\n\n`);
      };
      bus.on("deadline-added", onAdded);
      bus.on("deadline-toggled", onToggled);
    },
    cancel() {
      clearInterval(heartbeat);
      bus.off("deadline-added", onAdded);
      bus.off("deadline-toggled", onToggled);
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
