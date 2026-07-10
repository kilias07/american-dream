'use client'
import React, { useEffect, useRef, useState } from 'react'

/**
 * Klient-owy „shell" nagłówka.
 *
 * Cały nagłówek (złota wstęga + granatowy nav) jest `fixed` na górze ekranu
 * i w całości „jeździ" za użytkownikiem — top bar jest zintegrowany z menu
 * i NIE chowa się przy scrollu (uwaga klienta z 2026-07: całość sticky).
 *
 * topBar / nav renderuje serwer (dane z Payload) i przekazuje tu jako sloty.
 */
export function HeaderShell({ topBar, nav }: { topBar: React.ReactNode; nav: React.ReactNode }) {
  const topRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const [spacerH, setSpacerH] = useState<number>() // rezerwa miejsca pod fixed headerem

  // Pomiar pełnej wysokości nagłówka (wstęga + nav) na potrzeby spacera.
  useEffect(() => {
    const measure = () => {
      const t = topRef.current?.offsetHeight ?? 0
      const n = navRef.current?.offsetHeight ?? 0
      setSpacerH(t + n)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full">
        {/* Złota wstęga — zawsze widoczna, zintegrowana z menu */}
        <div ref={topRef}>{topBar}</div>
        {/* Granatowy nav */}
        <div ref={navRef}>{nav}</div>
      </header>
      {/* Rezerwa miejsca pod fixed headerem (fallback zanim policzymy realną wysokość) */}
      <div aria-hidden className="h-[102px] lg:h-[122px]" style={spacerH ? { height: spacerH } : undefined} />
    </>
  )
}
