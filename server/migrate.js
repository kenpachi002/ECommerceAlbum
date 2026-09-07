/**
 * server/migrate.js
 *
 * Safe, idempotent migration script. Run this after pulling updates
 * to apply schema changes without losing existing data.
 *
 * Run: npm run db:migrate
 */

import "dotenv/config";
import { pool } from "./db.js";

async function migrate() {
  console.log("\n🔧  Running database migrations...\n");

  const client = await pool.connect();
  try {
    // ── 1. Users: add role column ─────────────────────────────────────────
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
      CHECK (role IN ('customer', 'admin'));
    `);
    console.log("  ✓ users.role column ready");

    // ── 2. Orders: link legacy email-only orders to their user ───────────
    await client.query(`
      UPDATE orders o
      SET user_id = u.id
      FROM users u
      WHERE o.user_id IS NULL AND LOWER(o.email) = LOWER(u.email);
    `);
    console.log("  ✓ legacy orders linked to matching users");

    // ── 3. Wallets table ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        balance_cents INT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ wallets table ready");

    // ── 4. Wallet transactions table ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_cents INT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'payment', 'refund', 'admin_adjustment')),
        description TEXT NOT NULL DEFAULT '',
        order_id BIGINT REFERENCES orders(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ wallet_transactions table ready");

    // ── 5. Orders: add status timestamps ──────────────────────────────────
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_due_at TIMESTAMPTZ;
    `);
    console.log("  ✓ orders timestamp columns ready");

    // ── 6. Orders: add payment method ─────────────────────────────────────
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'card'
      CHECK (payment_method IN ('card', 'wallet'));
    `);
    console.log("  ✓ orders.payment_method column ready");

    // ── 7. Create wallets for existing users who don't have one ───────────
    await client.query(`
      INSERT INTO wallets (user_id, balance_cents)
      SELECT id, 0 FROM users WHERE id NOT IN (SELECT user_id FROM wallets)
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log("  ✓ wallets created for existing users");

    // ── 8. Indexes ────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS wallet_transactions_user_idx ON wallet_transactions(user_id);
    `);
    console.log("  ✓ indexes ready");

    console.log("\n✨  All migrations applied successfully!\n");
  } catch (err) {
    console.error("\n❌  Migration failed:", err.message, "\n");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
