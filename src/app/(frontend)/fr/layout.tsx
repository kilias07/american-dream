import React from 'react'
import { Shell } from '@/components/Shell'
import { SetHtmlLang } from '@/components/SetHtmlLang'

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetHtmlLang lang="fr" />
      <Shell locale="fr">{children}</Shell>
    </>
  )
}
