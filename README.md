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

## Checkout order records

Checkout collects a mobile number, address, and payment preference in three steps, then prepares the order in WhatsApp. No password, OTP, or discount code is requested. Cloudflare Pages Functions record the order reference, phone number, status, and total in D1. Follow [`CLOUDFLARE_ORDER_SETUP.md`](CLOUDFLARE_ORDER_SETUP.md) for the database setup and order status steps.

## Preview locally

Run a local web server from this folder, for example with Python:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser. Stop the server with `Ctrl+C` in the terminal.
