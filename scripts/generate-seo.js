/* Run with `node scripts/generate-seo.js` after adding products or changing public page metadata. */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const domain = "https://vizora.online";
const image = `${domain}/images/og-vizora.png`;
const commonFontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="css/style.css"><script src="js/products.js" defer></script><script src="js/main.js" defer></script>`;

const pages = {
  "index.html": {
    title: "Personalised Acrylic Decor & Room Decor in India | VIZORA",
    description: "Shop personalised acrylic decor in India: custom name signs, glowing wall lights, posters, statement mirrors and phone skins made for your space. Order on WhatsApp.",
    url: `${domain}/`,
    ogTitle: "Personalised Acrylic Decor & Room Decor in India | VIZORA",
    ogDescription: "Custom name signs, wall lights, posters, statement mirrors and more—made personal for your space.",
    type: "website",
  },
  "shop.html": {
    title: "Shop Personalised Room Decor, Acrylic Gifts & Lights | VIZORA",
    description: "Shop custom acrylic decor in India, from name signs and wall lamps to posters, anime keychains, statement mirrors and phone skins. Browse the VIZORA collection.",
    url: `${domain}/shop.html`,
    ogTitle: "Shop Personalised Room Decor, Acrylic Gifts & Lights | VIZORA",
    ogDescription: "Browse custom acrylic decor, wall lights, posters, keychains, mirrors and phone skins from VIZORA.",
    type: "website",
  },
  "about.html": {
    title: "About VIZORA | Personalised Acrylic Decor Studio in India",
    description: "Meet VIZORA, an Indian decor studio creating personalised acrylic name signs, room lights, wall art and custom pieces for spaces that feel like you.",
    url: `${domain}/about.html`,
    ogTitle: "About VIZORA | Personalised Acrylic Decor Studio in India",
    ogDescription: "Meet VIZORA, an Indian decor studio creating personalised acrylic pieces for spaces that feel like you.",
    type: "website",
  },
  "contact.html": {
    title: "Contact VIZORA | Custom Acrylic Decor Orders in India",
    description: "Ask VIZORA about custom acrylic decor, personalised name signs, room lights or an existing order. Contact our studio in India on WhatsApp or phone.",
    url: `${domain}/contact.html`,
    ogTitle: "Contact VIZORA | Custom Acrylic Decor Orders in India",
    ogDescription: "Have a custom decor idea or an order question? Start a conversation with VIZORA.",
    type: "website",
  },
  "cart.html": {
    title: "Your Shopping Bag | VIZORA",
    description: "Review your VIZORA decor order, update your shopping bag and continue checkout through WhatsApp.",
    url: `${domain}/cart.html`,
    ogTitle: "Your Shopping Bag | VIZORA",
    ogDescription: "Review the personalised pieces in your VIZORA shopping bag.",
    type: "website",
    robots: "noindex,follow",
  },
  "product.html": {
    title: "Personalised Acrylic Decor & Custom Room Pieces | VIZORA",
    description: "Explore personalised acrylic decor from VIZORA. Choose custom room lights, name signs, posters and thoughtful pieces made for your space in India.",
    url: `${domain}/product.html`,
    ogTitle: "Personalised Acrylic Decor & Custom Room Pieces | VIZORA",
    ogDescription: "Explore VIZORA custom acrylic decor and choose a piece for your space.",
    type: "product",
  },
};

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderHead(page, isHome) {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const ogTitle = escapeHtml(page.ogTitle);
  const ogDescription = escapeHtml(page.ogDescription);
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#08080D"><title>${title}</title><meta name="description" content="${description}">${page.robots ? `<meta name="robots" content="${page.robots}">` : ""}<link rel="canonical" href="${page.url}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta property="og:type" content="${page.type}"><meta property="og:site_name" content="VIZORA"><meta property="og:locale" content="en_IN"><meta property="og:title" content="${ogTitle}"><meta property="og:description" content="${ogDescription}"><meta property="og:url" content="${page.url}"><meta property="og:image" content="${image}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="VIZORA personalised acrylic decor for your room"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${ogTitle}"><meta name="twitter:description" content="${ogDescription}"><meta name="twitter:image" content="${image}">${isHome ? `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"VIZORA","url":"${domain}/","logo":"${domain}/favicon.svg","sameAs":["https://instagram.com/vizora_07"]},{"@type":"WebSite","name":"VIZORA","url":"${domain}/","inLanguage":"en-IN"}]}</script>` : ""}${commonFontLinks}</head>`;
}

for (const [filename, page] of Object.entries(pages)) {
  const file = path.join(root, filename);
  const source = fs.readFileSync(file, "utf8");
  if (!/<head>[\s\S]*?<\/head>/.test(source)) throw new Error(`No head found in ${filename}`);
  fs.writeFileSync(file, source.replace(/<head>[\s\S]*?<\/head>/, renderHead(page, filename === "index.html")), "utf8");
}

global.window = {};
require(path.join(root, "js", "products.js"));
const productIds = window.VIZORA_PRODUCTS.map((product) => product.id);
const urls = [
  `${domain}/`,
  `${domain}/shop.html`,
  `${domain}/about.html`,
  `${domain}/contact.html`,
  ...productIds.map((id) => `${domain}/product.html?id=${encodeURIComponent(id)}`),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), xml, "utf8");
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`, "utf8");
console.log(`Updated metadata for ${Object.keys(pages).length} pages and generated a sitemap with ${urls.length} URLs.`);
