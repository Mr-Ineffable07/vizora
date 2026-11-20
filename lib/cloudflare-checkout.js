export const COUPON_CODE = "WELCOME777";
export const DISCOUNT_PERCENT = 7;

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

export async function couponEligibility(env, phone) {
  const completed = await env.DB.prepare("SELECT 1 AS found FROM orders WHERE phone_e164 = ? AND status = 'completed' LIMIT 1")
    .bind(phone).first();
  if (completed) return { eligible: false, reason: "already_ordered" };
  const claim = await env.DB.prepare("SELECT status FROM coupon_claims WHERE phone_e164 = ?")
    .bind(phone).first();
  if (claim && claim.status !== "released") return { eligible: false, reason: "order_pending" };
  return { eligible: true, reason: "first_order" };
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
