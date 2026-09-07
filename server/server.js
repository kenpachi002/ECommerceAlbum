import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import { pool, query } from "./db.js";
import authRouter, { authenticate, requireAdmin } from "./auth.js";

const app = express();
const port = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
// In production, only allow requests from the configured frontend origin.
// In development, also allow localhost Vite dev server.
const allowedOrigins = [
  process.env.FRONTEND_URL,          // e.g. https://groove-and-co.vercel.app
  "http://localhost:5173",            // Vite dev
  "http://localhost:4173",            // Vite preview
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ─── Rate Limiters ───────────────────────────────────────────────────────────
// General limiter: 100 requests per 15 minutes (products, iTunes search, etc.)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Auth limiter: stricter in prod, generous in dev to avoid lockout during testing
const authMax = isProd ? 5 : 25;
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again in 15 minutes." },
});

app.use("/api", generalLimiter);

// Auth routes — apply the strict auth rate limiter
app.use("/api/auth", authLimiter, authRouter);

// Returns ONE row per album (cheapest variant), avoiding duplicates in the grid.
const productSelect = `
  SELECT DISTINCT ON (a.id)
         a.catalog_id AS id, a.title, ar.name AS artist, g.name AS genre,
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
    const limit  = Math.min(parseInt(request.query.limit  || "12", 10), 100);
    const offset = Math.max(parseInt(request.query.offset || "0",  10), 0);
    if (search) { values.push(`%${search}%`); conditions.push(`(a.title ILIKE $${values.length} OR ar.name ILIKE $${values.length} OR g.name ILIKE $${values.length})`); }
    if (request.query.genre && request.query.genre !== "All") { values.push(request.query.genre); conditions.push(`g.name = $${values.length}`); }
    if (request.query.format && request.query.format !== "All") { values.push(request.query.format); conditions.push(`v.format = $${values.length}`); }
    const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    // Wrap in subquery so ORDER BY + LIMIT work correctly with DISTINCT ON
    const sql = `SELECT * FROM (${productSelect}${where} ORDER BY a.id, v.price_cents) AS deduped ORDER BY year DESC, title LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);
    const result = await query(sql, values);
    // Count total distinct albums for pagination
    const countSql = `SELECT COUNT(DISTINCT a.id) FROM albums a JOIN artists ar ON ar.id = a.artist_id LEFT JOIN genres g ON g.id = a.genre_id JOIN product_variants v ON v.album_id = a.id${where}`;
    const countResult = await query(countSql, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count, 10);
    response.json({ products: result.rows.map(mapProduct), count: result.rowCount, total, hasMore: offset + limit < total });
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

app.post("/api/orders", authenticate, async (request, response, next) => {
  const { items, customer, shippingAddress, paymentMethod } = request.body;
  if (!Array.isArray(items) || !items.length || !customer?.email) return response.status(400).json({ message: "An email and at least one item are required" });
  if (!['card', 'wallet'].includes(paymentMethod)) return response.status(400).json({ message: "Choose a valid payment method" });
  if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) return response.status(400).json({ message: "Item quantities must be positive whole numbers" });
  const userResult = await query("SELECT id, email FROM users WHERE id = $1", [request.userId]);
  if (!userResult.rowCount) return response.status(404).json({ message: "User not found" });
  const user = userResult.rows[0];
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
    const shippingCents = subtotal >= 5000 ? 0 : 599;
    const totalCents = subtotal + shippingCents;

    // Wallet payment: check balance and deduct
    let walletDeduction = false;
    if (paymentMethod === "wallet") {
      const walletResult = await client.query("SELECT balance_cents FROM wallets WHERE user_id = $1 FOR UPDATE", [user.id]);
      const balance = walletResult.rowCount ? walletResult.rows[0].balance_cents : 0;
      if (balance < totalCents) throw Object.assign(new Error("Insufficient wallet balance"), { status: 402 });
      await client.query("UPDATE wallets SET balance_cents = balance_cents - $1, updated_at = NOW() WHERE user_id = $2", [totalCents, user.id]);
      walletDeduction = true;
    }
    const orderNumber = `GROOVE-${Date.now()}`;
    const orderResult = await client.query(`INSERT INTO orders (order_number, user_id, email, subtotal_cents, shipping_cents, total_cents, shipping_address, payment_method, status, paid_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${walletDeduction ? "NOW()" : "NULL"}) RETURNING id, order_number, status, total_cents, created_at`, [orderNumber, user.id, user.email, subtotal, shippingCents, totalCents, shippingAddress || null, walletDeduction ? "wallet" : "card", walletDeduction ? "paid" : "pending"]);
    const orderId = orderResult.rows[0].id;
    for (const item of orderItems) await client.query("INSERT INTO order_items (order_id, variant_id, album_title, format, unit_price_cents, quantity) VALUES ($1, $2, $3, $4, $5, $6)", [orderId, item.id, item.title, item.format, item.price_cents, item.quantity]);
    if (walletDeduction) {
      await client.query("INSERT INTO wallet_transactions (user_id, amount_cents, type, description, order_id) VALUES ($1, $2, 'payment', 'Order payment', $3)", [user.id, -totalCents, orderId]);
    }
    await client.query("COMMIT");
    response.status(201).json({ ...orderResult.rows[0], total: orderResult.rows[0].total_cents / 100 });
  } catch (error) { await client.query("ROLLBACK"); next(error); } finally { client.release(); }
});

// ─── POST /api/orders/:id/pay — pay a pending order from wallet ───────────
app.post("/api/orders/:id/pay", authenticate, async (request, response, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      "SELECT id, total_cents, status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [request.params.id, request.userId]
    );
    if (!orderResult.rowCount) throw Object.assign(new Error("Order not found"), { status: 404 });
    const order = orderResult.rows[0];
    if (order.status !== "pending") throw Object.assign(new Error(`Order cannot be paid — current status: ${order.status}`), { status: 409 });

    const walletResult = await client.query("SELECT balance_cents FROM wallets WHERE user_id = $1 FOR UPDATE", [request.userId]);
    const balance = walletResult.rowCount ? walletResult.rows[0].balance_cents : 0;
    if (balance < order.total_cents) throw Object.assign(new Error("Insufficient wallet balance"), { status: 402 });

    await client.query("UPDATE wallets SET balance_cents = balance_cents - $1, updated_at = NOW() WHERE user_id = $2", [order.total_cents, request.userId]);
    const updated = await client.query("UPDATE orders SET status = 'paid', payment_method = 'wallet', paid_at = NOW() WHERE id = $1 RETURNING id, order_number, status, total_cents, paid_at", [order.id]);
    await client.query("INSERT INTO wallet_transactions (user_id, amount_cents, type, description, order_id) VALUES ($1, $2, 'payment', 'Order payment', $3)", [request.userId, -order.total_cents, order.id]);
    await client.query("COMMIT");
    response.json({ ...updated.rows[0], total: updated.rows[0].total_cents / 100 });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

// ─── GET /api/orders/my — fetch authenticated user's order history ─────────
app.get("/api/orders/my", authenticate, async (request, response, next) => {
  try {
    // Resolve the user's email from their userId
    const userResult = await query("SELECT email FROM users WHERE id = $1", [request.userId]);
    if (!userResult.rowCount) return response.status(404).json({ message: "User not found" });
    const email = userResult.rows[0].email;

    const ordersResult = await query(
            `SELECT o.id, o.order_number, o.status, o.total_cents, o.subtotal_cents,
              o.shipping_address, o.delivery_due_at, o.created_at, o.paid_at, o.processing_at,
              o.shipped_at, o.delivered_at, o.cancelled_at,
              json_agg(json_build_object(
                'id', oi.id,
                'albumTitle', oi.album_title,
                'format', oi.format,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price_cents / 100.0
              ) ORDER BY oi.id) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.email = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [email]
    );

    const orders = ordersResult.rows.map((o) => ({
      ...o,
      total: o.total_cents / 100,
      subtotal: o.subtotal_cents / 100,
    }));

    response.json({ orders });
  } catch (error) { next(error); }
});

// ─── PATCH /api/orders/:id/cancel — cancel a pending/paid order ──────────
app.patch("/api/orders/:id/cancel", authenticate, async (request, response, next) => {
  const client = await pool.connect();
  try {
    // Verify the order belongs to the authenticated user
    const userResult = await query("SELECT email FROM users WHERE id = $1", [request.userId]);
    if (!userResult.rowCount) return response.status(404).json({ message: "User not found" });
    const email = userResult.rows[0].email;

    const orderResult = await client.query(
      "SELECT id, status FROM orders WHERE id = $1 AND email = $2",
      [request.params.id, email]
    );
    if (!orderResult.rowCount) return response.status(404).json({ message: "Order not found" });

    const order = orderResult.rows[0];
    if (!["pending", "paid"].includes(order.status)) {
      return response.status(409).json({ message: `Order cannot be cancelled — current status: ${order.status}` });
    }

    await client.query("BEGIN");
    // Restore stock for all items in this order
    const items = await client.query(
      "SELECT variant_id, quantity FROM order_items WHERE order_id = $1",
      [order.id]
    );
    for (const item of items.rows) {
      await client.query(
        "UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2",
        [item.quantity, item.variant_id]
      );
    }
    const updated = await client.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING id, order_number, status",
      [order.id]
    );
    await client.query("COMMIT");
    response.json(updated.rows[0]);
  } catch (error) { await client.query("ROLLBACK"); next(error); } finally { client.release(); }
});



// ─── Admin Routes ───────────────────────────────────────────────────────────
// All routes require authentication + admin role

app.get("/api/admin/stats", authenticate, requireAdmin, async (_request, response, next) => {
  try {
    const usersResult = await query("SELECT COUNT(*) FROM users");
    const ordersResult = await query("SELECT COUNT(*), COALESCE(SUM(total_cents), 0) AS total FROM orders WHERE status NOT IN ('cancelled')");
    const lowStockResult = await query("SELECT COUNT(*) FROM product_variants WHERE stock_quantity <= 3 AND stock_quantity > 0");
    response.json({
      totalUsers: parseInt(usersResult.rows[0].count, 10),
      totalOrders: parseInt(ordersResult.rows[0].count, 10),
      revenue: parseInt(ordersResult.rows[0].total, 10) / 100,
      lowStock: parseInt(lowStockResult.rows[0].count, 10),
    });
  } catch (error) { next(error); }
});

app.get("/api/admin/users", authenticate, requireAdmin, async (_request, response, next) => {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.display_name, u.role, u.created_at, COALESCE(w.balance_cents, 0) AS balance_cents
      FROM users u LEFT JOIN wallets w ON w.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    response.json({ users: result.rows.map((r) => ({ ...r, displayName: r.display_name, balanceCents: parseInt(r.balance_cents, 10), createdAt: r.created_at })) });
  } catch (error) { next(error); }
});

app.patch("/api/admin/users/:id", authenticate, requireAdmin, async (request, response, next) => {
  try {
    const updates = [];
    const values = [];
    if (request.body.role) { values.push(request.body.role); updates.push(`role = $${values.length}`); }
    if (typeof request.body.balanceCents === "number") {
      values.push(request.body.balanceCents);
      await query(`INSERT INTO wallets (user_id, balance_cents, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET balance_cents = $2, updated_at = NOW()`, [request.params.id, request.body.balanceCents]);
      await query(`INSERT INTO wallet_transactions (user_id, amount_cents, type, description) VALUES ($1, $2, 'admin_adjustment', 'Admin balance adjustment')`, [request.params.id, request.body.balanceCents]);
    }
    if (updates.length > 0) {
      values.push(request.params.id);
      await query(`UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
    }
    const result = await query("SELECT id, email, display_name, role, created_at FROM users WHERE id = $1", [request.params.id]);
    response.json({ user: result.rows[0] });
  } catch (error) { next(error); }
});

app.get("/api/admin/orders", authenticate, requireAdmin, async (_request, response, next) => {
  try {
    const result = await query(`
      SELECT o.id, o.order_number, o.status, o.total_cents, o.email, o.delivery_due_at, o.created_at,
             o.paid_at, o.processing_at, o.shipped_at, o.delivered_at, o.cancelled_at,
             json_agg(json_build_object('albumTitle', oi.album_title, 'quantity', oi.quantity) ORDER BY oi.id) AS items
      FROM orders o JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id ORDER BY o.created_at DESC
    `);
    response.json({ orders: result.rows.map((o) => ({ ...o, total: o.total_cents / 100, orderNumber: o.order_number, createdAt: o.created_at, deliveryDueAt: o.delivery_due_at })) });
  } catch (error) { next(error); }
});

app.patch("/api/admin/orders/:id/status", authenticate, requireAdmin, async (request, response, next) => {
  try {
    const { status, deliveryDueAt } = request.body;
    const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) return response.status(400).json({ message: "Invalid status" });
    if (deliveryDueAt !== undefined && deliveryDueAt !== null && Number.isNaN(Date.parse(deliveryDueAt))) return response.status(400).json({ message: "Invalid delivery due date" });
    const statusField = { paid: "paid_at", processing: "processing_at", shipped: "shipped_at", delivered: "delivered_at", cancelled: "cancelled_at" }[status];
    const hasDueDateUpdate = deliveryDueAt !== undefined;
    const values = hasDueDateUpdate ? [status, deliveryDueAt || null, request.params.id] : [status, request.params.id];
    const timestampUpdate = statusField ? `, ${statusField} = NOW()` : "";
    const dueDateUpdate = hasDueDateUpdate ? ", delivery_due_at = $2" : "";
    const orderIdParameter = hasDueDateUpdate ? "$3" : "$2";
    const result = await query(`UPDATE orders SET status = $1${dueDateUpdate}${timestampUpdate} WHERE id = ${orderIdParameter} RETURNING id, order_number, status, total_cents, delivery_due_at, created_at`, values);
    if (!result.rowCount) return response.status(404).json({ message: "Order not found" });
    if (status === "cancelled") {
      const items = await query("SELECT variant_id, quantity FROM order_items WHERE order_id = $1", [request.params.id]);
      for (const item of items.rows) {
        await query("UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2", [item.quantity, item.variant_id]);
      }
    }
    const order = result.rows[0];
    response.json({ ...order, total: order.total_cents / 100, orderNumber: order.order_number });
  } catch (error) { next(error); }
});

app.get("/api/admin/products", authenticate, requireAdmin, async (_request, response, next) => {
  try {
    const result = await query(`
      SELECT a.title, ar.name AS artist, v.id AS variant_id, v.format, v.price_cents, v.stock_quantity
      FROM product_variants v
      JOIN albums a ON a.id = v.album_id
      JOIN artists ar ON ar.id = a.artist_id
      ORDER BY a.title
    `);
    response.json({ products: result.rows.map((r) => ({ ...r, variantId: r.variant_id, priceCents: r.price_cents, stockQuantity: r.stock_quantity })) });
  } catch (error) { next(error); }
});

app.patch("/api/admin/products/:id/stock", authenticate, requireAdmin, async (request, response, next) => {
  try {
    const { stockQuantity } = request.body;
    if (typeof stockQuantity !== "number" || stockQuantity < 0) return response.status(400).json({ message: "Invalid stock quantity" });
    const result = await query("UPDATE product_variants SET stock_quantity = $1 WHERE id = $2 RETURNING id", [stockQuantity, request.params.id]);
    if (!result.rowCount) return response.status(404).json({ message: "Product variant not found" });
    response.json({ success: true });
  } catch (error) { next(error); }
});

// ─── Wallet Routes ─────────────────────────────────────────────────────────

app.get("/api/wallet", authenticate, async (request, response, next) => {
  try {
    const walletResult = await query("SELECT balance_cents FROM wallets WHERE user_id = $1", [request.userId]);
    const balance = walletResult.rowCount ? walletResult.rows[0].balance_cents : 0;
    const txResult = await query("SELECT id, amount_cents, type, description, created_at FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [request.userId]);
    response.json({ balance, transactions: txResult.rows.map((t) => ({ ...t, amountCents: t.amount_cents, createdAt: t.created_at })) });
  } catch (error) { next(error); }
});

app.post("/api/wallet/deposit", authenticate, async (request, response, next) => {
  try {
    const { amountCents } = request.body;
    if (typeof amountCents !== "number" || amountCents <= 0) return response.status(400).json({ message: "Invalid amount" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO wallets (user_id, balance_cents) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET balance_cents = wallets.balance_cents + $2, updated_at = NOW()
         RETURNING balance_cents`,
        [request.userId, amountCents]
      );
      await client.query(
        `INSERT INTO wallet_transactions (user_id, amount_cents, type, description) VALUES ($1, $2, 'deposit', 'Wallet deposit')`,
        [request.userId, amountCents]
      );
      await client.query("COMMIT");
      response.json({ balance: result.rows[0].balance_cents });
    } catch (err) { await client.query("ROLLBACK"); throw err; } finally { client.release(); }
  } catch (error) { next(error); }
});

// ─── Error Handler ───────────────────────────────────────────────────────────
// In production: never leak stack traces or internal error messages.
// In development: show the full error message for debugging.
app.use((error, _request, response, _next) => {
  console.error(error);
  if (isProd) {
    // Only expose message for known client errors (4xx), hide everything else
    const status = error.status || 500;
    response.status(status).json({
      message: status < 500 ? error.message : "Internal server error",
    });
  } else {
    response.status(error.status || 500).json({
      message: error.message || "Internal server error",
      stack: error.stack,
    });
  }
});

if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  app.listen(port, () => console.log(`Groove & Co. API listening on http://localhost:${port}`));
}

export default app;
