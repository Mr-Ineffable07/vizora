# Cloudflare setup for checkout order records

Checkout collects a mobile number, delivery address, and payment preference in three steps. It does not ask for a password or OTP and completes through WhatsApp. Pages Functions save an order reference and basic price/phone information in D1.

## Bind the existing D1 database

In Cloudflare, open **Workers & Pages → your VIZORA Pages project → Settings → Bindings → Add → D1 database**. Set the variable name to exactly `DB`, select `vizora-orders`, save it for Production, and redeploy. Add the binding to Preview too if you use preview deployments.

The Functions are in the repository's root `/functions` directory. `_routes.json` scopes them to `/api/*`.

## Create the table on a new database

For a new D1 database, run `migrations/0001_orders.sql` in its SQL console.

## Clean the existing database

If you already created the database using the old checkout schema, run `migrations/0002_cleanup_legacy_checkout.sql` once in its SQL console. This removes the obsolete offer table and fields while preserving order references, phone numbers, statuses, and totals.

## Record an order outcome

Every checkout creates a `pending` order and a VIZORA reference in the WhatsApp message. After you complete the order, update its status in D1, replacing the reference:

```sql
UPDATE orders SET status = 'completed' WHERE id = 'VZ-ORDER-REFERENCE';
```

If the customer cancels:

```sql
UPDATE orders SET status = 'cancelled' WHERE id = 'VZ-ORDER-REFERENCE';
```

Name and delivery address are sent to VIZORA in the WhatsApp message and are not stored in D1.
