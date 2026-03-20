import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260319_121518 from './20260319_121518';
import * as migration_20260320_120341 from './20260320_120341';

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
    name: '20260320_120341'
  },
];
