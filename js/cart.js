/**
 * CART
 * ----
 * The cart is a plain array saved in localStorage under STORAGE_KEY.
 * Each line stores: product_code, name, price, currency, qty, image_url
 *
 * Why product_code?
 * - Short, human-readable reference for packing slips / support tickets.
 * - Matches the `product_code` column in Supabase `products`.
 */

const STORAGE_KEY = "matchday_cart_v1";

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(lines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

function formatMoney(amount, currency) {
  const cur = currency || "INR";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount}`;
  }
}

function findLineIndex(lines, productCode) {
  return lines.findIndex((l) => l.product_code === productCode);
}

function addToCart(product) {
  const lines = readCart();
  const idx = findLineIndex(lines, product.product_code);
  if (idx === -1) {
    lines.push({
      product_code: product.product_code,
      name: product.name,
      price: Number(product.price),
      currency: product.currency || "INR",
      qty: 1,
      image_url: product.image_url || "",
    });
  } else {
    lines[idx].qty += 1;
  }
  writeCart(lines);
  return lines;
}

function setQty(productCode, qty) {
  const lines = readCart();
  const idx = findLineIndex(lines, productCode);
  if (idx === -1) return lines;
  const next = Math.max(0, Number(qty) || 0);
  if (next === 0) lines.splice(idx, 1);
  else lines[idx].qty = next;
  writeCart(lines);
  return lines;
}

function clearCart() {
  writeCart([]);
}

function cartTotals(lines) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const currency = lines[0]?.currency || "INR";
  return { subtotal, count, currency };
}

window.CartStore = {
  readCart,
  addToCart,
  setQty,
  clearCart,
  cartTotals,
  formatMoney,
};
