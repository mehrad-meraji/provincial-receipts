import PersonCard from './PersonCard'
import type { PersonCardData } from '@/lib/people'

interface PeopleCarouselProps {
  people: PersonCardData[]
}

export default function PeopleCarousel({ people }: PeopleCarouselProps) {
  if (people.length === 0) return null

  // Duplicate cards to create a seamless infinite scroll loop
  const doubled = [...people, ...people]

  return (
    <section>
      <h2 className="mb-6 text-md uppercase font-bold dark:text-zinc-400 text-zinc-600">
        Connected Individuals
      </h2>
      <div className="relative overflow-hidden">
        <div className="flex gap-4 carousel-track">
          {doubled.map((person, i) => (
            <PersonCard
              key={`${person.slug}-${i}`}
              person={person}
              width={160}
              height={200}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
