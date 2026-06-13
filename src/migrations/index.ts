import * as migration_20260528_205011_initial from './20260528_205011_initial';
import * as migration_20260607_172843_remove_event_recurrence from './20260607_172843_remove_event_recurrence';
import * as migration_20260607_174528_add_series_section_fields from './20260607_174528_add_series_section_fields';
import * as migration_20260607_175554_add_event_detail_sections from './20260607_175554_add_event_detail_sections';
import * as migration_20260607_201349_add_musician_bio_page from './20260607_201349_add_musician_bio_page';
import * as migration_20260608_053135_sync_schema_drift from './20260608_053135_sync_schema_drift';
import * as migration_20260608_062039_add_hero_background_video from './20260608_062039_add_hero_background_video';
import * as migration_20260608_120923_add_show_on_homepage from './20260608_120923_add_show_on_homepage';
import * as migration_20260608_132940_reservations from './20260608_132940_reservations';
import * as migration_20260608_133322_reservation_settings from './20260608_133322_reservation_settings';
import * as migration_20260608_143009_add_reservation_anonymized_at from './20260608_143009_add_reservation_anonymized_at';
import * as migration_20260608_150000_merge_header_nav_items from './20260608_150000_merge_header_nav_items';
import * as migration_20260612_084523_add_block_text_fields from './20260612_084523_add_block_text_fields';
import * as migration_20260612_103801_add_event_slug from './20260612_103801_add_event_slug';
import * as migration_20260612_151806_add_offercards_style from './20260612_151806_add_offercards_style';
import * as migration_20260612_152457_add_menusection_image from './20260612_152457_add_menusection_image';
import * as migration_20260612_153252_add_setmenu_image from './20260612_153252_add_setmenu_image';

export const migrations = [
  {
    up: migration_20260528_205011_initial.up,
    down: migration_20260528_205011_initial.down,
    name: '20260528_205011_initial',
  },
  {
    up: migration_20260607_172843_remove_event_recurrence.up,
    down: migration_20260607_172843_remove_event_recurrence.down,
    name: '20260607_172843_remove_event_recurrence',
  },
  {
    up: migration_20260607_174528_add_series_section_fields.up,
    down: migration_20260607_174528_add_series_section_fields.down,
    name: '20260607_174528_add_series_section_fields',
  },
  {
    up: migration_20260607_175554_add_event_detail_sections.up,
    down: migration_20260607_175554_add_event_detail_sections.down,
    name: '20260607_175554_add_event_detail_sections',
  },
  {
    up: migration_20260607_201349_add_musician_bio_page.up,
    down: migration_20260607_201349_add_musician_bio_page.down,
    name: '20260607_201349_add_musician_bio_page',
  },
  {
    up: migration_20260608_053135_sync_schema_drift.up,
    down: migration_20260608_053135_sync_schema_drift.down,
    name: '20260608_053135_sync_schema_drift',
  },
  {
    up: migration_20260608_062039_add_hero_background_video.up,
    down: migration_20260608_062039_add_hero_background_video.down,
    name: '20260608_062039_add_hero_background_video',
  },
  {
    up: migration_20260608_120923_add_show_on_homepage.up,
    down: migration_20260608_120923_add_show_on_homepage.down,
    name: '20260608_120923_add_show_on_homepage',
  },
  {
    up: migration_20260608_132940_reservations.up,
    down: migration_20260608_132940_reservations.down,
    name: '20260608_132940_reservations',
  },
  {
    up: migration_20260608_133322_reservation_settings.up,
    down: migration_20260608_133322_reservation_settings.down,
    name: '20260608_133322_reservation_settings',
  },
  {
    up: migration_20260608_143009_add_reservation_anonymized_at.up,
    down: migration_20260608_143009_add_reservation_anonymized_at.down,
    name: '20260608_143009_add_reservation_anonymized_at',
  },
  {
    up: migration_20260608_150000_merge_header_nav_items.up,
    down: migration_20260608_150000_merge_header_nav_items.down,
    name: '20260608_150000_merge_header_nav_items',
  },
  {
    up: migration_20260612_084523_add_block_text_fields.up,
    down: migration_20260612_084523_add_block_text_fields.down,
    name: '20260612_084523_add_block_text_fields',
  },
  {
    up: migration_20260612_103801_add_event_slug.up,
    down: migration_20260612_103801_add_event_slug.down,
    name: '20260612_103801_add_event_slug',
  },
  {
    up: migration_20260612_151806_add_offercards_style.up,
    down: migration_20260612_151806_add_offercards_style.down,
    name: '20260612_151806_add_offercards_style',
  },
  {
    up: migration_20260612_152457_add_menusection_image.up,
    down: migration_20260612_152457_add_menusection_image.down,
    name: '20260612_152457_add_menusection_image',
  },
  {
    up: migration_20260612_153252_add_setmenu_image.up,
    down: migration_20260612_153252_add_setmenu_image.down,
    name: '20260612_153252_add_setmenu_image'
  },
];
