import React from 'react'
import { InitTheme } from '@/providers/Theme/InitTheme'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
      </head>
      <body>{children}</body>
    </html>
  )
}
