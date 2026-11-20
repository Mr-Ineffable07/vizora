# Cloudflare setup for phone-only checkout and first-order coupon

Checkout has three steps: mobile number, delivery address, and payment preference. It does not ask for a password or OTP. Orders are completed with the existing WhatsApp flow. `WELCOME777` gives 7% off the product subtotal for a first order, based on the mobile number entered.

**Without OTP, the number is not verified.** A customer can enter a different number and may receive the first-order offer again. D1 prevents repeat claims for the same number; it cannot establish who owns that number.

## 1. Create the D1 database

In Cloudflare, open **Storage & databases → D1 SQL Database**, create a database (for example, `vizora-orders`), and run `migrations/0001_welcome_coupon.sql` in the database's SQL console.

## 2. Bind the database to Pages

Open **Workers & Pages → your VIZORA Pages project → Settings → Bindings → Add → D1 database**. Set the variable name to exactly `DB`, select the database, and save. Add the binding to production and to Preview if you use preview deployments. Redeploy after configuring the binding.

Cloudflare Pages Functions use the repository's `/functions` directory. `_routes.json` scopes them to `/api/*`. No SMS provider or Twilio secrets are needed for this phone-only flow.

## 3. Deploy and check the checkout

Deploy the repository through the Pages Git integration or Wrangler. On the deployed site, add an item, enter a 10-digit Indian mobile number, and continue through address and payment. The server checks coupon eligibility and records a pending order before opening WhatsApp. If D1 is not bound, the server returns a setup error and checkout cannot proceed.

## 4. Record the outcome of WhatsApp orders

Each submitted order has a VIZORA reference. Its D1 row starts as `pending`; a first-order coupon reservation prevents another reservation for that same number. After confirming and completing the order, run these statements in D1, replacing the reference:

```sql
UPDATE orders SET status = 'completed' WHERE id = 'VZ-ORDER-REFERENCE';
UPDATE coupon_claims SET status = 'completed' WHERE order_id = 'VZ-ORDER-REFERENCE';
```

If the customer cancels, release the coupon claim:

```sql
UPDATE orders SET status = 'cancelled' WHERE id = 'VZ-ORDER-REFERENCE';
UPDATE coupon_claims SET status = 'released' WHERE order_id = 'VZ-ORDER-REFERENCE';
```

To exclude customers who bought before launch, import their numbers into `orders` with `completed` status before enabling the offer. Store numbers in E.164 format (`+91` followed by the 10-digit Indian number):

```sql
INSERT INTO orders (id, phone_e164, status, subtotal_rupees, discount_rupees, total_rupees, coupon_code, created_at)
VALUES ('legacy-919876543210', '+919876543210', 'completed', 0, 0, 0, NULL, 0);
```

The integration stores the phone number, order reference, status, and price summary in D1. Name and delivery address are sent to VIZORA in the WhatsApp order message.
