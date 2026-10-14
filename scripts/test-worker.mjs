import assert from "node:assert/strict";
import worker from "../dist-worker/server/index.js";

const origin = "https://nightlist.example";
const homepage = await worker.fetch(new Request(origin), {});
assert.equal(homepage.status, 200);
assert.match(await homepage.text(), /DIWALI NIGHT/);
const qr = await worker.fetch(new Request(`${origin}/assets/location-qr.svg`), {});
assert.equal(qr.status, 200);
assert.match(qr.headers.get("content-type"), /svg/);

const payload = {
  full_name: "Test Guest",
  contact: "@testguest",
  alcohol: "Yes",
  submission_id: "8eeb9c5d-7f78-4d2c-82a0-0f99722a7a41",
};
const request = (body, requestOrigin = origin) => new Request(`${origin}/api/rsvp`, {
  method: "POST",
  headers: { origin: requestOrigin, "content-type": "application/json" },
  body: JSON.stringify(body),
});
assert.equal((await worker.fetch(request({ ...payload, alcohol: "Maybe" }), {})).status, 400);
assert.equal((await worker.fetch(request(payload, "https://other.example"), {})).status, 403);
assert.equal((await worker.fetch(request(payload), {})).status, 503);

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(url.hostname, "script.google.com");
  assert.deepEqual(JSON.parse(options.body), payload);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
try {
  const response = await worker.fetch(request(payload), { GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/example/exec" });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).ok, true);
} finally {
  globalThis.fetch = originalFetch;
}
console.log("Static routes and RSVP proxy checks passed");
