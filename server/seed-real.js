/**
 * server/seed-real.js
 *
 * Fetches real album data from the iTunes Search API (no key needed) and
 * seeds the PostgreSQL database with 50 curated iconic albums across genres.
 *
 * Run: npm run db:seed-real
 *
 * Pricing is deterministic (stable per album) using the iTunes collectionId
 * as a seed, so prices never drift between re-runs.
 */

import "dotenv/config";
import { pool, query } from "./db.js";

// ─── Price generation (deterministic per album) ─────────────────────────────
function deterministicPrice(seed, min, max) {
  // Simple hash — stable for the same seed across runs
  const hash = Math.abs((seed * 2654435761) >>> 0);
  return min + (hash % (max - min + 1));
}

function priceForFormat(format, itunesId) {
  const ranges = {
    Vinyl:    { min: 2200, max: 4200 },  // $22 – $42
    CD:       { min: 1200, max: 2000 },  // $12 – $20
    Cassette: { min: 1000, max: 1600 },  // $10 – $16
    Digital:  { min:  700, max: 1200 },  //  $7 – $12
  };
  const { min, max } = ranges[format] || ranges.Digital;
  return deterministicPrice(itunesId, min, max);
}

// ─── Curated album list ──────────────────────────────────────────────────────
// [artistSearchTerm, albumSearchTerm, preferredFormat, paletteIndex]
const ALBUMS = [
  // Jazz
  ["Miles Davis", "Kind of Blue", "Vinyl", 2],
  ["John Coltrane", "A Love Supreme", "Vinyl", 3],
  ["Charles Mingus", "Mingus Ah Um", "Vinyl", 0],
  ["Dave Brubeck", "Time Out", "Vinyl", 6],
  ["Bill Evans", "Waltz for Debby", "Vinyl", 10],
  ["Thelonious Monk", "Brilliant Corners", "Vinyl", 3],
  ["Herbie Hancock", "Head Hunters", "Vinyl", 9],

  // Electronic / Ambient
  ["Boards of Canada", "Music Has the Right to Children", "CD", 7],
  ["Burial", "Untrue", "CD", 10],
  ["Aphex Twin", "Selected Ambient Works", "CD", 4],
  ["Daft Punk", "Discovery", "CD", 4],
  ["Daft Punk", "Homework", "CD", 5],
  ["Brian Eno", "Ambient 1 Music for Airports", "Vinyl", 6],
  ["Kraftwerk", "Trans Europe Express", "Vinyl", 2],
  ["Massive Attack", "Mezzanine", "CD", 7],
  ["Portishead", "Dummy", "CD", 3],
  ["The Prodigy", "Music for the Jilted Generation", "CD", 8],
  ["Four Tet", "Rounds", "CD", 1],

  // Rock / Alternative
  ["Pink Floyd", "The Dark Side of the Moon", "Vinyl", 7],
  ["Pink Floyd", "Wish You Were Here", "Vinyl", 5],
  ["Led Zeppelin", "Led Zeppelin IV", "Vinyl", 8],
  ["The Beatles", "Abbey Road", "Vinyl", 5],
  ["Nirvana", "Nevermind", "Vinyl", 2],
  ["Radiohead", "OK Computer", "Vinyl", 10],
  ["Radiohead", "Kid A", "Vinyl", 6],
  ["My Bloody Valentine", "Loveless", "Vinyl", 4],
  ["Pixies", "Doolittle", "Vinyl", 8],
  ["Fleetwood Mac", "Rumours", "Vinyl", 0],
  ["David Bowie", "Ziggy Stardust", "Vinyl", 0],
  ["The Velvet Underground", "The Velvet Underground and Nico", "Vinyl", 11],
  ["Talking Heads", "Remain in Light", "Vinyl", 9],
  ["Sonic Youth", "Daydream Nation", "Vinyl", 7],
  ["Pavement", "Slanted and Enchanted", "Vinyl", 1],
  ["Built to Spill", "Keep It Like a Secret", "Vinyl", 1],

  // Hip-Hop
  ["Kendrick Lamar", "To Pimp a Butterfly", "Vinyl", 5],
  ["Kendrick Lamar", "good kid m.A.A.d city", "Vinyl", 2],
  ["Nas", "Illmatic", "Vinyl", 8],
  ["Lauryn Hill", "The Miseducation of Lauryn Hill", "Vinyl", 9],
  ["Madvillain", "Madvillainy", "Vinyl", 3],
  ["Kanye West", "My Beautiful Dark Twisted Fantasy", "Vinyl", 4],
  ["Jay-Z", "The Blueprint", "Vinyl", 0],
  ["A Tribe Called Quest", "The Low End Theory", "Vinyl", 1],

  // Soul / R&B / Funk
  ["Marvin Gaye", "Whats Going On", "Vinyl", 9],
  ["Stevie Wonder", "Songs in the Key of Life", "Vinyl", 5],
  ["Prince", "Purple Rain", "Vinyl", 7],
  ["Curtis Mayfield", "Superfly", "Vinyl", 11],
  ["James Brown", "In the Jungle Groove", "Vinyl", 5],
  ["Aretha Franklin", "I Never Loved a Man the Way I Love You", "Vinyl", 8],

  // Folk / Singer-Songwriter
  ["Joni Mitchell", "Blue", "Vinyl", 2],
  ["Nick Drake", "Pink Moon", "Vinyl", 4],
  ["Bob Dylan", "Blood on the Tracks", "Vinyl", 3],
  ["Sufjan Stevens", "Carrie and Lowell", "Vinyl", 6],
  ["Elliott Smith", "Either Or", "Vinyl", 10],

  // Post-Punk / New Wave
  ["Joy Division", "Unknown Pleasures", "Vinyl", 10],
  ["Joy Division", "Closer", "Vinyl", 3],
  ["The Cure", "Disintegration", "Vinyl", 7],
  ["The Smiths", "The Queen Is Dead", "Vinyl", 1],
  ["The Clash", "London Calling", "Vinyl", 8],
  ["Television", "Marquee Moon", "Vinyl", 0],
  ["Wire", "Pink Flag", "Vinyl", 4],
  ["Gang of Four", "Entertainment", "Vinyl", 8],
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchITunes(artist, album) {
  const q = encodeURIComponent(`${artist} ${album}`);
  const url = `https://itunes.apple.com/search?term=${q}&entity=album&limit=5&media=music`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes HTTP ${res.status}`);
  const data = await res.json();
  // Pick the result whose collectionName most closely matches our album title
  const term = album.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const candidates = data.results.filter((r) => r.wrapperType === "collection");
  const exact = candidates.find((r) =>
    r.collectionName.toLowerCase().replace(/[^a-z0-9 ]/g, "").includes(term.slice(0, 10))
  );
  return exact || candidates[0] || null;
}

function highResArtwork(url) {
  // iTunes returns 100x100 — swap to 600x600
  return url?.replace("100x100bb", "600x600bb").replace("60x60bb", "600x600bb") || null;
}

function catalogId(itunesId) {
  return `IT-${itunesId}`;
}

// ─── DB helpers ─────────────────────────────────────────────────────────────
async function upsertArtist(client, name) {
  const res = await client.query(
    `INSERT INTO artists (name, biography)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name, `${name} — curated for Groove & Co.`]
  );
  return res.rows[0].id;
}

async function upsertGenre(client, name) {
  const res = await client.query(
    `INSERT INTO genres (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name]
  );
  return res.rows[0].id;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`\n🎵  Groove & Co. — Real Album Seeder`);
  console.log(`    Fetching ${ALBUMS.length} albums from iTunes API…\n`);

  for (const [artist, album, preferredFormat, palette] of ALBUMS) {
    try {
      process.stdout.write(`  ⬇  ${artist} — ${album} … `);

      const data = await fetchITunes(artist, album);

      if (!data) {
        console.log("not found, skipping.");
        failed++;
        await sleep(1100);
        continue;
      }

      const catId = catalogId(data.collectionId);
      const artworkUrl = highResArtwork(data.artworkUrl100);
      const releaseYear = new Date(data.releaseDate).getFullYear();
      const genre = data.primaryGenreName || "Other";
      const realArtist = data.artistName;
      const realTitle = data.collectionName;
      const priceCents = priceForFormat(preferredFormat, data.collectionId);
      const stock = 5 + (data.collectionId % 20); // 5–24 units

      await client.query("BEGIN");

      const artistId = await upsertArtist(client, realArtist);
      const genreId = await upsertGenre(client, genre);

      // Insert album (skip if catalog_id already exists)
      const albumRes = await client.query(
        `INSERT INTO albums
           (catalog_id, title, artist_id, genre_id, release_year, description, artwork_palette, artwork_url, itunes_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (catalog_id) DO NOTHING
         RETURNING id`,
        [
          catId,
          realTitle,
          artistId,
          genreId,
          releaseYear,
          `${realTitle} by ${realArtist}. ${genre} classic, ${releaseYear}.`,
          palette,
          artworkUrl,
          data.collectionId,
        ]
      );

      if (albumRes.rowCount === 0) {
        await client.query("ROLLBACK");
        console.log("already in DB, skipped.");
        skipped++;
        await sleep(600);
        continue;
      }

      const albumId = albumRes.rows[0].id;

      // Insert the preferred format variant
      await client.query(
        `INSERT INTO product_variants
           (album_id, format, edition_name, price_cents, stock_quantity)
         VALUES ($1, $2, 'Standard', $3, $4)
         ON CONFLICT (album_id, format, edition_name) DO NOTHING`,
        [albumId, preferredFormat, priceCents, stock]
      );

      // Always add a Digital variant as well (at digital price)
      if (preferredFormat !== "Digital") {
        const digitalPrice = priceForFormat("Digital", data.collectionId + 1);
        await client.query(
          `INSERT INTO product_variants
             (album_id, format, edition_name, price_cents, stock_quantity)
           VALUES ($1, 'Digital', 'Standard', $2, 999)
           ON CONFLICT (album_id, format, edition_name) DO NOTHING`,
          [albumId, digitalPrice]
        );
      }

      await client.query("COMMIT");
      console.log(`✅  ${realTitle} (${releaseYear}) — ${preferredFormat} $${(priceCents / 100).toFixed(2)}`);
      inserted++;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.log(`❌  ERROR: ${err.message}`);
      failed++;
    }

    // Polite rate limiting — iTunes allows up to ~20 req/s but we're gentle
    await sleep(800);
  }

  client.release();
  await pool.end();

  console.log(`\n✨  Seeding complete!`);
  console.log(`    ✅ Inserted : ${inserted}`);
  console.log(`    ⏭  Skipped  : ${skipped}`);
  console.log(`    ❌ Failed   : ${failed}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
