import cors from "cors";
import express from "express";
import { pool, query } from "./db.js";
import authRouter from "./auth.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api/auth", authRouter);

const productSelect = `
  SELECT a.catalog_id AS id, a.title, ar.name AS artist, g.name AS genre,
         a.release_year AS year, a.description, a.artwork_palette AS palette,
         a.artwork_url, a.itunes_id,
         v.id AS variant_id, v.format, v.edition_name, v.price_cents,
         v.stock_quantity, v.is_preorder
  FROM albums a
  JOIN artists ar ON ar.id = a.artist_id
  LEFT JOIN genres g ON g.id = a.genre_id
  JOIN product_variants v ON v.album_id = a.id
`;

function mapProduct(row) {
  return {
    ...row,
    price: row.price_cents / 100,
    variantId: row.variant_id,
    editionName: row.edition_name,
    inStock: row.stock_quantity > 0,
    artworkUrl: row.artwork_url || null,
  };
}

app.get("/api/health", async (_request, response) => {
  try {
    await query("SELECT 1");
    response.json({ status: "ok", database: "postgresql", service: "groove-and-co-api" });
  } catch {
    response.status(503).json({ status: "error", message: "Database unavailable" });
  }
});

app.get("/api/products", async (request, response, next) => {
  try {
    const values = [];
    const conditions = [];
    const search = String(request.query.search || "").trim();
    if (search) { values.push(`%${search}%`); conditions.push(`(a.title ILIKE $${values.length} OR ar.name ILIKE $${values.length} OR g.name ILIKE $${values.length})`); }
    if (request.query.genre && request.query.genre !== "All") { values.push(request.query.genre); conditions.push(`g.name = $${values.length}`); }
    if (request.query.format && request.query.format !== "All") { values.push(request.query.format); conditions.push(`v.format = $${values.length}`); }
    const result = await query(`${productSelect}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY a.release_year DESC, a.title`, values);
    response.json({ products: result.rows.map(mapProduct), count: result.rowCount });
  } catch (error) { next(error); }
});

app.get("/api/products/:productId", async (request, response, next) => {
  try {
    const result = await query(`${productSelect} WHERE a.catalog_id = $1 ORDER BY v.price_cents`, [request.params.productId]);
    if (!result.rowCount) return response.status(404).json({ message: "Product not found" });
    response.json({ ...mapProduct(result.rows[0]), variants: result.rows.map(mapProduct) });
  } catch (error) { next(error); }
});

// ─── iTunes Search Proxy ─────────────────────────────────────────────────────
// Proxies requests to iTunes Search API so the frontend can search millions of
// albums without CORS issues. Returns results shaped like our product schema.
function deterministicPrice(seed, min, max) {
  const hash = Math.abs((seed * 2654435761) >>> 0);
  return min + (hash % (max - min + 1));
}

app.get("/api/search/itunes", async (request, response, next) => {
  try {
    const q = String(request.query.q || "").trim();
    if (!q || q.length < 2) return response.json({ products: [] });

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=album&limit=20&media=music`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`iTunes API error ${res.status}`);
    const data = await res.json();

    const products = data.results
      .filter((r) => r.wrapperType === "collection" && r.collectionId)
      .map((r) => {
        const id = r.collectionId;
        const artworkUrl = r.artworkUrl100?.replace("100x100bb", "600x600bb") || null;
        const year = r.releaseDate ? new Date(r.releaseDate).getFullYear() : null;
        const priceCents = deterministicPrice(id, 2200, 4200);
        return {
          id: `IT-${id}`,
          title: r.collectionName,
          artist: r.artistName,
          genre: r.primaryGenreName || "Other",
          format: "Vinyl",
          year,
          price: priceCents / 100,
          price_cents: priceCents,
          palette: Math.abs(id) % 12,
          artworkUrl,
          itunes_id: id,
          variantId: null,           // live search results — not in DB
          inStock: true,
          isLiveResult: true,        // flag so frontend can label them
          description: `${r.collectionName} by ${r.artistName}. ${r.primaryGenreName || "Music"}, ${year}.`,
        };
      });

    response.json({ products, count: products.length });
  } catch (error) { next(error); }
});

app.post("/api/orders", async (request, response, next) => {
  const { items, customer, shippingAddress } = request.body;
  if (!Array.isArray(items) || !items.length || !customer?.email) return response.status(400).json({ message: "An email and at least one item are required" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const result = await client.query(`SELECT v.id, v.format, v.price_cents, v.stock_quantity, a.title FROM product_variants v JOIN albums a ON a.id = v.album_id WHERE v.id = $1 FOR UPDATE`, [item.variantId]);
      const variant = result.rows[0];
      if (!variant || variant.stock_quantity < item.quantity) throw Object.assign(new Error("Item unavailable"), { status: 409 });
      subtotal += variant.price_cents * item.quantity;
      orderItems.push({ ...variant, quantity: item.quantity });
      await client.query("UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2", [item.quantity, variant.id]);
    }
    const orderNumber = `GROOVE-${Date.now()}`;
    const orderResult = await client.query(`INSERT INTO orders (order_number, email, subtotal_cents, total_cents, shipping_address) VALUES ($1, $2, $3, $3, $4) RETURNING id, order_number, status, total_cents, created_at`, [orderNumber, customer.email, subtotal, shippingAddress || null]);
    for (const item of orderItems) await client.query("INSERT INTO order_items (order_id, variant_id, album_title, format, unit_price_cents, quantity) VALUES ($1, $2, $3, $4, $5, $6)", [orderResult.rows[0].id, item.id, item.title, item.format, item.price_cents, item.quantity]);
    await client.query("COMMIT");
    response.status(201).json({ ...orderResult.rows[0], total: orderResult.rows[0].total_cents / 100 });
  } catch (error) { await client.query("ROLLBACK"); next(error); } finally { client.release(); }
});

app.use((error, _request, response, _next) => { console.error(error); response.status(error.status || 500).json({ message: error.status ? error.message : "Internal server error" }); });

app.listen(port, () => console.log(`Groove & Co. API listening on http://localhost:${port}`));
