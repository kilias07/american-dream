'use client'
import { motion, useScroll, useMotionValueEvent } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

/**
 * Klient-owy „shell” nagłówka (animacje: Motion / motion/react).
 *
 * - Cały nagłówek jest `fixed` na górze ekranu (granatowy nav zawsze widoczny).
 * - Złota wstęga (top bar) chowa się przy scrollu w DÓŁ i wraca przy scrollu w
 *   GÓRĘ. Realizujemy to przesuwając cały nagłówek o wysokość wstęgi (`y`), więc
 *   wstęga wyjeżdża nad viewport, a granatowy pasek dosuwa się pod sam top.
 *   Dodatkowo wstęga delikatnie zanika (opacity).
 *
 * topBar / nav renderuje serwer (dane z Payload) i przekazuje tu jako sloty.
 */
export function HeaderShell({ topBar, nav }: { topBar: React.ReactNode; nav: React.ReactNode }) {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  const topRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const [topH, setTopH] = useState(0) // wysokość złotej wstęgi (dystans przesunięcia)
  const [spacerH, setSpacerH] = useState<number>() // rezerwa miejsca pod fixed headerem

  // Kierunek scrolla → chowaj wstęgę przy zjeżdżaniu w dół (poniżej progu),
  // pokazuj przy scrollu w górę i blisko samej góry strony.
  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = lastY.current
    if (current > previous && current > 150) {
      setHidden(true)
    } else {
      setHidden(false)
    }
    lastY.current = current
  })

  // Pomiar wysokości: wstęga (dystans przesunięcia) + pełna wysokość nagłówka.
  useEffect(() => {
    const measure = () => {
      const t = topRef.current?.offsetHeight ?? 0
      const n = navRef.current?.offsetHeight ?? 0
      setTopH(t)
      setSpacerH(t + n)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 w-full"
        animate={{ y: hidden ? -topH : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Złota wstęga — zanika przy chowaniu */}
        <motion.div
          ref={topRef}
          animate={{ opacity: hidden ? 0 : 1 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {topBar}
        </motion.div>
        {/* Granatowy nav — zawsze widoczny */}
        <div ref={navRef}>{nav}</div>
      </motion.header>
      {/* Rezerwa miejsca pod fixed headerem (fallback zanim policzymy realną wysokość) */}
      <div aria-hidden className="h-[102px] lg:h-[122px]" style={spacerH ? { height: spacerH } : undefined} />
    </>
  )
}
