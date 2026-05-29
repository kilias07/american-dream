import * as migration_20260528_205011_initial from './20260528_205011_initial';

export const migrations = [
  {
    up: migration_20260528_205011_initial.up,
    down: migration_20260528_205011_initial.down,
    name: '20260528_205011_initial'
  },
];
