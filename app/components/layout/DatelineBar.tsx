export default function DatelineBar() {
  const date = new Date().toLocaleDateString('en-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
      <span className="uppercase tracking-wider">{date}</span>
    </div>
  )
}
