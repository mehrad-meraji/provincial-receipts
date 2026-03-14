interface SectionDividerProps {
  label: string
}

export default function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="my-6">
      <div className="border-t-4 border-zinc-950 dark:border-white pt-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {label}
        </h2>
      </div>
    </div>
  )
}
