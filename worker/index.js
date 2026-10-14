const reply = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

async function saveRsvp(request, env) {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) return reply(403, { ok: false });
  if (Number(request.headers.get("content-length") || 0) > 2048) return reply(413, { ok: false });

  let data;
  try { data = await request.json(); } catch { return reply(400, { ok: false }); }
  const name = String(data.full_name || "").trim();
  const contact = String(data.contact || "").trim();
  const alcohol = String(data.alcohol || "");
  const id = String(data.submission_id || "");
  if (!name || name.length > 80 || !contact || contact.length > 120 ||
      !["Yes", "No"].includes(alcohol) || !/^[0-9a-f-]{36}$/i.test(id) || data.website) {
    return reply(400, { ok: false, error: "Invalid RSVP" });
  }

  const endpoint = env.GOOGLE_APPS_SCRIPT_URL;
  if (!endpoint) return reply(503, { ok: false, error: "RSVPs are not connected yet" });
  let upstream;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.hostname !== "script.google.com") throw new Error("Invalid script URL");
    upstream = await fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: JSON.stringify({ full_name: name, contact, alcohol, submission_id: id }),
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) throw new Error(`Script returned ${upstream.status}`);
    const receipt = await upstream.json();
    if (receipt.ok !== true) throw new Error("Script did not confirm the row");
  } catch (error) {
    console.error("RSVP write failed", error);
    return reply(502, { ok: false, error: "RSVP could not be saved" });
  }
  return reply(201, { ok: true });
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/rsvp") {
      if (request.method !== "POST") return reply(405, { ok: false });
      return saveRsvp(request, env);
    }
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
    const asset = ASSETS[pathname];
    if (!asset) return new Response("Not found", { status: 404 });
    const body = asset.binary ? Uint8Array.from(atob(asset.body), char => char.charCodeAt(0)) : asset.body;
    return new Response(request.method === "HEAD" ? null : body, {
      headers: {
        "content-type": asset.type,
        "cache-control": pathname === "/" || pathname === "/index.html" ? "no-cache" : "public, max-age=3600",
      },
    });
  },
};
