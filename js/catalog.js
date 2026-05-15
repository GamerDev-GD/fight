/**
 * CATALOG
 * ---------
 * Loads products from Supabase table `public.products` when configured.
 * Each product must include `product_code` — that value is what the cart stores.
 *
 * If Supabase is not configured, we fall back to SAMPLE_PRODUCTS so you can
 * preview the UI immediately.
 */

const SAMPLE_PRODUCTS = [
  {
    product_code: "MD-VNT-01",
    name: "Night Match Vintage Tee",
    description: "Garment-dyed heavyweight cotton.",
    price: 1799,
    currency: "INR",
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    product_code: "MD-LEG-04",
    name: "Legacies Oversized Hoodie",
    description: "Brushed fleece, dropped shoulder.",
    price: 2899,
    currency: "INR",
    image_url:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80",
  },
  {
    product_code: "MD-MNT-09",
    name: "Moments Graphic Longsleeve",
    description: "Soft hand, cracked ink print.",
    price: 1999,
    currency: "INR",
    image_url:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
  },
  {
    product_code: "MD-CLN-02",
    name: "Clean Crest Socks (Pack)",
    description: "Ribbed arch, cushioned footbed.",
    price: 499,
    currency: "INR",
    image_url:
      "https://images.unsplash.com/photo-1586350977773-b3b4abd38c7d?auto=format&fit=crop&w=900&q=80",
  },
  {
    product_code: "MD-PSR-01",
    name: "Pitchside Poster Print",
    description: "Matte museum paper, ships rolled.",
    price: 799,
    currency: "INR",
    image_url:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
  },
  {
    product_code: "MD-JGR-03",
    name: "Jogger — Midnight Line",
    description: "Tapered leg, zip pockets.",
    price: 2199,
    currency: "INR",
    image_url:
      "https://images.unsplash.com/photo-1541099649105-f69ad21df324?auto=format&fit=crop&w=900&q=80",
  },
];

function isSupabaseConfigured() {
  const cfg = window.APP_CONFIG || {};
  return (
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !String(cfg.supabaseUrl).includes("YOUR_") &&
    !String(cfg.supabaseAnonKey).includes("YOUR_")
  );
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  const { createClient } = window.supabase;
  const cfg = window.APP_CONFIG;
  return createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
}

async function loadProducts() {
  const statusEl = document.getElementById("catalogStatus");
  const client = getSupabaseClient();

  if (!client) {
    if (statusEl) {
      statusEl.textContent = "Demo catalog (configure Supabase in js/config.js for live data).";
    }
    return SAMPLE_PRODUCTS;
  }

  if (statusEl) statusEl.textContent = "Loading from Supabase…";

  const { data, error } = await client
    .from("products")
    .select("product_code,name,description,price,currency,image_url,is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    if (statusEl) {
      statusEl.textContent =
        "Could not load Supabase catalog — showing demo products. Check table name, RLS, and keys.";
    }
    return SAMPLE_PRODUCTS;
  }

  if (statusEl) {
    statusEl.textContent = `${data.length} pieces live from Supabase.`;
  }

  return data;
}

window.Catalog = {
  loadProducts,
  isSupabaseConfigured,
  getSupabaseClient,
  SAMPLE_PRODUCTS,
};
