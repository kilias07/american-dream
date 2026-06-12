import React from 'react'
import type { SetMenuBlock as SetMenuBlockType } from '@/payload-types'

export function SetMenuBlock({
  block,
}: {
  block: SetMenuBlockType
  locale: string
}) {
  const { heading, subtitle, dateLabel, menus } = block

  if (!heading && !menus?.length) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-10">
          {heading && (
            <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight">{heading}</h2>
          )}
          {subtitle && (
            <p className="text-white/70 text-sm md:text-base mt-3">{subtitle}</p>
          )}
          {dateLabel && (
            <span className="inline-flex items-center mt-4 bg-brand-gold text-brand-navy text-sm font-bold uppercase tracking-[0.12em] px-4 py-1.5 rounded-full">
              {dateLabel}
            </span>
          )}
        </div>

        {/* Menus */}
        {menus && menus.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {menus.map((menu, i) => (
              <div key={menu.id || i} className="border border-white/10 rounded-2xl p-6 md:p-8">
                <div className="flex items-baseline justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                  {menu.name && (
                    <h3 className="text-white text-lg md:text-xl font-bold uppercase tracking-wide">
                      {menu.name}
                    </h3>
                  )}
                  {typeof menu.price === 'number' && (
                    <span className="text-brand-gold text-lg font-bold whitespace-nowrap">
                      {menu.price} zł
                    </span>
                  )}
                </div>

                {menu.courses && menu.courses.length > 0 && (
                  <ul className="flex flex-col gap-5">
                    {menu.courses.map((course, j) => (
                      <li key={course.id || j}>
                        {course.courseLabel && (
                          <p className="text-brand-gold text-[11px] font-bold uppercase tracking-[0.14em] mb-1">
                            {course.courseLabel}
                          </p>
                        )}
                        {course.dish && (
                          <p className="text-white font-bold leading-snug">{course.dish}</p>
                        )}
                        {course.description && (
                          <p className="text-white/60 text-sm leading-relaxed mt-0.5">
                            {course.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
