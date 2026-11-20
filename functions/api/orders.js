import { json, normalizePhone, readJson, requireJsonPost } from "../../lib/cloudflare-checkout.js";
import { PRODUCT_CATALOG } from "../../lib/product-catalog.js";

const productsById = new Map(PRODUCT_CATALOG.map((product) => [product.id, product]));

export async function onRequest({ request, env }) {
  if (!requireJsonPost(request)) return json({ error: "Use a same-origin JSON request." }, 405);
  if (!env.DB) return json({ error: "Checkout is not configured yet." }, 503);
  let body;
  try { body = await readJson(request, 8000); } catch { return json({ error: "Invalid order request." }, 400); }

  const phone = normalizePhone(body.phone);
  if (!phone) return json({ error: "Enter a valid mobile number." }, 400);
  if (!String(body.name || "").trim() || !String(body.address || "").trim()) return json({ error: "Add your name and delivery address." }, 400);
  if (!["Cash on delivery", "UPI or bank transfer"].includes(body.paymentMethod)) return json({ error: "Choose a payment preference." }, 400);
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return json({ error: "Your bag is empty or has too many items." }, 400);

  const items = [];
  let subtotal = 0;
  for (const requested of body.items) {
    const product = productsById.get(String(requested?.id || ""));
    const quantity = Number(requested?.quantity);
    if (!product || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
      return json({ error: "One of the products in your bag is invalid. Refresh your bag and try again." }, 400);
    }
    const variantId = requested?.variantId ? String(requested.variantId) : "";
    const variant = variantId ? (product.variants || []).find((item) => item.id === variantId) : null;
    if (variantId && !variant) return json({ error: "A selected product option is invalid. Refresh your bag and try again." }, 400);
    const unitPrice = variant?.price ?? product.price;
    const lineTotal = unitPrice * quantity;
    if (!Number.isSafeInteger(lineTotal)) return json({ error: "The order total is invalid." }, 400);
    subtotal += lineTotal;
    items.push({
      id: product.id,
      name: product.name,
      variantId: variant?.id || null,
      variantLabel: variant?.label || "",
      quantity,
      unitPrice,
      lineTotal,
      note: String(requested?.note || "").trim().slice(0, 60),
    });
  }
  if (!Number.isSafeInteger(subtotal) || subtotal < 1 || subtotal > 10000000) return json({ error: "The order total is outside the allowed range." }, 400);

  const id = `VZ-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const now = Date.now();
  const savedItems = JSON.stringify(items.map(({ id: productId, name, variantId: optionId, variantLabel, quantity, unitPrice, lineTotal }) => ({
    id: productId, name, variantId: optionId, variantLabel, quantity, unitPrice, lineTotal,
  })));
  try {
    try {
      await env.DB.prepare(`INSERT INTO orders (id, phone_e164, status, subtotal_rupees, total_rupees, items_json, created_at)
        VALUES (?, ?, 'pending', ?, ?, ?, ?)`)
        .bind(id, phone, subtotal, subtotal, savedItems, now).run();
    } catch (error) {
      if (!/(?:no such column|no column named).*items_json/i.test(error.message || "")) throw error;
      await env.DB.prepare(`INSERT INTO orders (id, phone_e164, status, subtotal_rupees, total_rupees, created_at)
        VALUES (?, ?, 'pending', ?, ?, ?)`)
        .bind(id, phone, subtotal, subtotal, now).run();
    }
  } catch (error) {
    console.error("Order record failed", error.message);
    return json({ error: "Could not save this checkout. Please try again." }, 500);
  }

  return json({
    orderId: id,
    phone,
    subtotal,
    total: subtotal,
    items,
  }, 201);
}
