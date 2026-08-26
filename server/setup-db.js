import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const directory = path.dirname(fileURLToPath(import.meta.url));

try {
  await pool.query(await fs.readFile(path.join(directory, "schema.sql"), "utf8"));
  await pool.query(await fs.readFile(path.join(directory, "seed.sql"), "utf8"));
  console.log("PostgreSQL schema and seed data are ready.");
} finally {
  await pool.end();
}
