import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260319_121518 from './20260319_121518';
import * as migration_20260320_120341 from './20260320_120341';
import * as migration_20260329_000001 from './20260329_000001';
import * as migration_20260329_000002 from './20260329_000002';
import * as migration_20260329_000003 from './20260329_000003';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260319_121518.up,
    down: migration_20260319_121518.down,
    name: '20260319_121518',
  },
  {
    up: migration_20260320_120341.up,
    down: migration_20260320_120341.down,
    name: '20260320_120341',
  },
  {
    up: migration_20260329_000001.up,
    down: migration_20260329_000001.down,
    name: '20260329_000001',
  },
  {
    up: migration_20260329_000002.up,
    down: migration_20260329_000002.down,
    name: '20260329_000002',
  },
  {
    up: migration_20260329_000003.up,
    down: migration_20260329_000003.down,
    name: '20260329_000003',
  },
];
