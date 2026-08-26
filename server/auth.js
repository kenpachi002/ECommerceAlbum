import "dotenv/config";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "./db.js";

const router = Router();
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "groove-dev-secret";
const JWT_EXPIRES = "7d";

// ─── Helpers ────────────────────────────────────────────────────
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function safeUser(row) {
  return { id: row.id, email: row.email, displayName: row.display_name, createdAt: row.created_at };
}

// ─── Middleware: authenticate ────────────────────────────────────
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
}

// ─── POST /api/auth/register ─────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Check if email already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *",
      [email.toLowerCase(), passwordHash, displayName || null]
    );

    const user = result.rows[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ message: "No password set. Use forgot password to set one." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user.id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });
    res.json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/forgot-password ─────────────────────────────
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const result = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);

    // Always return 200 to prevent email enumeration
    if (result.rowCount === 0) {
      return res.json({ message: "If this email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [token, expires, result.rows[0].id]
    );

    // Get the base URL from the request for the reset link
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host;
    const baseUrl = process.env.VERCEL === "1" ? `https://${host}` : `http://localhost:5173`;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Groove & Co. <onboarding@resend.dev>", // default testing domain provided by Resend
        to: email,
        subject: "Password Reset for Groove & Co.",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #111;">
            <h2>Groove & Co. Password Reset</h2>
            <p>You requested a password reset. Click the button below to choose a new password.</p>
            <p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7928CA; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } else {
      // Fallback to console if no API key is provided
      console.log("\n╔══════════════════════════════════════════════╗");
      console.log("║       PASSWORD RESET LINK (DEMO MODE)        ║");
      console.log("╠══════════════════════════════════════════════╣");
      console.log(`║ Email: ${email}`);
      console.log(`║ Link:  ${resetUrl}`);
      console.log("║ (Set RESEND_API_KEY to send real emails)     ║");
      console.log("╚══════════════════════════════════════════════╝\n");
    }

    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/reset-password ──────────────────────────────
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const result = await query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const updated = await query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2 RETURNING *",
      [passwordHash, result.rows[0].id]
    );

    const jwtToken = signToken(updated.rows[0].id);
    res.json({ token: jwtToken, user: safeUser(updated.rows[0]), message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
