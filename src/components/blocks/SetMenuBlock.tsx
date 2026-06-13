import React from 'react'
import Image from 'next/image'
import type { SetMenuBlock as SetMenuBlockType, Media } from '@/payload-types'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function SetMenuBlock({
  block,
}: {
  block: SetMenuBlockType
  locale: string
}) {
  const { heading, subtitle, dateLabel, menus } = block
  const image = isMedia(block.image) ? block.image : null

  if (!heading && !menus?.length) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Header — with a side photo (design) when an image is set, else centered. */}
        {image ? (
          <div className="mb-10 flex flex-col md:flex-row bg-brand-navy-royal rounded-2xl overflow-hidden">
            <div className="flex-1 flex flex-col justify-center p-8 md:p-10 text-center md:text-left">
              {heading && (
                <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight">{heading}</h2>
              )}
              {subtitle && <p className="text-white/70 text-sm md:text-base mt-3">{subtitle}</p>}
              {dateLabel && (
                <span className="inline-flex self-center md:self-start items-center mt-4 bg-brand-gold text-brand-navy text-sm font-bold uppercase tracking-[0.12em] px-4 py-1.5 rounded-full">
                  {dateLabel}
                </span>
              )}
            </div>
            <div className="relative w-full md:w-2/5 aspect-[4/3] md:aspect-auto md:min-h-[300px] flex-shrink-0">
              <Image
                src={image.url || ''}
                alt={image.alt || heading || ''}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>
        ) : (
          <div className="text-center mb-10">
            {heading && (
              <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight">{heading}</h2>
            )}
            {subtitle && <p className="text-white/70 text-sm md:text-base mt-3">{subtitle}</p>}
            {dateLabel && (
              <span className="inline-flex items-center mt-4 bg-brand-gold text-brand-navy text-sm font-bold uppercase tracking-[0.12em] px-4 py-1.5 rounded-full">
                {dateLabel}
              </span>
            )}
          </div>
        )}

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
