# VIZORA

VIZORA is a static storefront for personalised acrylic decor. It is built with plain HTML, CSS, and JavaScript, with product images and a short hero video stored in the project.

## Pages

- `index.html` — homepage
- `shop.html` — product catalogue
- `product.html` — product details
- `about.html` — studio story
- `contact.html` — contact details
- `cart.html` — cart and checkout information

## Project files

- `css/` — shared styles
- `js/` — product data and storefront interactions
- `images/` — product photos, illustrations, and icons
- `videos/` — homepage hero video
- `reviews.json` — customer reviews data (starts empty)

## First-order coupon checkout

Checkout collects a mobile number, address, and payment preference in three steps, then prepares the order in WhatsApp. No password or OTP is requested. `WELCOME777` eligibility is checked against completed orders through Cloudflare Pages Functions and D1. Before enabling it on the live site, follow [`CLOUDFLARE_COUPON_SETUP.md`](CLOUDFLARE_COUPON_SETUP.md) to create and bind the D1 database as `DB`. Since the phone number is not verified, customers can enter another number to claim the first-order offer again.

## Preview locally

Run a local web server from this folder, for example with Python:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser. Stop the server with `Ctrl+C` in the terminal.
