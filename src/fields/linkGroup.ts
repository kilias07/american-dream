import type { ArrayField } from 'payload'
import { link } from './link'

type Appearances = 'default' | 'outline'

type LinkGroupOptions = {
  appearances?: false | Appearances[]
  overrides?: Partial<ArrayField>
}

export const linkGroup = ({ appearances, overrides = {} }: LinkGroupOptions = {}): ArrayField => {
  return {
    name: 'links',
    type: 'array',
    fields: [link({ appearances })],
    admin: {
      initCollapsed: true,
    },
    maxRows: 2,
    ...overrides,
  }
}
