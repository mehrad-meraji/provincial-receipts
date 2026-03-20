'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'
import PersonCard from './PersonCard'
import type { PersonCardData } from '@/lib/people'

interface PeopleCarouselProps {
  people: PersonCardData[]
}

export default function PeopleCarousel({ people }: PeopleCarouselProps) {
  if (people.length === 0) return null

  const sorted = [...people].sort((a, b) =>
    (b.photo_filename ? 1 : 0) - (a.photo_filename ? 1 : 0)
  )

  const [emblaRef] = useEmblaCarousel({
    dragFree: true,
    align: 'start',
    loop: false,
  })

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-mono tracking-wider uppercase dark:text-zinc-400 text-zinc-600">
          Doug&apos;s Friends & Accomplices
        </h2>
        <Link
          href="/people"
          className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          View all →
        </Link>
      </div>
      <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing select-none h-72">
        <div className="flex gap-4">
          {sorted.map((person) => (
            <div key={person.slug} className="flex-none w-40">
              <PersonCard person={person} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
