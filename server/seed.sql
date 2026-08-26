INSERT INTO artists (name, biography) VALUES
  ('Marbled Static', 'A patient ambient project built from tape hiss, room tone, and nocturnal melodies.'),
  ('Vale & Iron', 'A post-punk duo interested in hard edges, loose wires, and songs that refuse to sit still.'),
  ('Fen Widow', 'Folk songs gathered from quiet places and arranged with a little weather in them.'),
  ('Ultraviolet Traffic', 'Electronic music for empty motorways and fluorescent hours.'),
  ('Quiet Ordinance', 'Minimal compositions for the space between one thought and the next.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO genres (name) VALUES ('Ambient'), ('Post-Punk'), ('Folk'), ('Electronic') ON CONFLICT (name) DO NOTHING;

INSERT INTO albums (catalog_id, title, artist_id, genre_id, release_year, description, artwork_palette)
SELECT v.catalog_id, v.title, a.id, g.id, v.release_year, v.description, v.artwork_palette
FROM (VALUES
  ('GR-001', 'Nightshade Hours', 'Marbled Static', 'Ambient', 1987, 'Reissued LP sourced from a forgotten catalog, chosen by ear.', 0),
  ('GR-002', 'Concrete Choir', 'Vale & Iron', 'Post-Punk', 1981, 'Hard-edged songs with a pulse under the concrete.', 2),
  ('GR-003', 'Low Tide Sermons', 'Fen Widow', 'Folk', 1974, 'Weathered folk songs from the edge of the map.', 3),
  ('GR-004', 'Sodium Glow', 'Ultraviolet Traffic', 'Electronic', 1993, 'Electronic music for fluorescent hours.', 4),
  ('GR-005', 'Rooftop Static', 'Marbled Static', 'Ambient', 1989, 'Signals from a city after midnight.', 5),
  ('GR-006', 'Splinter Kingdom', 'Vale & Iron', 'Post-Punk', 1983, 'A sharp, restless record with a human center.', 1),
  ('GR-007', 'Salt Chapel', 'Fen Widow', 'Folk', 1976, 'A spare and luminous collection of songs.', 0),
  ('GR-008', 'Chrome Orchard', 'Ultraviolet Traffic', 'Electronic', 1995, 'Bright machines and long shadows.', 2),
  ('GR-009', 'Held Breath', 'Quiet Ordinance', 'Ambient', 1990, 'Minimal music for close listening.', 3)
) AS v(catalog_id, title, artist, genre, release_year, description, artwork_palette)
JOIN artists a ON a.name = v.artist
JOIN genres g ON g.name = v.genre
ON CONFLICT (catalog_id) DO NOTHING;

INSERT INTO product_variants (album_id, format, edition_name, price_cents, stock_quantity)
SELECT id, CASE WHEN catalog_id IN ('GR-001','GR-002','GR-006','GR-007','GR-009') THEN 'Vinyl' WHEN catalog_id = 'GR-003' THEN 'Cassette' WHEN catalog_id = 'GR-005' THEN 'CD' ELSE 'Digital' END, 'Standard', CASE WHEN catalog_id = 'GR-001' THEN 3200 WHEN catalog_id = 'GR-002' THEN 2800 WHEN catalog_id = 'GR-003' THEN 3400 WHEN catalog_id = 'GR-004' THEN 3000 WHEN catalog_id = 'GR-005' THEN 3200 WHEN catalog_id = 'GR-006' THEN 2600 WHEN catalog_id = 'GR-007' THEN 3600 WHEN catalog_id = 'GR-008' THEN 3000 ELSE 3300 END, 12
FROM albums ON CONFLICT (album_id, format, edition_name) DO NOTHING;
