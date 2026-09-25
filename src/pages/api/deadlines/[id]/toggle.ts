import type { APIRoute } from "astro";
import { toggleDeadlineDone } from "../../../../lib/db";
import { bus } from "../../../../lib/events";

// Same no-JS-required POST+redirect shape as /api/deadlines: flips a single
// deadline's done state and broadcasts the updated row so every other open
// tab can patch its row in place.
export const POST: APIRoute = async ({ params, redirect }) => {
  const id = Number(params.id);
  if (Number.isInteger(id)) {
    const updated = toggleDeadlineDone(id);
    if (updated) bus.emit("deadline-toggled", updated);
  }
  return redirect("/", 303);
};
