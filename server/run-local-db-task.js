import "dotenv/config";

const tasks = {
  setup: "./setup-db.js",
  migrate: "./migrate.js",
  "seed-real": "./seed-real.js",
};
const task = tasks[process.argv[2]];

if (!task) {
  throw new Error("Choose one local database task: setup, migrate, or seed-real.");
}
if (!process.env.LOCAL_DATABASE_URL) {
  throw new Error("LOCAL_DATABASE_URL must be set before running a local database task.");
}

process.env.DATABASE_URL = process.env.LOCAL_DATABASE_URL;
await import(task);
