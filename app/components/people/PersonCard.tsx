import Image from 'next/image'
import Link from 'next/link'
import PersonBadge from './PersonBadge'
import type { PersonCardData } from '@/lib/people'

interface PersonCardProps {
  person: PersonCardData
  /** Card width in px — used for <Image> sizing. Defaults to 160. */
  width?: number
  /** Card height in px — used for <Image> sizing. Defaults to 200. */
  height?: number
}

export default function PersonCard({ person, width = 160, height = 200 }: PersonCardProps) {
  const { slug, name, photo_filename, organization, primary_connection_type } = person

  return (
    <Link
      href={`/people/${slug}`}
      className="block flex-none border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      style={{ width }}
    >
      {/* Photo or redacted placeholder */}
      <div className="person-photo-wrapper bg-zinc-950" style={{ height }}>
        {photo_filename ? (
          <Image
            src={`/people/${photo_filename}`}
            alt={name}
            width={width}
            height={height}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">[REDACTED]</span>
            <span className="font-mono text-xl font-bold text-zinc-600">
              {name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="font-mono text-xs font-bold text-zinc-950 dark:text-white leading-tight line-clamp-2">{name}</p>
        {organization && (
          <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{organization}</p>
        )}
        {primary_connection_type && (
          <div className="pt-1">
            <PersonBadge connection_type={primary_connection_type} />
          </div>
        )}
      </div>
    </Link>
  )
}
