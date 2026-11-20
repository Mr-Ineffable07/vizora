export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

export function normalizePhone(value) {
  let phone = String(value || "").trim().replace(/[\s()-]/g, "");
  if (/^\d{10}$/.test(phone)) phone = `+91${phone}`;
  else if (/^0\d{10}$/.test(phone)) phone = `+91${phone.slice(1)}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  return phone;
}

export function requireJsonPost(request) {
  return request.method === "POST" && sameOrigin(request) &&
    (request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json");
}

export async function readJson(request, maxBytes = 12000) {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error("request_too_large");
  try { return JSON.parse(raw); } catch { throw new Error("invalid_json"); }
}
