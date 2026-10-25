import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const isVercel = process.env.VERCEL === "1";
const isLocalRuntime = !isVercel && process.env.NODE_ENV !== "production";
const hostedConnectionString = process.env.DATABASE_URL;
const localConnectionString = isLocalRuntime
  ? process.env.LOCAL_DATABASE_URL ||
    (!hostedConnectionString ? "postgresql://localhost:5432/groove_and_co" : undefined)
  : undefined;
const hostedPool = hostedConnectionString
  ? new Pool({
      connectionString: hostedConnectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
      ssl: hostedConnectionString.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : false,
    })
  : null;
const localPool = localConnectionString
  ? new Pool({
      connectionString: localConnectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
      ssl: false,
    })
  : null;

const canUseLocalFallback = Boolean(isLocalRuntime && hostedPool && localPool);
const probeCacheMs = 5000;
let activeSource = hostedPool ? "hosted" : localPool ? "local" : "unavailable";
let lastProbeAt = 0;
let probeInFlight;

function isPoolReachable(pool) {
  if (!pool) return Promise.resolve(false);
  return pool.query("SELECT 1").then(
    () => true,
    () => false
  );
}

async function refreshActiveSource(force = false) {
  if (!hostedPool) {
    activeSource = localPool ? "local" : "unavailable";
    return;
  }
  if (!force && Date.now() - lastProbeAt < probeCacheMs) return;
  if (probeInFlight) {
    await probeInFlight;
    return;
  }

  probeInFlight = (async () => {
    const hostedAvailable = await isPoolReachable(hostedPool);
    if (hostedAvailable) {
      activeSource = "hosted";
    } else if (canUseLocalFallback && await isPoolReachable(localPool)) {
      activeSource = "local";
    } else {
      activeSource = "unavailable";
    }
    lastProbeAt = Date.now();
  })();

  try {
    await probeInFlight;
  } finally {
    probeInFlight = undefined;
  }
}

async function getActivePool() {
  await refreshActiveSource();
  if (activeSource === "hosted") return hostedPool;
  if (activeSource === "local") return localPool;
  throw new Error(
    canUseLocalFallback
      ? "Hosted and local PostgreSQL databases are unavailable."
      : "The configured PostgreSQL database is unavailable."
  );
}

export async function query(text, params) {
  const activePool = await getActivePool();
  try {
    return await activePool.query(text, params);
  } catch (error) {
    if (activePool === hostedPool && canUseLocalFallback) lastProbeAt = 0;
    throw error;
  }
}

export async function getDatabaseStatus() {
  await refreshActiveSource(true);
  const [hostedAvailable, localAvailable] = await Promise.all([
    isPoolReachable(hostedPool),
    isPoolReachable(localPool),
  ]);

  return {
    source: activeSource,
    hostedAvailable,
    localAvailable,
    localFallbackEnabled: canUseLocalFallback,
    inventorySyncEnabled: Boolean(isLocalRuntime && hostedPool && localPool),
  };
}

export async function getActiveDatabaseSource() {
  await refreshActiveSource();
  return activeSource;
}

async function connect() {
  const activePool = await getActivePool();
  try {
    return await activePool.connect();
  } catch (error) {
    if (activePool === hostedPool && canUseLocalFallback) lastProbeAt = 0;
    throw error;
  }
}

export const inventorySyncPools =
  isLocalRuntime && hostedPool && localPool
    ? { hosted: hostedPool, local: localPool }
    : null;

export const pool = {
  connect,
  query,
  end: async () => {
    await Promise.all([hostedPool?.end(), localPool?.end()].filter(Boolean));
  },
};
