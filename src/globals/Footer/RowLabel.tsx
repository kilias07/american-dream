'use client'
import type { Footer } from '@/payload-types'
import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer['navColumns']>[number]>()

  const label = data?.data?.heading
    ? `Column ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data?.data?.heading}`
    : 'Nav Column'

  return <div>{label}</div>
}
