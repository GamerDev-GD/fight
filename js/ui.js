/**
 * UI
 * --
 * Products render on Shop only. Bag is a dedicated page (bag.html), not a drawer.
 * Header "Bag" link shows a live count from localStorage.
 */

function $(id) {
  return document.getElementById(id);
}

function pulseBagLink() {
  const el = $("bagLink");
  if (!el) return;
  el.classList.remove("is-pulse");
  void el.offsetWidth;
  el.classList.add("is-pulse");
}

function renderProducts(products) {
  const grid = $("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  products.forEach((p) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const visual = document.createElement("div");
    visual.className = "product-visual";
    const img = document.createElement("img");
    img.src = p.image_url || "";
    img.alt = p.name;
    img.loading = "lazy";
    visual.appendChild(img);

    const body = document.createElement("div");
    body.className = "product-body";

    const code = document.createElement("div");
    code.className = "product-code";
    code.textContent = p.product_code;

    const title = document.createElement("h3");
    title.className = "product-title";
    title.textContent = p.name;

    const desc = document.createElement("p");
    desc.className = "muted small";
    desc.textContent = p.description || "";

    const meta = document.createElement("div");
    meta.className = "product-meta";

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = window.CartStore.formatMoney(Number(p.price), p.currency);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "add-btn";
    btn.textContent = "+ Add";
    btn.addEventListener("click", () => {
      window.CartStore.addToCart(p);
      refreshCartUI();
      pulseBagLink();
    });

    meta.appendChild(price);
    meta.appendChild(btn);

    body.appendChild(code);
    body.appendChild(title);
    if (p.description) body.appendChild(desc);
    body.appendChild(meta);

    card.appendChild(visual);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function refreshCartUI() {
  const lines = window.CartStore.readCart();
  const { subtotal, count, currency } = window.CartStore.cartTotals(lines);

  const countEl = $("cartCount");
  if (countEl) countEl.textContent = String(count);

  const list = $("cartLines");
  const emptyHint = $("bagEmptyHint");
  const isBagPage = document.body.classList.contains("page-bag");

  if (list) {
    list.innerHTML = "";

    if (lines.length === 0) {
      if (isBagPage && emptyHint) {
        emptyHint.hidden = false;
      } else if (emptyHint) {
        emptyHint.hidden = true;
      }
      if (!isBagPage || !emptyHint) {
        const empty = document.createElement("li");
        empty.className = "muted small";
        empty.textContent = "Your bag is empty — add something with a product code.";
        list.appendChild(empty);
      }
    } else {
      if (emptyHint) emptyHint.hidden = true;
      lines.forEach((line) => {
        const li = document.createElement("li");
        li.className = "cart-line";

        const thumb = document.createElement("div");
        thumb.className = "cart-thumb";
        if (line.image_url) {
          const im = document.createElement("img");
          im.src = line.image_url;
          im.alt = "";
          thumb.appendChild(im);
        }

        const main = document.createElement("div");
        main.className = "cart-line-main";

        const t = document.createElement("div");
        t.className = "cart-line-title";
        t.textContent = line.name;

        const c = document.createElement("div");
        c.className = "cart-line-code";
        c.textContent = line.product_code;

        const meta = document.createElement("div");
        meta.className = "cart-line-meta";

        const price = document.createElement("span");
        price.textContent = window.CartStore.formatMoney(line.price * line.qty, line.currency);

        const qty = document.createElement("div");
        qty.className = "qty-control";
        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";
        minus.addEventListener("click", () => {
          window.CartStore.setQty(line.product_code, line.qty - 1);
          refreshCartUI();
          refreshCheckoutSummary();
        });
        const num = document.createElement("span");
        num.textContent = String(line.qty);
        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";
        plus.addEventListener("click", () => {
          window.CartStore.setQty(line.product_code, line.qty + 1);
          refreshCartUI();
          refreshCheckoutSummary();
        });
        qty.appendChild(minus);
        qty.appendChild(num);
        qty.appendChild(plus);

        meta.appendChild(price);
        meta.appendChild(qty);

        main.appendChild(t);
        main.appendChild(c);
        main.appendChild(meta);

        li.appendChild(thumb);
        li.appendChild(main);
        list.appendChild(li);
      });
    }
  }

  const sub = $("cartSubtotal");
  if (sub) sub.textContent = window.CartStore.formatMoney(subtotal, currency);
}

function refreshCheckoutSummary() {
  const lines = window.CartStore.readCart();
  const { subtotal, currency } = window.CartStore.cartTotals(lines);
  const ul = $("summaryLines");
  const totalEl = $("summaryTotal");
  if (!ul || !totalEl) return;

  ul.innerHTML = "";
  if (lines.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No items yet — add from the shop.";
    ul.appendChild(li);
  } else {
    lines.forEach((l) => {
      const li = document.createElement("li");
      const left = document.createElement("span");
      left.textContent = `${l.product_code} × ${l.qty}`;
      const right = document.createElement("strong");
      right.textContent = window.CartStore.formatMoney(l.price * l.qty, l.currency);
      li.appendChild(left);
      li.appendChild(right);
      ul.appendChild(li);
    });
  }
  totalEl.textContent = window.CartStore.formatMoney(subtotal, currency);
}

async function submitCheckout(form) {
  const hint = $("formHint");
  const submitBtn = $("submitOrder");
  const setHint = (msg, kind) => {
    if (!hint) return;
    hint.textContent = msg;
    hint.classList.remove("is-error", "is-success");
    if (kind) hint.classList.add(kind);
  };

  const lines = window.CartStore.readCart();
  if (lines.length === 0) {
    setHint("Your bag is empty. Add at least one product before placing an order.", "is-error");
    return;
  }

  const client = window.Catalog.getSupabaseClient();
  if (!client) {
    setHint(
      "Supabase is not configured yet. Fill supabaseUrl + supabaseAnonKey in js/config.js, then reload.",
      "is-error",
    );
    return;
  }

  const fd = new FormData(form);
  const { subtotal, currency } = window.CartStore.cartTotals(lines);

  const payload = {
    customer_name: String(fd.get("customer_name") || "").trim(),
    email: String(fd.get("email") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    address_line: String(fd.get("address_line") || "").trim(),
    city: String(fd.get("city") || "").trim(),
    postal_code: String(fd.get("postal_code") || "").trim(),
    country: String(fd.get("country") || "").trim() || "India",
    notes: String(fd.get("notes") || "").trim(),
    cart_json: lines.map((l) => ({
      product_code: l.product_code,
      name: l.name,
      qty: l.qty,
      unit_price: l.price,
      currency: l.currency,
    })),
    total_amount: subtotal,
    currency,
  };

  if (!payload.customer_name || !payload.email) {
    setHint("Name and email are required.", "is-error");
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  setHint("Sending order to Supabase…", "");

  const { error } = await client.from("orders").insert(payload);

  if (submitBtn) submitBtn.disabled = false;

  if (error) {
    console.error(error);
    setHint(
      "Supabase rejected the insert. Open the browser console for details — usually RLS policy or column mismatch.",
      "is-error",
    );
    return;
  }

  setHint("Order saved. Thank you — we will follow up by email.", "is-success");
  window.CartStore.clearCart();
  refreshCartUI();
  refreshCheckoutSummary();
  form.reset();
}

function highlightNav() {
  const page = document.body.getAttribute("data-page");
  if (!page) return;
  document.querySelectorAll(".nav a[data-nav]").forEach((a) => {
    a.classList.toggle("is-active", a.getAttribute("data-nav") === page);
  });

  const bagLink = $("bagLink");
  if (bagLink) {
    bagLink.classList.toggle("is-active", page === "bag");
    if (page === "bag") bagLink.setAttribute("aria-current", "page");
    else bagLink.removeAttribute("aria-current");
  }
}

function wireEvents() {
  $("clearCart")?.addEventListener("click", () => {
    window.CartStore.clearCart();
    refreshCartUI();
    refreshCheckoutSummary();
  });

  $("checkoutForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitCheckout(e.target);
  });
}

async function boot() {
  highlightNav();
  wireEvents();
  refreshCartUI();
  refreshCheckoutSummary();

  const grid = $("productGrid");
  if (grid) {
    const products = await window.Catalog.loadProducts();
    renderProducts(products);
  }
}

document.addEventListener("DOMContentLoaded", boot);
