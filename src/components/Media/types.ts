import type { ElementType, Ref } from 'react'
import type { StaticImport } from 'next/dist/shared/lib/get-img-props'

import type { Media } from '@/payload-types'

export interface Props {
  alt?: string
  className?: string
  fill?: boolean
  htmlElement?: ElementType | null
  imgClassName?: string
  loading?: 'lazy' | 'eager'
  onClick?: () => void
  onLoad?: () => void
  pictureClassName?: string
  priority?: boolean
  ref?: Ref<HTMLImageElement | HTMLVideoElement>
  resource?: Media | string | number | null
  size?: string
  src?: StaticImport
  videoClassName?: string
}
