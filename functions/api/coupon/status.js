import { couponEligibility, json, normalizePhone, readJson, requireJsonPost } from "../../../lib/cloudflare-checkout.js";

export async function onRequest({ request, env }) {
  if (!requireJsonPost(request)) return json({ error: "Use a same-origin JSON request." }, 405);
  if (!env.DB) return json({ error: "Checkout is not configured yet." }, 503);
  let body;
  try { body = await readJson(request, 1500); } catch { return json({ error: "Invalid request." }, 400); }
  const phone = normalizePhone(body.phone);
  if (!phone) return json({ error: "Enter a valid mobile number." }, 400);
  const eligibility = await couponEligibility(env, phone);
  return json({ phone, eligible: eligibility.eligible, reason: eligibility.reason, code: eligibility.eligible ? "WELCOME777" : null, discountPercent: eligibility.eligible ? 7 : 0 });
}
