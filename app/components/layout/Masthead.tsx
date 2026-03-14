export default function Masthead() {
  return (
    <header className="w-full border-b-4 border-zinc-950 dark:border-white py-6 px-4 text-center">
      {/* ASCII art - pre block with exact characters */}
      <pre
        className="text-[0.45rem] sm:text-[0.55rem] md:text-[0.65rem] leading-none select-none overflow-x-auto font-mono inline-block text-left"
        aria-hidden="true"
      >
        {/* "FUCK DOUG" in dark charcoal */}
        <span style={{ color: '#1a1a1a' }} className="dark:text-white block">
{`  █████▒█    ██  ▄████▄   ██ ▄█▀   ▓█████▄  ▒█████   █    ██    ▄████
▓██   ▒ ██  ▓██▒▒██▀ ▀█   ██▄█▒    ▒██▀ ██▌▒██▒  ██▒ ██  ▓██▒  ██▒ ▀█▒
▒████ ░▓██  ▒██░▒▓█    ▄ ▓███▄░    ░██   █▌▒██░  ██▒▓██  ▒██░ ▒██░▄▄▄░
░▓█▒  ░▓▓█  ░██░▒▓▓▄ ▄██▒▓██ █▄    ░▓█▄   ▌▒██   ██░▓▓█  ░██░ ░▓█  ██▓
░▒█░   ▒▒█████▓ ▒ ▓███▀ ░▒██▒ █▄   ░▒████▓ ░ ████▓▒░▒▒█████▓  ░▒▓███▀▒
 ▒ ░   ░▒▓▒ ▒ ▒ ░ ░▒ ▒  ░▒ ▒▒ ▓▒    ▒▒▓  ▒ ░ ▒░▒░▒░ ░▒▓▒ ▒ ▒   ░▒   ▒
 ░     ░░▒░ ░ ░   ░  ▒   ░ ░▒ ▒░    ░ ▒  ▒   ░ ▒ ▒░ ░░▒░ ░ ░    ░   ░
 ░ ░    ░░░ ░ ░ ░        ░ ░░ ░     ░ ░  ░ ░ ░ ░ ▒   ░░░ ░ ░  ░ ░   ░
          ░     ░ ░      ░  ░         ░        ░ ░     ░          ░   ░
              ░`}
        </span>
        {/* "FORD" in Ontario red */}
        <span style={{ color: '#c8102e' }} className="block mt-1">
{`  █████▒▒█████   ██▀███  ▓█████▄
▓██   ▒▒██▒  ██▒▓██ ▒ ██▒▒██▀ ██▌
▒████ ░▒██░  ██▒▓██ ░▄█ ▒░██   █▌
░▓█▒  ░▒██   ██░▒██▀▀█▄  ░▓█▄   ▌
░▒█░    ░ ████▓▒░░██▓ ▒██▒░▒████▓
 ▒ ░    ░ ▒░▒░▒░ ░ ▒▓ ░▒▓░ ▒▒▓  ▒
 ░        ░ ▒ ▒░   ░▒ ░ ▒░ ░ ▒  ▒
 ░ ░    ░ ░ ░ ▒    ░░   ░  ░ ░  ░
            ░ ░     ░        ░
                           ░`}
        </span>
      </pre>
      {/* Subtitle */}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-mono">
        Ontario&apos;s Premier Accountability Dashboard · Queen&apos;s Park Watch
      </p>
    </header>
  )
}
