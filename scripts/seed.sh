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

-- ── HOMEPAGE ────────────────────────────────────────────────────────────────
DELETE FROM pages_blocks_bento_section_items;
DELETE FROM pages_blocks_bento_section;
DELETE FROM pages_blocks_events_calendar;
DELETE FROM pages_blocks_hero_banner;
DELETE FROM pages_locales;
DELETE FROM pages;

INSERT INTO pages (id, slug, _status, updated_at, created_at)
VALUES (1, 'home', 'published', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

INSERT INTO pages_locales (title, _locale, _parent_id) VALUES
  ('Strona Główna', 'pl', 1),
  ('Home',          'en', 1);

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
SELECT 'header:  ' || COUNT(*) FROM header;
SELECT 'events:  ' || COUNT(*) FROM events;
SELECT 'pages:   ' || COUNT(*) FROM pages;
SELECT 'hero:    ' || COUNT(*) FROM pages_blocks_hero_banner;
SELECT 'cal:     ' || COUNT(*) FROM pages_blocks_events_calendar;
SELECT 'bento:   ' || COUNT(*) FROM pages_blocks_bento_section;

SQL

echo "✓ Seed complete."
