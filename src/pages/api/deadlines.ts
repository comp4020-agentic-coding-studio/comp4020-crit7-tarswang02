import type { APIRoute } from "astro";
import { addDeadline } from "../../lib/db";
import { bus } from "../../lib/events";

// The write half of the tracker: a plain HTML form POSTs here, the deadline
// goes into SQLite, and the new row is broadcast to every open SSE
// connection. The 303 redirect makes the form work with no client-side
// JavaScript at all — the submitting tab re-renders from the database; every
// *other* tab hears about it over the stream.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const course = String(form.get("course") ?? "").trim();
  const dueAt = String(form.get("dueAt") ?? "").trim();
  const weightRaw = String(form.get("weightPercent") ?? "").trim();
  const weightPercent = weightRaw === "" ? null : Number(weightRaw);

  if (title && course && dueAt) {
    bus.emit(
      "deadline-added",
      addDeadline({ title: title.slice(0, 200), course: course.slice(0, 100), dueAt, weightPercent }),
    );
  }
  return redirect("/", 303);
};
