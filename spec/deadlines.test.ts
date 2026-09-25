import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, inject, it } from "vitest";

// This app's own contract, on top of the shared invariants: adding a
// deadline persists across a fresh page load, toggling it done persists
// across a fresh page load, and the SSE stream broadcasts a named
// `deadline-added` event when one is added.
const baseUrl = inject("baseUrl");

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const post = (path: string, body?: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

async function findRowId(title: string): Promise<string> {
  const res = await fetch(baseUrl);
  const dom = new JSDOM(await res.text());
  const row = [...dom.window.document.querySelectorAll("#deadlines li")].find((li) =>
    li.querySelector(".deadline-title")?.textContent?.includes(title),
  );
  if (!row) throw new Error(`no row found for "${title}"`);
  const id = row.getAttribute("data-id");
  if (!id) throw new Error(`row for "${title}" has no data-id`);
  return id;
}

describe("deadline tracker", () => {
  let title: string;

  beforeAll(() => {
    title = `spec probe ${process.hrtime.bigint()}`;
  });

  it("accepts a deadline and redirects back to the page", async () => {
    const res = await post(
      "/api/deadlines",
      new URLSearchParams({ title, course: "COMP4020", dueAt: "2026-09-30", weightPercent: "20" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");
  });

  it("persists the deadline: a fresh page load includes it", async () => {
    const res = await fetch(baseUrl);
    const body = await res.text();
    expect(body).toContain(title);
    expect(body).toContain("COMP4020");
  });

  it("persists a toggle: a fresh page load reflects it as done", async () => {
    const id = await findRowId(title);

    const res = await post(`/api/deadlines/${id}/toggle`);
    expect(res.status).toBe(303);

    const page = await fetch(baseUrl);
    const dom = new JSDOM(await page.text());
    const row = dom.window.document.querySelector(`li[data-id="${id}"]`);
    expect(row?.classList.contains("done")).toBe(true);
  });

  it("broadcasts new deadlines over the SSE stream as a deadline-added event", async () => {
    const live = `live probe ${process.hrtime.bigint()}`;

    // subscribe first, then post, then read until the event arrives
    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    await post(
      "/api/deadlines",
      new URLSearchParams({ title: live, course: "COMP4020", dueAt: "2026-10-01" }),
    );

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes(live)) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before the event arrived");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    expect(received).toContain("event: deadline-added");
    expect(received).toContain(live);
  }, 10_000);
});
