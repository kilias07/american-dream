import * as migration_20260528_205011_initial from './20260528_205011_initial';
import * as migration_20260607_172843_remove_event_recurrence from './20260607_172843_remove_event_recurrence';
import * as migration_20260607_174528_add_series_section_fields from './20260607_174528_add_series_section_fields';
import * as migration_20260607_175554_add_event_detail_sections from './20260607_175554_add_event_detail_sections';
import * as migration_20260607_201349_add_musician_bio_page from './20260607_201349_add_musician_bio_page';
import * as migration_20260608_053135_sync_schema_drift from './20260608_053135_sync_schema_drift';
import * as migration_20260608_062039_add_hero_background_video from './20260608_062039_add_hero_background_video';

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
    name: '20260608_062039_add_hero_background_video'
  },
];
