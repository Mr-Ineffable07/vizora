import { COUPON_CODE, DISCOUNT_PERCENT, couponEligibility, json, normalizePhone, readJson, requireJsonPost } from "../../lib/cloudflare-checkout.js";

export async function onRequest({ request, env }) {
  if (!requireJsonPost(request)) return json({ error: "Use a same-origin JSON request." }, 405);
  if (!env.DB) return json({ error: "Checkout is not configured yet." }, 503);
  let body;
  try { body = await readJson(request, 8000); } catch { return json({ error: "Invalid order request." }, 400); }

  const phone = normalizePhone(body.phone);
  const subtotal = Number(body.subtotal);
  if (!phone) return json({ error: "Enter a valid mobile number." }, 400);
  if (!Number.isSafeInteger(subtotal) || subtotal < 1 || subtotal > 10000000) return json({ error: "Invalid order subtotal." }, 400);
  if (!String(body.name || "").trim() || !String(body.address || "").trim()) return json({ error: "Add your name and delivery address." }, 400);
  if (!["Cash on delivery", "UPI or bank transfer"].includes(body.paymentMethod)) return json({ error: "Choose a payment preference." }, 400);

  const wantsCoupon = String(body.couponCode || "").trim().toUpperCase() === COUPON_CODE;
  const eligibility = wantsCoupon ? await couponEligibility(env, phone) : { eligible: false, reason: "not_requested" };
  const id = `VZ-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const now = Date.now();
  let couponApplied = false;

  if (wantsCoupon && eligibility.eligible) {
    const claim = await env.DB.prepare(`INSERT INTO coupon_claims (phone_e164, order_id, status, created_at)
      VALUES (?, ?, 'reserved', ?)
      ON CONFLICT(phone_e164) DO UPDATE SET order_id = excluded.order_id, status = 'reserved', created_at = excluded.created_at
      WHERE coupon_claims.status = 'released'`)
      .bind(phone, id, now).run();
    couponApplied = Number(claim.meta?.changes || 0) === 1;
  }

  const discount = couponApplied ? Math.round(subtotal * DISCOUNT_PERCENT / 100) : 0;
  try {
    await env.DB.prepare(`INSERT INTO orders (id, phone_e164, status, subtotal_rupees, discount_rupees, total_rupees, coupon_code, created_at)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`)
      .bind(id, phone, subtotal, discount, Math.max(0, subtotal - discount), couponApplied ? COUPON_CODE : null, now).run();
  } catch (error) {
    if (couponApplied) {
      await env.DB.prepare("UPDATE coupon_claims SET status = 'released' WHERE phone_e164 = ? AND order_id = ?")
        .bind(phone, id).run();
    }
    console.error("Order record failed", error.message);
    return json({ error: "Could not save this checkout. Please try again." }, 500);
  }

  return json({
    orderId: id,
    phone,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    couponApplied,
    couponCode: couponApplied ? COUPON_CODE : null,
    discountPercent: couponApplied ? DISCOUNT_PERCENT : 0,
    reason: couponApplied ? "first_order" : eligibility.reason,
  }, 201);
}
