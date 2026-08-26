/**
 * server/seed-retry.js
 * Retry the albums that got HTTP 403 from iTunes (rate limited)
 * Run: node server/seed-retry.js
 */

import "dotenv/config";
import { pool, query } from "./db.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function deterministicPrice(seed, min, max) {
  const hash = Math.abs((seed * 2654435761) >>> 0);
  return min + (hash % (max - min + 1));
}

function priceForFormat(format, itunesId) {
  const ranges = { Vinyl: { min: 2200, max: 4200 }, CD: { min: 1200, max: 2000 }, Cassette: { min: 1000, max: 1600 }, Digital: { min: 700, max: 1200 } };
  const { min, max } = ranges[format] || ranges.Digital;
  return deterministicPrice(itunesId, min, max);
}

const MISSED = [
  ["Stevie Wonder", "Songs in the Key of Life", "Vinyl", 5],
  ["Curtis Mayfield", "Superfly", "Vinyl", 11],
  ["James Brown", "In the Jungle Groove", "Vinyl", 5],
  ["Aretha Franklin", "I Never Loved a Man the Way I Love You", "Vinyl", 8],
  ["Joni Mitchell", "Blue", "Vinyl", 2],
  ["Nick Drake", "Pink Moon", "Vinyl", 4],
  ["Joy Division", "Unknown Pleasures", "Vinyl", 10],
  ["The Cure", "Disintegration", "Vinyl", 7],
  ["The Smiths", "The Queen Is Dead", "Vinyl", 1],
  ["The Clash", "London Calling", "Vinyl", 8],
  ["Television", "Marquee Moon", "Vinyl", 0],
  ["Gang of Four", "Entertainment", "Vinyl", 8],
  ["Pink Floyd", "The Dark Side of the Moon", "Vinyl", 7], // wrong result before
];

async function fetchITunes(artist, album) {
  const q = encodeURIComponent(`${artist} ${album}`);
  const url = `https://itunes.apple.com/search?term=${q}&entity=album&limit=5&media=music`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes HTTP ${res.status}`);
  const data = await res.json();
  const term = album.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const candidates = data.results.filter((r) => r.wrapperType === "collection");
  const exact = candidates.find((r) =>
    r.collectionName.toLowerCase().replace(/[^a-z0-9 ]/g, "").includes(term.slice(0, 10))
  );
  return exact || candidates[0] || null;
}

async function upsertArtist(client, name) {
  const res = await client.query(`INSERT INTO artists (name, biography) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [name, `${name} — curated for Groove & Co.`]);
  return res.rows[0].id;
}

async function upsertGenre(client, name) {
  const res = await client.query(`INSERT INTO genres (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [name]);
  return res.rows[0].id;
}

async function main() {
  const client = await pool.connect();
  let inserted = 0;

  console.log(`\n🔁  Retry seeder — ${MISSED.length} albums\n`);

  for (const [artist, album, preferredFormat, palette] of MISSED) {
    let data = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        process.stdout.write(`  ⬇  ${artist} — ${album} … `);
        data = await fetchITunes(artist, album);
        break;
      } catch (err) {
        console.log(`retry ${attempt + 1}: ${err.message}`);
        await sleep(5000 * (attempt + 1));
      }
    }

    if (!data) { console.log("failed after retries."); await sleep(3000); continue; }

    const catId = `IT-${data.collectionId}`;
    const artworkUrl = data.artworkUrl100?.replace("100x100bb", "600x600bb") || null;
    const releaseYear = new Date(data.releaseDate).getFullYear();
    const priceCents = priceForFormat(preferredFormat, data.collectionId);

    try {
      await client.query("BEGIN");
      const artistId = await upsertArtist(client, data.artistName);
      const genreId = await upsertGenre(client, data.primaryGenreName || "Other");
      const albumRes = await client.query(
        `INSERT INTO albums (catalog_id, title, artist_id, genre_id, release_year, description, artwork_palette, artwork_url, itunes_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (catalog_id) DO NOTHING RETURNING id`,
        [catId, data.collectionName, artistId, genreId, releaseYear, `${data.collectionName} by ${data.artistName}.`, palette, artworkUrl, data.collectionId]
      );
      if (albumRes.rowCount === 0) { await client.query("ROLLBACK"); console.log("already exists."); await sleep(2000); continue; }
      const albumId = albumRes.rows[0].id;
      await client.query(`INSERT INTO product_variants (album_id, format, edition_name, price_cents, stock_quantity) VALUES ($1,$2,'Standard',$3,$4) ON CONFLICT DO NOTHING`, [albumId, preferredFormat, priceCents, 5 + (data.collectionId % 20)]);
      if (preferredFormat !== "Digital") await client.query(`INSERT INTO product_variants (album_id, format, edition_name, price_cents, stock_quantity) VALUES ($1,'Digital','Standard',$2,999) ON CONFLICT DO NOTHING`, [albumId, priceForFormat("Digital", data.collectionId + 1)]);
      await client.query("COMMIT");
      console.log(`✅  ${data.collectionName} (${releaseYear})`);
      inserted++;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.log(`❌  ${err.message}`);
    }

    await sleep(3000); // generous delay to avoid 403s
  }

  client.release();
  await pool.end();
  console.log(`\n✨  Retry complete! Inserted: ${inserted}\n`);
}

main().catch(console.error);
