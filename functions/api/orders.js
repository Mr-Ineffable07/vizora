import { json, normalizePhone, readJson, requireJsonPost } from "../../lib/cloudflare-checkout.js";

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

  const id = `VZ-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const now = Date.now();
  try {
    await env.DB.prepare(`INSERT INTO orders (id, phone_e164, status, subtotal_rupees, total_rupees, created_at)
      VALUES (?, ?, 'pending', ?, ?, ?)`)
      .bind(id, phone, subtotal, subtotal, now).run();
  } catch (error) {
    console.error("Order record failed", error.message);
    return json({ error: "Could not save this checkout. Please try again." }, 500);
  }

  return json({
    orderId: id,
    phone,
    subtotal,
    total: subtotal,
  }, 201);
}
