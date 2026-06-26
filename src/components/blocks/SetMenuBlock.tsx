import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SetMenuBlock as SetMenuBlockType, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

/** Gold course label flanked by two long rules that fade out at the outer ends. */
function CourseLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-5">
      <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-brand-gold" />
      <span className="text-brand-gold text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">
        {children}
      </span>
      <span className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-brand-gold" />
    </div>
  )
}

export function SetMenuBlock({
  block,
  locale,
}: {
  block: SetMenuBlockType
  locale: string
}) {
  const { heading, headingScript, subtitle, dateLabel, body, ctaLabel, ctaUrl, menus } = block
  const image = isMedia(block.image) ? block.image : null

  if (!heading && !menus?.length) return null

  const hasHeader = heading || subtitle || dateLabel || body
  const ctaHref = ctaUrl
    ? ctaUrl.startsWith('/')
      ? localeHref(locale as Locale, ctaUrl)
      : ctaUrl
    : null
  const ctaClass =
    'inline-flex items-center justify-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-7 py-3 rounded-full hover:bg-brand-gold-dark transition-colors'

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Header banner — bordered card, full-bleed photo with a blue duotone;
            text on the left, reservation CTA bottom-right (Dinner Time Specials). */}
        {hasHeader && (
          <div className="relative mb-14 md:mb-20 rounded-3xl overflow-hidden ring-1 ring-brand-gold/60 bg-brand-navy-royal">
            {image?.url && (
              <Image
                src={image.url}
                alt={image.alt || heading || ''}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            )}
            {/* Blue duotone: recolor the whole photo to a royal blue (keeps it
                visible), a flat darken for contrast, then a left-side scrim so the
                copy stays legible over the image. */}
            <div className="absolute inset-0 bg-[#1b3f8f] mix-blend-color" />
            <div className="absolute inset-0 bg-brand-navy/45" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/85 via-brand-navy/35 to-transparent" />

            <div className="relative flex flex-col md:justify-center p-8 md:p-12 lg:p-14 md:min-h-[440px]">
              <div className="max-w-xl">
                {heading && (
                  <div className="inline-block">
                    <h2 className="font-serif text-white text-5xl md:text-6xl leading-[0.95]">{heading}</h2>
                    {headingScript && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-gold" />
                        <span className="font-serif italic text-brand-gold text-2xl md:text-3xl leading-none">
                          {headingScript}
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-gold" />
                      </div>
                    )}
                  </div>
                )}

                {subtitle && (
                  <p className="text-white text-lg md:text-xl font-semibold mt-8">{subtitle}</p>
                )}

                {dateLabel && (
                  <span className="inline-flex items-center mt-4 border-2 border-white text-white text-lg md:text-xl font-bold px-5 py-2 rounded-lg">
                    {dateLabel}
                  </span>
                )}

                {body && (
                  <p className="text-white/75 text-sm md:text-base leading-relaxed mt-5 max-w-md">{body}</p>
                )}
              </div>

              {/* CTA — pinned bottom-right beside the photo on desktop, stacked on mobile. */}
              {ctaLabel && (
                <div className="mt-8 md:mt-0 md:absolute md:bottom-12 md:right-12 lg:bottom-14 lg:right-14">
                  {ctaHref ? (
                    <Link href={ctaHref} className={ctaClass}>
                      {ctaLabel}
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menus — each one a photo on the left + structured courses on the right. */}
        {menus && menus.length > 0 && (
          <div className="flex flex-col gap-14 md:gap-20">
            {menus.map((menu, i) => {
              const menuImage = isMedia(menu.image) ? menu.image : null
              return (
                <div
                  key={menu.id || i}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_7fr] gap-8 md:gap-12 items-center"
                >
                  {/* Photo */}
                  {menuImage?.url && (
                    <div className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-brand-gold/40 bg-brand-navy-royal">
                      <Image
                        src={menuImage.url}
                        alt={menuImage.alt || menu.name || 'Menu'}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, 40vw"
                      />
                    </div>
                  )}

                  {/* Courses */}
                  <div className="text-center">
                    {menu.name && (
                      <h3 className="text-white text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] leading-tight mb-8 md:mb-10">
                        {menu.name}
                        {typeof menu.price === 'number' && (
                          <span className="block text-brand-gold text-base font-bold tracking-normal mt-2">
                            {menu.price} zł
                          </span>
                        )}
                      </h3>
                    )}

                    {menu.courses && menu.courses.length > 0 && (
                      <ul className="flex flex-col gap-8 md:gap-10">
                        {menu.courses.map((course, j) => (
                          <li key={course.id || j}>
                            {course.courseLabel && <CourseLabel>{course.courseLabel}</CourseLabel>}
                            {course.dish && (
                              <p className="text-white text-xl md:text-2xl font-semibold uppercase tracking-[0.06em] mt-3">
                                {course.dish}
                              </p>
                            )}
                            {course.description && (
                              <p className="text-white/65 text-sm md:text-base leading-relaxed mt-2 max-w-md mx-auto">
                                {course.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
