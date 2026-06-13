import React from 'react'
import { Shell } from '@/components/Shell'

export default function PlLayout({ children }: { children: React.ReactNode }) {
  return <Shell locale="pl">{children}</Shell>
}
