/* VIZORA store interactions: navigation, product cards, product details, and cart. */
(function () {
  "use strict";

  const CART_KEY = "vizora-cart-v2";
  const WHATSAPP_NUMBER = "919356161337"; // India country code + the store WhatsApp number.
  const INSTAGRAM_URL = "https://instagram.com/vizora_07";
  const INSTAGRAM_TILES = [
    { image: "images/desk-butterfly-shadow-lamp.jpeg", alt: "Warm butterfly shadow lamp on a wooden desk" },
    { image: "images/statement-mirror-diet-coke.jpeg", alt: "Diet Coke inspired statement mirror" },
    { image: "images/wall-art-geometric-bow.jpeg", alt: "Black geometric bow wall art" },
    { image: "images/avengers-iron-man-hero.jpeg", alt: "Iron Man artwork in a black and white collage" },
    { image: "images/keychain-rengoku-trio.jpeg", alt: "Anime acrylic keychains displayed together" },
    { image: "images/phone-skin-23.jpeg", alt: "Decorative phone skin design" }
  ];
  const currency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  const products = window.VIZORA_PRODUCTS || [];

  function setHeadValue(selector, value, attribute = "content") {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement(selector.startsWith("meta") ? "meta" : "link");
      const name = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
      if (name) element.setAttribute(name[1], name[2]);
      document.head.appendChild(element);
    }
    element.setAttribute(attribute, value);
  }

  function updateProductMetadata(product, variant = null) {
    const productName = variant ? `${product.name} - ${variant.label}` : product.name;
    const displayDescription = `${product.short} ${product.description}`.replace(/\s+/g, " ").trim();
    const description = displayDescription.length > 158 ? `${displayDescription.slice(0, 155).trimEnd()}…` : displayDescription;
    const title = `${productName} | Personalised acrylic decor in India | VIZORA`;
    const image = new URL(variant?.image || product.image, window.location.href).href;
    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.set("id", product.id);
    if (variant) pageUrl.searchParams.set("variant", variant.id);
    else pageUrl.searchParams.delete("variant");
    const price = variant?.price ?? product.price;

    document.title = title;
    setHeadValue('meta[name="description"]', description);
    setHeadValue('link[rel="canonical"]', pageUrl.href, "href");
    setHeadValue('meta[property="og:type"]', "product");
    setHeadValue('meta[property="og:title"]', title);
    setHeadValue('meta[property="og:description"]', description);
    setHeadValue('meta[property="og:url"]', pageUrl.href);
    setHeadValue('meta[property="og:image"]', image);
    setHeadValue('meta[property="og:image:type"]', image.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
    setHeadValue('meta[property="og:image:alt"]', product.imageAlt || product.name);
    document.querySelector('meta[property="og:image:width"]')?.remove();
    document.querySelector('meta[property="og:image:height"]')?.remove();
    setHeadValue('meta[name="twitter:title"]', title);
    setHeadValue('meta[name="twitter:description"]', description);
    setHeadValue('meta[name="twitter:image"]', image);
    setHeadValue('meta[property="product:price:amount"]', String(price));
    setHeadValue('meta[property="product:price:currency"]', "INR");

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${pageUrl.href}#product`,
      name: productName,
      description: product.description,
      image: [image],
      sku: variant ? `${product.id}-${variant.id}` : product.id,
      brand: { "@type": "Brand", name: "VIZORA" },
      category: product.category,
      offers: {
        "@type": "Offer",
        url: pageUrl.href,
        priceCurrency: "INR",
        price,
      },
    };
    let schema = document.querySelector("#product-jsonld");
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "product-jsonld";
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(structuredData);
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (error) { return []; }
  }
  function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
  function productById(id) { return products.find((product) => product.id === String(id)); }
  function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => { element.textContent = count; });
  }
  function productCard(product) {
    return `<article class="product-card" data-category="${product.categoryId}" data-image-layout="${product.imageLayout || "portrait"}"><a class="product-image-wrap" href="product.html?id=${encodeURIComponent(product.id)}"><span class="product-badge">${product.badge}</span><img src="${product.image}" alt="${product.imageAlt}" loading="lazy" decoding="async"><span class="quick-view" aria-hidden="true">View piece ↗</span></a><div class="product-card-info"><div><p class="product-category">${product.category}</p><h3><a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3><p class="product-short">${product.short}</p></div><p class="product-price">${currency(product.price)}${product.compareAt ? `<del>${currency(product.compareAt)}</del>` : ""}</p></div><button class="add-button" type="button" data-add-to-cart="${product.id}">Add to bag <span aria-hidden="true">＋</span></button></article>`;
  }
  function renderCards(container, list) {
    if (!container) return;
    container.classList.toggle("is-single-item", list.length === 1);
    container.classList.toggle("is-compact-collection", list.length > 0 && list.length <= 2);
    container.innerHTML = list.map(productCard).join("");
    container.querySelectorAll("[data-add-to-cart]").forEach((button) => button.addEventListener("click", () => addToCart(button.dataset.addToCart, button)));
  }
  function addToCart(id, button, note = "", variant = null) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === String(id) && (item.note || "") === note && (item.variantId || "") === (variant?.id || ""));
    if (existing) existing.quantity += 1;
    else {
      const item = { id: String(id), quantity: 1, note };
      if (variant) {
        item.variantId = variant.id;
        item.variantLabel = variant.label;
        item.variantPrice = variant.price;
        item.variantImage = variant.image;
      }
      cart.push(item);
    }
    saveCart(cart);
    const original = button.innerHTML;
    button.innerHTML = "Added to your bag <span aria-hidden=\"true\">✓</span>";
    button.classList.add("is-added");
    window.setTimeout(() => { button.innerHTML = original; button.classList.remove("is-added"); }, 1400);
  }
  function renderHomeCategories() {
    const container = document.querySelector("#home-categories");
    if (!container) return;
    const categories = window.VIZORA_CATEGORIES || [];
    container.innerHTML = categories.map((category) => `<a class="category-card" data-category="${category.id}" href="shop.html?category=${encodeURIComponent(category.id)}" aria-label="Shop ${category.name}"><span class="category-card-image"><img src="${category.image}" alt="${category.imageAlt}" loading="lazy" decoding="async"></span><span class="category-card-name">${category.name}<span aria-hidden="true">↗</span></span></a>`).join("");
  }
  function renderInstagramTiles() {
    const grid = document.querySelector("#instagram-grid");
    if (!grid) return;
    const icon = '<svg class="instagram-icon instagram-tile-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5.2"></rect><circle cx="12" cy="12" r="4"></circle><circle class="instagram-icon-dot" cx="17.7" cy="6.4" r="1"></circle></svg>';
    grid.innerHTML = INSTAGRAM_TILES.map((tile) => `<a class="instagram-tile" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="Vizora on Instagram"><img src="${tile.image}" alt="${tile.alt}" loading="lazy" decoding="async">${icon}</a>`).join("");
  }
  function setupFollowReveal() {
    const section = document.querySelector(".follow-along-reveal");
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    section.classList.add("is-pending");
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        section.classList.add("is-visible");
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(section);
  }
  async function loadHomeReviews() {
    const carousel = document.querySelector("#reviews-carousel");
    const track = document.querySelector("#reviews-track");
    if (!carousel || !track) return;
    try {
      const response = await fetch("reviews.json", { cache: "no-cache" });
      if (!response.ok) return;
      const reviews = await response.json();
      if (!Array.isArray(reviews)) return;
      const allowedSources = { whatsapp: "WhatsApp", instagram: "Instagram", form: "Website" };
      const validReviews = reviews.filter((review) => review && typeof review.id === "string" && typeof review.name === "string" && review.name.trim() && typeof review.product === "string" && review.product.trim() && typeof review.text === "string" && review.text.trim() && allowedSources[review.source] && typeof review.date === "string" && !Number.isNaN(Date.parse(review.date)));
      if (!validReviews.length) return;
      track.innerHTML = validReviews.map((review) => {
        const photo = typeof review.photo === "string" && review.photo.trim() ? `<img class="review-photo" src="${escapeHtml(review.photo)}" alt="${escapeHtml(review.name)} with their ${escapeHtml(review.product)}" loading="lazy" decoding="async">` : "";
        const city = typeof review.city === "string" && review.city.trim() ? `<span>${escapeHtml(review.city)}</span>` : "";
        const formattedDate = new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(review.date));
        return `<article class="review-card">${photo}<div class="review-card-meta"><p class="review-customer">${escapeHtml(review.name)}${city ? ` <span aria-hidden="true">·</span> ${city}` : ""}</p><time datetime="${escapeHtml(review.date)}">${formattedDate}</time></div><p class="review-card-text">${escapeHtml(review.text)}</p><div class="review-card-footer"><span>${escapeHtml(review.product)}</span><span>Shared via ${allowedSources[review.source]}</span></div></article>`;
      }).join("");
      carousel.hidden = false;
      carousel.querySelectorAll("[data-review-scroll]").forEach((button) => button.addEventListener("click", () => {
        const direction = button.dataset.reviewScroll === "next" ? 1 : -1;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        track.scrollBy({ left: direction * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
      }));
    } catch (error) {
      // Keep the reviews carousel absent when its data file is unavailable or invalid.
    }
  }
  function renderShop() {
    const container = document.querySelector("#shop-products");
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const categories = window.VIZORA_CATEGORIES || [];
    const requestedCategory = params.get("category");
    let activeFilter = categories.some((category) => category.id === requestedCategory) ? requestedCategory : "all";
    const requestedSubcategory = params.get("subcategory");
    const activeCategoryAtLoad = categories.find((category) => category.id === activeFilter);
    let activeSubcategory = activeCategoryAtLoad?.subcategories?.some((subcategory) => subcategory.id === requestedSubcategory) ? requestedSubcategory : "";
    let sort = "featured";
    const count = document.querySelector("#product-count");
    const empty = document.querySelector("#empty-products");
    const filterBox = document.querySelector("#product-filters");
    filterBox.innerHTML = `<button class="filter-chip active" data-filter="all" type="button">All pieces</button>${categories.map((category) => `<button class="filter-chip" data-filter="${category.id}" type="button">${category.name}</button>`).join("")}<div class="poster-subfilters" id="poster-subfilters"></div>`;
    const subfilterBox = filterBox.querySelector("#poster-subfilters");
    function renderSubcategoryFilters() {
      const selectedCategory = categories.find((category) => category.id === activeFilter);
      const subcategories = selectedCategory?.subcategories || [];
      if (!subcategories.length) { subfilterBox.innerHTML = ""; subfilterBox.hidden = true; return; }
      subfilterBox.innerHTML = `<p class="poster-subfilter-label">${selectedCategory.name} types</p><button class="filter-chip ${activeSubcategory ? "" : "active"}" data-subfilter="" type="button">All ${selectedCategory.name.toLowerCase()}</button>${subcategories.map((subcategory) => `<button class="filter-chip ${activeSubcategory === subcategory.id ? "active" : ""}" data-subfilter="${subcategory.id}" type="button">${subcategory.name}</button>`).join("")}`;
      subfilterBox.hidden = false;
      filterBox.querySelector(`[data-filter="${activeFilter}"]`)?.after(subfilterBox);
      subfilterBox.querySelectorAll("[data-subfilter]").forEach((button) => button.addEventListener("click", () => {
        activeSubcategory = button.dataset.subfilter;
        subfilterBox.querySelectorAll("[data-subfilter]").forEach((chip) => chip.classList.toggle("active", chip === button));
        refresh();
      }));
    }
    function refresh() {
      const activeCategory = categories.find((category) => category.id === activeFilter);
      const activeSubcategoryData = activeCategory?.subcategories?.find((subcategory) => subcategory.id === activeSubcategory);
      let list = activeFilter === "all" ? [...products] : products.filter((product) => product.categoryId === activeFilter);
      if (activeSubcategory) list = list.filter((product) => product.subcategoryId === activeSubcategory);
      if (sort === "low") list.sort((a, b) => a.price - b.price);
      if (sort === "high") list.sort((a, b) => b.price - a.price);
      if (activeFilter === "posters" && !activeSubcategory) {
        container.classList.remove("is-single-item", "is-compact-collection");
        container.innerHTML = (activeCategory.subcategories || []).map((subcategory) => `<section class="poster-view-group"><header class="poster-view-group-heading"><p class="eyebrow">POSTER COLLECTION</p><h2>${subcategory.name}</h2></header><div class="product-grid poster-view-group-grid" data-poster-group="${subcategory.id}"></div></section>`).join("");
        container.querySelectorAll("[data-poster-group]").forEach((group) => {
          const groupProducts = list.filter((product) => product.subcategoryId === group.dataset.posterGroup);
          renderCards(group, groupProducts);
        });
      } else {
        renderCards(container, list);
      }
        count.textContent = activeSubcategoryData ? `${list.length} ${activeSubcategoryData.name.toLowerCase()} posters` : activeFilter === "posters" ? `${list.length} posters across Cars, Anime and Avengers` : `${list.length} thoughtful pieces`;
      if (activeFilter !== "all") {
        const collectionName = activeSubcategoryData?.name.toLowerCase() || activeCategory?.name.toLowerCase() || "products";
        empty.innerHTML = `No ${escapeHtml(collectionName)} are listed yet. <a href="contact.html">Ask us about a custom piece.</a>`;
      } else {
        empty.innerHTML = `No pieces in this collection yet. <a href="contact.html">Tell us what you’re looking for.</a>`;
      }
      empty.hidden = list.length > 0;
    }
    filterBox.querySelectorAll("[data-filter]").forEach((chip) => chip.classList.toggle("active", chip.dataset.filter === activeFilter));
    filterBox.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      activeSubcategory = "";
      filterBox.querySelectorAll("[data-filter]").forEach((chip) => chip.classList.toggle("active", chip === button));
      renderSubcategoryFilters();
      refresh();
    }));
    renderSubcategoryFilters();
    document.querySelector("#sort-products").addEventListener("change", (event) => { sort = event.target.value; refresh(); });
    refresh();
  }  function renderProductDetail() {
    const container = document.querySelector("#product-detail");
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const product = productById(params.get("id"));
    if (!product) {
      document.title = "Piece not found — VIZORA";
      container.innerHTML = `<p class="eyebrow">A LITTLE DETOUR</p><h1>This piece has <em>moved on.</em></h1><p>Let’s take you back to the pieces still waiting to be yours.</p><a class="button button-dark" href="shop.html">Explore the collection <span aria-hidden="true">↗</span></a>`;
      return;
    }
    const variants = product.variants || [];
    let selectedVariant = variants.find((variant) => variant.id === params.get("variant")) || variants[0] || null;
    const displayImage = selectedVariant?.image || product.image;
    const displayAlt = selectedVariant?.imageAlt || product.imageAlt;
    const displayPrice = selectedVariant?.price ?? product.price;
    updateProductMetadata(product, selectedVariant);
    const variantOptions = variants.map((variant) => `<button class="variant-option ${variant.id === selectedVariant?.id ? "is-selected" : ""}" type="button" data-variant-select="${variant.id}" aria-pressed="${variant.id === selectedVariant?.id}">${variant.label}</button>`).join("");
    const thumbnails = variants.map((variant) => `<button class="detail-thumbnail ${variant.id === selectedVariant?.id ? "is-active" : ""}" type="button" data-variant-thumb="${variant.id}" aria-label="Show ${variant.label} image" aria-pressed="${variant.id === selectedVariant?.id}"><img src="${variant.image}" alt="${variant.imageAlt}" loading="lazy" decoding="async"><span>${variant.label}</span></button>`).join("");
    container.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>›</span><a href="shop.html">Shop</a><span>›</span><span>${product.name}</span></nav><div class="detail-layout"><div class="detail-gallery"><div class="detail-image ${product.categoryId === "posters" ? "detail-posters" : ""} ${product.imageLayout === "landscape" ? "detail-landscape" : ""} ${variants.length ? "detail-variants" : ""}"><img id="detail-main-image" src="${displayImage}" alt="${displayAlt}" decoding="async" fetchpriority="high"></div>${variants.length ? `<div class="detail-thumbnails" role="group" aria-label="Product image formats">${thumbnails}</div>` : ""}</div><div class="detail-copy"><p class="eyebrow">${product.badge}</p><p class="product-category">${product.category}</p><h1>${product.name}</h1><p class="detail-price"><span id="selected-product-price">${currency(displayPrice)}</span>${product.compareAt && !variants.length ? `<del>${currency(product.compareAt)}</del>` : ""}</p>${variants.length ? `<div class="variant-picker"><p>Choose a format</p><div class="variant-options" role="group" aria-label="Choose a format">${variantOptions}</div></div>` : ""}<p class="detail-short">${product.short}</p><p class="detail-description">${product.description}</p><label for="personalise-note">Make it yours <span>(optional)</span></label><input id="personalise-note" class="personalise-input" type="text" maxlength="60" placeholder="Name or short message"><p class="custom-note">We’ll confirm your personalisation over WhatsApp before we make it.</p><button class="button button-dark button-full" type="button" data-detail-add="${product.id}">Add to bag <span aria-hidden="true">＋</span></button><a class="instagram-product-link" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="Vizora on Instagram"><svg class="instagram-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5.2"></rect><circle cx="12" cy="12" r="4"></circle><circle class="instagram-icon-dot" cx="17.7" cy="6.4" r="1"></circle></svg><span>See more on Instagram</span></a><button class="wall-preview-trigger" id="try-wall-preview" type="button"><svg class="wall-preview-button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h3l1.4-2h7.2l1.4 2h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z"/><circle cx="12" cy="13.5" r="3.5"/></svg><span class="wall-preview-button-copy"><strong>Try it on your wall</strong><small>Live camera preview · drag · resize</small></span><span class="wall-preview-button-arrow" aria-hidden="true">↗</span></button><div class="delivery-points"><p>✳ Made personal, just for you</p><p>✳ COD and UPI options available</p><p>✳ Shipping details confirmed on WhatsApp</p></div></div></div><section class="detail-footnote"><p class="eyebrow">A LITTLE MORE YOU, IN EVERY CORNER</p><h2>Made for your <em>kind of space.</em></h2><a class="text-link" href="shop.html">Back to the collection <span aria-hidden="true">→</span></a></section><dialog class="wall-preview-dialog" id="wall-preview-dialog" aria-labelledby="wall-preview-title"><div class="wall-preview-inner"><header class="wall-preview-header"><div><p class="eyebrow">LIVE ROOM PREVIEW</p><h2 id="wall-preview-title">See it on your wall.</h2></div><button class="wall-preview-close" type="button" aria-label="Close wall preview">×</button></header><p class="wall-preview-intro">Allow camera access to preview this piece in your space. Your camera stays on this device; we don’t record or upload video.</p><div class="wall-preview-stage" id="wall-preview-stage"><video class="wall-preview-video" id="wall-preview-video" autoplay muted playsinline></video><div class="wall-preview-guide" aria-hidden="true"><span>WALL PREVIEW</span><i></i></div><img class="wall-preview-art" id="wall-preview-art" src="${displayImage}" alt="${product.name} ${selectedVariant?.label || ""} positioned on your wall" draggable="false" loading="lazy" decoding="async"></div><p class="wall-preview-status" id="wall-preview-status" role="status">Requesting camera access…</p><div class="wall-preview-controls"><label for="wall-preview-size"><span>Preview size</span><output id="wall-preview-size-value" for="wall-preview-size">38%</output><input id="wall-preview-size" type="range" min="20" max="74" value="38"></label><label for="wall-preview-angle"><span>3D wall angle</span><output id="wall-preview-angle-value" for="wall-preview-angle">0°</output><input id="wall-preview-angle" type="range" min="-28" max="28" value="0"></label></div><p class="wall-preview-hint">Drag the piece to place it. Use the sliders to adjust size and angle.</p></div></dialog>`;

    const mainImage = container.querySelector("#detail-main-image");
    const priceElement = container.querySelector("#selected-product-price");
    const previewArtwork = container.querySelector("#wall-preview-art");
    function chooseVariant(variant, updateUrl = true) {
      selectedVariant = variant;
      priceElement.textContent = currency(variant.price);
      container.querySelectorAll("[data-variant-select]").forEach((button) => {
        const active = button.dataset.variantSelect === variant.id;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-pressed", String(active));
      });
      container.querySelectorAll("[data-variant-thumb]").forEach((button) => {
        const active = button.dataset.variantThumb === variant.id;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      mainImage.classList.add("is-switching");
      const nextImage = new Image();
      nextImage.onload = () => {
        mainImage.src = variant.image;
        mainImage.alt = variant.imageAlt;
        requestAnimationFrame(() => mainImage.classList.remove("is-switching"));
      };
      nextImage.onerror = () => mainImage.classList.remove("is-switching");
      nextImage.src = variant.image;
      previewArtwork.src = variant.image;
      previewArtwork.alt = `${product.name} ${variant.label} positioned on your wall`;
      if (updateUrl) {
        const nextParams = new URLSearchParams(window.location.search);
        nextParams.set("id", product.id);
        nextParams.set("variant", variant.id);
        window.history.replaceState({}, "", `${window.location.pathname}?${nextParams.toString()}`);
      }
      updateProductMetadata(product, variant);
    }
    if (variants.length) {
      container.querySelectorAll("[data-variant-select]").forEach((button) => button.addEventListener("click", () => {
        const variant = variants.find((item) => item.id === button.dataset.variantSelect);
        if (variant) chooseVariant(variant);
      }));
      container.querySelectorAll("[data-variant-thumb]").forEach((button) => button.addEventListener("click", () => {
        const variant = variants.find((item) => item.id === button.dataset.variantThumb);
        if (variant) chooseVariant(variant);
      }));
      chooseVariant(selectedVariant);
    }
    container.querySelector("[data-detail-add]").addEventListener("click", (event) => {
      const note = container.querySelector("#personalise-note").value.trim();
      addToCart(product.id, event.currentTarget, note, selectedVariant);
    });
    initializeWallPreview();
  }  function initializeWallPreview() {
    const dialog = document.querySelector("#wall-preview-dialog");
    const trigger = document.querySelector("#try-wall-preview");
    const closeButton = dialog.querySelector(".wall-preview-close");
    const video = dialog.querySelector("#wall-preview-video");
    const stage = dialog.querySelector("#wall-preview-stage");
    const artwork = dialog.querySelector("#wall-preview-art");
    const status = dialog.querySelector("#wall-preview-status");
    const size = dialog.querySelector("#wall-preview-size");
    const sizeValue = dialog.querySelector("#wall-preview-size-value");
    const angle = dialog.querySelector("#wall-preview-angle");
    const angleValue = dialog.querySelector("#wall-preview-angle-value");
    let cameraStream = null;
    let dragState = null;
    let position = { x: 50, y: 50 };

    function applyPreviewTransform() {
      artwork.style.width = `${size.value}%`;
      artwork.style.left = `${position.x}%`;
      artwork.style.top = `${position.y}%`;
      artwork.style.setProperty("--wall-angle", `${angle.value}deg`);
      sizeValue.value = `${size.value}%`;
      sizeValue.textContent = `${size.value}%`;
      angleValue.value = `${angle.value}°`;
      angleValue.textContent = `${angle.value}°`;
    }
    function stopCamera() {
      if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
      video.pause();
      video.srcObject = null;
      stage.classList.remove("is-live");
    }
    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status.textContent = "Camera preview needs a secure page. Open the published HTTPS site or use localhost.";
        return;
      }
      status.textContent = "Waiting for camera permission…";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false
        });
        if (!dialog.open) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStream = stream;
        video.srcObject = stream;
        await video.play();
        stage.classList.add("is-live");
        status.textContent = "Camera is on. Drag the piece and adjust its size and wall angle.";
      } catch (error) {
        stopCamera();
        status.textContent = error.name === "NotAllowedError"
          ? "Camera access was blocked. Allow camera access in your browser, then try again."
          : "No camera could be opened. Check your camera connection and browser permissions.";
      }
    }

    trigger.addEventListener("click", () => {
      position = { x: 50, y: 50 };
      size.value = "38";
      angle.value = "0";
      applyPreviewTransform();
      status.textContent = "Requesting camera access…";
      dialog.showModal();
      startCamera();
    });
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", stopCamera);
    dialog.addEventListener("cancel", stopCamera);
    window.addEventListener("pagehide", stopCamera, { once: true });
    size.addEventListener("input", applyPreviewTransform);
    angle.addEventListener("input", applyPreviewTransform);

    artwork.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      artwork.setPointerCapture(event.pointerId);
      dragState = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, start: { ...position } };
      artwork.classList.add("is-dragging");
    });
    artwork.addEventListener("pointermove", (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const bounds = stage.getBoundingClientRect();
      const dx = (event.clientX - dragState.x) / bounds.width * 100;
      const dy = (event.clientY - dragState.y) / bounds.height * 100;
      const edge = Number(size.value) / 2;
      position.x = Math.max(edge, Math.min(100 - edge, dragState.start.x + dx));
      position.y = Math.max(8, Math.min(92, dragState.start.y + dy));
      applyPreviewTransform();
    });
    function endDrag(event) {
      if (dragState && event.pointerId === dragState.pointerId) {
        dragState = null;
        artwork.classList.remove("is-dragging");
      }
    }
    artwork.addEventListener("pointerup", endDrag);
    artwork.addEventListener("pointercancel", endDrag);
    artwork.addEventListener("lostpointercapture", endDrag);
    applyPreviewTransform();
  }
  function renderCart() {
    const container = document.querySelector("#cart-items");
    if (!container) return;
    const empty = document.querySelector("#cart-empty");
    const panel = document.querySelector("#checkout-panel");
    function refresh() {
      const cart = getCart();
      const validItems = cart.map((item, index) => ({ ...item, index, product: productById(item.id) })).filter((item) => item.product);
      const total = validItems.reduce((sum, item) => sum + (item.variantPrice ?? item.product.price) * item.quantity, 0);
      document.querySelector("#cart-total").textContent = currency(total);
      empty.hidden = validItems.length > 0;
      panel.hidden = validItems.length === 0;
      container.innerHTML = validItems.map(({ product, quantity, index, note, variantLabel, variantPrice, variantImage, variantId }) => { const unitPrice = variantPrice ?? product.price; const displayName = `${product.name}${variantLabel ? ` - ${variantLabel}` : ""}`; const detailUrl = `product.html?id=${product.id}${variantId ? `&variant=${encodeURIComponent(variantId)}` : ""}`; return `<article class="cart-item"><a class="cart-item-image" href="${detailUrl}"><img src="${variantImage || product.image}" alt="${variantImage ? `${product.name} ${variantLabel}` : product.imageAlt}" loading="lazy" decoding="async"></a><div class="cart-item-copy"><p class="product-category">${product.category}</p><h2><a href="${detailUrl}">${escapeHtml(displayName)}</a></h2>${note ? `<p class="cart-custom-note">Personalisation: ${escapeHtml(note)}</p>` : ""}<p class="cart-item-price">${currency(unitPrice)}</p><button type="button" class="remove-button" data-remove="${index}">Remove</button></div><div class="quantity-control" aria-label="Quantity controls"><button type="button" data-quantity="${index}" data-change="-1" aria-label="Decrease quantity">−</button><span>${quantity}</span><button type="button" data-quantity="${index}" data-change="1" aria-label="Increase quantity">+</button></div><strong class="cart-item-total">${currency(unitPrice * quantity)}</strong></article>`; }).join("");
      container.querySelectorAll("[data-quantity]").forEach((button) => button.addEventListener("click", () => {
        const next = getCart(); const item = next[Number(button.dataset.quantity)];
        if (!item) return;
        item.quantity += Number(button.dataset.change);
        if (item.quantity < 1) next.splice(Number(button.dataset.quantity), 1);
        saveCart(next); refresh();
      }));
      container.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => { const next = getCart(); next.splice(Number(button.dataset.remove), 1); saveCart(next); refresh(); }));
    }
    refresh();
    document.querySelector("#checkout-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const cart = getCart().map((item) => ({ ...item, product: productById(item.id) })).filter((item) => item.product);
      if (!cart.length) return;
      const form = new FormData(event.currentTarget);
      const total = cart.reduce((sum, item) => sum + (item.variantPrice ?? item.product.price) * item.quantity, 0);
      const details = cart.map((item) => { const unitPrice = item.variantPrice ?? item.product.price; const name = `${item.product.name}${item.variantLabel ? ` - ${item.variantLabel}` : ""}`; return `• ${name} × ${item.quantity}${item.note ? ` (Personalisation: ${item.note})` : ""} — ${currency(unitPrice * item.quantity)}`; }).join("\n");
      const message = `Hi VIZORA! I'd like to place an order.\n\n${details}\n\nSubtotal: ${currency(total)}\n\nName: ${form.get("name")}\nPhone: ${form.get("phone")}\nDelivery address: ${form.get("address")}\n\nPlease confirm the order, shipping, and payment details.`;
      if (WHATSAPP_NUMBER.includes("X")) {
        window.alert("Before checkout can open WhatsApp, add your WhatsApp number in js/main.js (WHATSAPP_NUMBER). Your order details are ready to send.");
        return;
      }
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    });
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); }
  function setupNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".primary-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      nav.classList.toggle("is-open", !open);
      document.body.classList.toggle("nav-open", !open);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); document.body.classList.remove("nav-open"); }));
  }
  function setupHeroVideo() {
    const video = document.querySelector("#hero-video");
    if (!video) return;
    const toggle = document.querySelector("#hero-video-toggle");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const source = video.querySelector("source[data-src]");
    let sourceLoaded = false;
    const loadSource = () => {
      if (!source || sourceLoaded) return;
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
      sourceLoaded = true;
      video.load();
    };
    const syncToggle = () => {
      if (!toggle) return;
      const playing = !video.paused && !video.ended;
      toggle.setAttribute("aria-pressed", String(playing));
      toggle.setAttribute("aria-label", playing ? "Pause hero video" : "Play hero video");
    };
    video.addEventListener("play", syncToggle);
    video.addEventListener("pause", syncToggle);
    toggle?.addEventListener("click", () => {
      if (video.paused) {
        loadSource();
        video.play().catch(() => {});
      }
      else video.pause();
    });
    const applyMotionPreference = () => {
      if (motion.matches) video.pause();
      else {
        loadSource();
        video.play().catch(() => {});
      }
      syncToggle();
    };
    if (!motion.matches) {
      const scheduleLoad = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 1200));
      scheduleLoad(() => {
        if (!motion.matches) loadSource();
      }, { timeout: 2500 });
    }
    applyMotionPreference();
    motion.addEventListener?.("change", applyMotionPreference);
  }
  function setupYear() { document.querySelectorAll("[data-year]").forEach((element) => { element.textContent = new Date().getFullYear(); }); }
  function setupFloatingContact() {
    document.querySelectorAll(".whatsapp-float").forEach((link) => link.addEventListener("click", (event) => {
      if (WHATSAPP_NUMBER.includes("X")) { event.preventDefault(); window.alert("Add your WhatsApp number in js/main.js (WHATSAPP_NUMBER) to enable this chat button."); }
    }));
  }
  document.addEventListener("DOMContentLoaded", () => {
    setupNavigation(); setupHeroVideo(); setupYear(); updateCartCount(); setupFloatingContact(); renderHomeCategories(); renderInstagramTiles(); setupFollowReveal();
    loadHomeReviews();
    renderCards(document.querySelector("#featured-products"), ["9", "10", "61", "12"].map(productById).filter(Boolean));
    renderShop(); renderProductDetail(); renderCart();
  });
})();
