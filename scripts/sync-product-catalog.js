const fs = require("node:fs");
const vm = require("node:vm");
const context = { window: {} };

vm.runInNewContext(fs.readFileSync("js/products.js", "utf8"), context);
const catalog = context.window.VIZORA_PRODUCTS.map((product) => ({
  id: String(product.id),
  name: product.name,
  price: product.price,
  variants: (product.variants || []).map((variant) => ({
    id: String(variant.id),
    label: variant.label,
    price: variant.price,
  })),
}));
const output = `// Generated from js/products.js. Run ` + "`node scripts/sync-product-catalog.js`" + ` after price or variant changes.\nexport const PRODUCT_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
fs.writeFileSync("lib/product-catalog.js", output);
