import Image from 'next/image'
import Link from 'next/link'
import PersonBadge from './PersonBadge'
import type { PersonCardData } from '@/lib/people'

interface PersonCardProps {
  person: PersonCardData
}

export default function PersonCard({ person }: PersonCardProps) {
  const { slug, name, photo_filename, organization, primary_connection_type, total_cost_label } = person

  return (
    <Link
      href={`/people/${slug}`}
      className="w-full row-span-4 pb-2 grid grid-rows-subgrid border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
    >
      {/* Row 1: Photo — halftone layer is an inner div so the cost badge
           sits outside the filter and renders cleanly on top */}
      <div className="relative bg-zinc-950 aspect-9/16 w-full overflow-hidden">
        <div className={"person-photo-wrapper"}>
          <Image
            src={photo_filename ? `/people/${photo_filename}` : '/placeholder.jpg'}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
        {total_cost_label && (
          <span className="absolute top-2 right-2 z-10 font-mono text-sm font-bold text-white bg-red-600 rounded px-1.5 py-0.5 leading-none">
            {total_cost_label}
          </span>
        )}
      </div>

      {/* Row 2: Badge */}
      <div className="flex items-start px-2 pt-2">
        {primary_connection_type && (
          <PersonBadge connection_type={primary_connection_type} />
        )}
      </div>

      {/* Row 3: Name */}
      <p className="px-2 font-mono text-xs font-bold text-zinc-950 dark:text-white leading-tight line-clamp-2">
        {name}
      </p>

      {/* Row 4: Organization */}
      <p className="px-2 pt-1 pb-3 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
        {organization ?? ''}
      </p>
    </Link>
  )
}
