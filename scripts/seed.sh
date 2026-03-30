#!/bin/bash
# Seed script — restores dev database to a working state.
# Usage: ./scripts/seed.sh
# Run after `pnpm run payload migrate` on a fresh local D1 database.

set -e

DB=$(find .wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" | head -1)

if [ -z "$DB" ]; then
  echo "ERROR: Local D1 SQLite file not found. Start the dev server once first, then run this script."
  exit 1
fi

echo "Seeding: $DB"

sqlite3 "$DB" <<'SQL'

-- ── ADMIN USER ──────────────────────────────────────────────────────────────
-- kamilkiliasinski@gmail.com / test123
DELETE FROM users;
INSERT INTO users (id, email, hash, salt, updated_at, created_at)
VALUES (1, 'kamilkiliasinski@gmail.com',
        '0b019592e72d7ea5b604bc50880a7579a458c4318859682b490b276fba4f1c8ec819651b3b9ce4b377e831c3c9fa8b7133ee8d7433599ac2eda434afcd36ddf8d08630dbc2aea1bd00c0762bdb5cd9f241ab3d8891e82cac6cd6da42fea11bee8470d7c07afaefbcd9faf02fb55fa57886129344aa7de1e1293f54fc633399f57a631621937caa883fe197c359d4e4e3bc3057c4ad14f00b355c7918fbba7c9776383850ff5db6147c702bce2a9c17a1444e5cb78dbb33103be4d4c1d8c6e042c0b9af49494d781bf9171e0864ed8e4f0c2086c48054e0df8c67de49c1a01319820b391f499f6dfb51c21a158cb120b191be42111af944f2928e3dc7e47093b8b6768d1dc602fa6193e70b39328865a36290d2cc9861d445d55dd6a76ce1b29b9b6aa87415403adf310e10fc1842f2677b4ed667c7de74e1609edf5ed430171f13b0f8a351bb0165c3fe37af6a85bdbb834c9db19948544ad19253ae4e5e432baa19b30e65c4e1bf879057eef2bf6dbcba1d04667928c64fd381eef57d640afe471d1d57e0dda5de9bf4af014d07fbc1c13f3b9454291f4814ed8d57666efae558ec8669530fb677815de9caa4de62f2a5f2fd66c98222474adb4131919277b62d69109e2bb99e8e7e5dd6cf7f6ae1310b731e0ab65be106e3e0989b89e6e6799e8108f206d0461a18da27be142246076533a7f8c0608161d0460c00b482e6c5',
        '343f328502f05a8608921a4a1c19c1ebe4f1d138cd7d8d4d23107673ddf6316e',
        strftime('%Y-%m-%dT%H:%M:%fZ','now'),
        strftime('%Y-%m-%dT%H:%M:%fZ','now'));

-- ── HEADER ──────────────────────────────────────────────────────────────────
DELETE FROM header_social_links;
DELETE FROM header_nav_items_right;
DELETE FROM header_nav_items_left;
DELETE FROM header_locales;
DELETE FROM header;

INSERT INTO header (id, phone, address, cta_enabled, cta_button_type, cta_button_url, cta_button_label, updated_at, created_at)
VALUES (1, '132312132', 'Poznań, ul. Przykładowa 1', 1, 'custom', '/rezerwacja', 'REZERWACJA',
        strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT INTO header_locales (_locale, _parent_id, top_bar_text) VALUES
  ('pl', 1, 'Welcome to American Dream Club – Jazz & Restaurant, Poznań'),
  ('en', 1, 'Welcome to American Dream Club – Jazz & Restaurant, Poznań');

INSERT INTO header_nav_items_left (_order, _parent_id, id, link_type, link_url, link_label) VALUES
  (1, 1, 'nav-l-1', 'custom', '/imprezy', 'IMPREZY'),
  (2, 1, 'nav-l-2', 'custom', '/test', 'TEST');

INSERT INTO header_social_links (_order, _parent_id, id, platform, url) VALUES
  (1, 1, 'social-1', 'facebook',  'https://facebook.com/americandreampoznan'),
  (2, 1, 'social-2', 'instagram', 'https://instagram.com/americandreampoznan'),
  (3, 1, 'social-3', 'youtube',   'https://youtube.com');

-- ── EVENTS ──────────────────────────────────────────────────────────────────
DELETE FROM events_repeat_days;
DELETE FROM events_locales;
DELETE FROM events;

INSERT INTO events (id, date, end_time, price, featured, is_recurring, repeat_type, repeat_until, updated_at, created_at) VALUES
  (1, '2026-04-05T22:00:00.000Z', '23:00', 80,  1, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (2, '2026-04-05T23:00:00.000Z', '23:30', 60,  0, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (3, '2026-04-05T22:30:00.000Z', '23:00', 100, 0, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (4, '2026-04-05T23:00:00.000Z', '00:00', 70,  0, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (5, '2026-04-05T22:00:00.000Z', '23:30', 90,  0, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (6, '2026-04-06T20:00:00.000Z', '22:00', 50,  0, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (7, '2026-04-03T21:00:00.000Z', '23:00', 120, 0, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (8, '2026-04-04T22:00:00.000Z', '00:00', 0,   0, 1, 'weekly', '2026-12-31T00:00:00.000Z', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT INTO events_locales (title, description, _locale, _parent_id) VALUES
  ('Jazz Night with Maria Kowalska', 'Wyjątkowy wieczór z jazzem na żywo', 'pl', 1),
  ('Latin Fiesta',                   'Gorące rytmy latynoskie',             'pl', 2),
  ('Grand Gala Evening',             'Elegancki wieczór galowy',            'pl', 3),
  ('Sunday Swing',                   'Swingujące niedzielne popołudnie',    'pl', 4),
  ('Blues & Soul Night',             'Wieczór bluesa i soulu',              'pl', 5),
  ('Acoustic Session',               'Kameralna sesja akustyczna',          'pl', 6),
  ('Big Band Thursday',              'Czwartkowy wieczór z big bandem',     'pl', 7),
  ('Open Mic Friday',                'Piątek z otwartym mikrofonem',        'pl', 8);

INSERT INTO events_locales (title, description, _locale, _parent_id) VALUES
  ('Jazz Night with Maria Kowalska', 'A special evening of live jazz',   'en', 1),
  ('Latin Fiesta',                   'Hot Latin rhythms',                'en', 2),
  ('Grand Gala Evening',             'An elegant gala evening',          'en', 3),
  ('Sunday Swing',                   'Swinging Sunday afternoon',        'en', 4),
  ('Blues & Soul Night',             'An evening of blues and soul',     'en', 5),
  ('Acoustic Session',               'An intimate acoustic session',     'en', 6),
  ('Big Band Thursday',              'Thursday evening with big band',   'en', 7),
  ('Open Mic Friday',                'Friday open mic night',            'en', 8);

INSERT INTO events_repeat_days ("order", parent_id, id, value) VALUES
  (1, 1, 'rd-1-1', 'sat'), (1, 2, 'rd-2-1', 'sat'), (1, 3, 'rd-3-1', 'sat'),
  (1, 4, 'rd-4-1', 'sat'), (1, 5, 'rd-5-1', 'sat'),
  (1, 6, 'rd-6-1', 'sun'),
  (1, 7, 'rd-7-1', 'thu'),
  (1, 8, 'rd-8-1', 'fri');

-- ── FOOTER ──────────────────────────────────────────────────────────────────
DELETE FROM footer_social_links;
DELETE FROM footer_bottom_bar_links;
DELETE FROM footer_nav_columns_links;
DELETE FROM footer_nav_columns;
DELETE FROM footer;

INSERT INTO footer (id, updated_at, created_at)
VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT INTO footer_nav_columns (_order, _parent_id, id) VALUES
  (1, 1, 'fc-1'),
  (2, 1, 'fc-2'),
  (3, 1, 'fc-3');

INSERT INTO footer_nav_columns_locales (heading, _locale, _parent_id) VALUES
  ('Klub',        'pl', 'fc-1'), ('Club',         'en', 'fc-1'),
  ('Oferta',      'pl', 'fc-2'), ('Offer',        'en', 'fc-2'),
  ('Rezerwacje',  'pl', 'fc-3'), ('Reservations', 'en', 'fc-3');

INSERT INTO footer_nav_columns_links (_order, _parent_id, id, url) VALUES
  (1, 'fc-1', 'fcl-1-1', '/kontakt'),
  (2, 'fc-1', 'fcl-1-2', '/opinie'),
  (3, 'fc-1', 'fcl-1-3', '/galeria'),
  (1, 'fc-2', 'fcl-2-1', '/restauracja'),
  (2, 'fc-2', 'fcl-2-2', '/cocktail-bar'),
  (3, 'fc-2', 'fcl-2-3', '/cygara'),
  (1, 'fc-3', 'fcl-3-1', '/rezerwacja'),
  (2, 'fc-3', 'fcl-3-2', '/imprezy-prywatne'),
  (3, 'fc-3', 'fcl-3-3', '/imprezy-firmowe');

INSERT INTO footer_nav_columns_links_locales (label, _locale, _parent_id) VALUES
  ('Kontakt',   'pl', 'fcl-1-1'), ('Contact',           'en', 'fcl-1-1'),
  ('Opinie',    'pl', 'fcl-1-2'), ('Reviews',           'en', 'fcl-1-2'),
  ('Galeria',   'pl', 'fcl-1-3'), ('Gallery',           'en', 'fcl-1-3'),
  ('Restauracja',        'pl', 'fcl-2-1'), ('Restaurant',        'en', 'fcl-2-1'),
  ('Cocktail Bar & Wino','pl', 'fcl-2-2'), ('Cocktail Bar & Wine','en', 'fcl-2-2'),
  ('Cygara',             'pl', 'fcl-2-3'), ('Cigars',            'en', 'fcl-2-3'),
  ('Rezerwacje indywidualne','pl', 'fcl-3-1'), ('Individual Reservations','en', 'fcl-3-1'),
  ('Imprezy prywatne',       'pl', 'fcl-3-2'), ('Private Events',         'en', 'fcl-3-2'),
  ('Imprezy firmowe',        'pl', 'fcl-3-3'), ('Corporate Events',       'en', 'fcl-3-3');

INSERT INTO footer_bottom_bar_links (_order, _parent_id, id, url) VALUES
  (1, 1, 'fbl-1', '/regulamin'),
  (2, 1, 'fbl-2', '/polityka-prywatnosci'),
  (3, 1, 'fbl-3', '/dane-firmy');

INSERT INTO footer_bottom_bar_links_locales (label, _locale, _parent_id) VALUES
  ('Regulamin klubu',                                       'pl', 'fbl-1'),
  ('Club Rules',                                            'en', 'fbl-1'),
  ('Polityka prywatności i zasady dotyczące plików cookie', 'pl', 'fbl-2'),
  ('Privacy Policy & Cookie Settings',                      'en', 'fbl-2'),
  ('Dane firmy',        'pl', 'fbl-3'),
  ('Company Details',   'en', 'fbl-3');

INSERT INTO footer_social_links (_order, _parent_id, id, platform, url) VALUES
  (1, 1, 'fsl-1', 'google',    'https://google.com'),
  (2, 1, 'fsl-2', 'facebook',  'https://facebook.com/americandreampoznan'),
  (3, 1, 'fsl-3', 'instagram', 'https://instagram.com/americandreampoznan'),
  (4, 1, 'fsl-4', 'youtube',   'https://youtube.com');

-- ── PAGES ───────────────────────────────────────────────────────────────────
DELETE FROM pages_blocks_bento_section_items;
DELETE FROM pages_blocks_bento_section;
DELETE FROM pages_blocks_events_calendar;
DELETE FROM pages_blocks_hero_banner;
DELETE FROM pages_locales;
DELETE FROM pages;

INSERT INTO pages (id, slug, _status, updated_at, created_at) VALUES
  (1,  'home',              'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (2,  'kontakt',           'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (3,  'opinie',            'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (4,  'galeria',           'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (5,  'restauracja',       'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (6,  'cocktail-bar',      'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (7,  'cygara',            'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (8,  'rezerwacja',        'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (9,  'imprezy-prywatne',  'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (10, 'imprezy-firmowe',   'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (11, 'regulamin',         'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (12, 'polityka-prywatnosci', 'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  (13, 'dane-firmy',        'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT INTO pages_locales (title, _locale, _parent_id) VALUES
  ('Strona Główna',             'pl', 1),  ('Home',                    'en', 1),
  ('Kontakt',                   'pl', 2),  ('Contact',                 'en', 2),
  ('Opinie',                    'pl', 3),  ('Reviews',                 'en', 3),
  ('Galeria',                   'pl', 4),  ('Gallery',                 'en', 4),
  ('Restauracja',               'pl', 5),  ('Restaurant',              'en', 5),
  ('Cocktail Bar & Wino',       'pl', 6),  ('Cocktail Bar & Wine',     'en', 6),
  ('Cygara',                    'pl', 7),  ('Cigars',                  'en', 7),
  ('Rezerwacja',                'pl', 8),  ('Reservation',             'en', 8),
  ('Imprezy Prywatne',          'pl', 9),  ('Private Events',          'en', 9),
  ('Imprezy Firmowe',           'pl', 10), ('Corporate Events',        'en', 10),
  ('Regulamin Klubu',           'pl', 11), ('Club Rules',              'en', 11),
  ('Polityka Prywatności',      'pl', 12), ('Privacy Policy',          'en', 12),
  ('Dane Firmy',                'pl', 13), ('Company Information',     'en', 13);

-- Block 1: Hero banner (localized fields stored directly on row)
INSERT INTO pages_blocks_hero_banner (_order, _parent_id, _path, _locale, id, heading, subtext, cta_link_type, cta_link_url, cta_link_label, cta_icon, block_name)
VALUES
  (1, 1, 'layout', 'pl', 'hero-pl-1', 'THIS IS HERO', 'ads sadadssa dasd asd ads', 'custom', '/program', 'POST HOME', 'ticket', NULL),
  (1, 1, 'layout', 'en', 'hero-en-1', 'THIS IS HERO', 'ads sadadssa dasd asd ads', 'custom', '/program', 'POST HOME', 'ticket', NULL);

-- Block 2: Events calendar (localized fields stored directly on row)
INSERT INTO pages_blocks_events_calendar (_order, _parent_id, _path, _locale, id, variant, color_scheme, heading, cta_label, events_source, auto_count, block_name)
VALUES
  (2, 1, 'layout', 'pl', 'ec-pl-1', 'teaser', 'gold', 'NADCHODZĄCE WYDARZENIA', 'ZAREZERWUJ STOLIK', 'auto', 8, NULL),
  (2, 1, 'layout', 'en', 'ec-en-1', 'teaser', 'gold', 'UPCOMING EVENTS',        'BOOK A TABLE',      'auto', 8, NULL);

-- Block 3: Bento section (localized fields stored directly on row)
INSERT INTO pages_blocks_bento_section (_order, _parent_id, _path, _locale, id, subheading, heading, description, block_name)
VALUES
  (3, 1, 'layout', 'pl', 'bento-pl-1', 'O NAS', 'AMERICAN DREAM CLUB', 'Jazz, muzyka na żywo i restauracja w sercu Poznania.', NULL),
  (3, 1, 'layout', 'en', 'bento-en-1', 'ABOUT US', 'AMERICAN DREAM CLUB', 'Jazz, live music and restaurant in the heart of Poznań.', NULL);

INSERT INTO pages_blocks_bento_section_items (_order, _parent_id, id, col_span, label, title, cta_label, cta_url)
VALUES
  (1, 'bento-pl-1', 'bi-pl-1', 'full',  'MUZYKA NA ŻYWO', 'Wyjątkowe wieczory z najlepszymi artystami', 'DOWIEDZ SIĘ WIĘCEJ', '/muzyka'),
  (2, 'bento-pl-1', 'bi-pl-2', 'half',  'RESTAURACJA',    'Kuchnia inspirowana amerykańskim południem',  'MENU',               '/menu'),
  (3, 'bento-pl-1', 'bi-pl-3', 'half',  'REZERWACJE',     'Zarezerwuj stolik na wyjątkowy wieczór',     'REZERWUJ',           '/rezerwacja'),
  (1, 'bento-en-1', 'bi-en-1', 'full',  'LIVE MUSIC',     'Exceptional evenings with the best artists', 'LEARN MORE',         '/muzyka'),
  (2, 'bento-en-1', 'bi-en-2', 'half',  'RESTAURANT',     'Cuisine inspired by the American south',     'MENU',               '/menu'),
  (3, 'bento-en-1', 'bi-en-3', 'half',  'RESERVATIONS',   'Book a table for a special evening',         'RESERVE',            '/rezerwacja');

-- ── SUMMARY ─────────────────────────────────────────────────────────────────
SELECT 'header:       ' || COUNT(*) FROM header;
SELECT 'footer:       ' || COUNT(*) FROM footer;
SELECT 'footer cols:  ' || COUNT(*) FROM footer_nav_columns;
SELECT 'events:       ' || COUNT(*) FROM events;
SELECT 'pages:        ' || COUNT(*) FROM pages;
SELECT 'hero:         ' || COUNT(*) FROM pages_blocks_hero_banner;
SELECT 'cal:          ' || COUNT(*) FROM pages_blocks_events_calendar;
SELECT 'bento:        ' || COUNT(*) FROM pages_blocks_bento_section;

SQL

echo "✓ Seed complete."
