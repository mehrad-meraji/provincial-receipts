'use client'

import { useState, useEffect } from 'react'

interface SiteConfig {
  id: string
  named_individuals_enabled: boolean
}

export default function FeatureFlagsPanel() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then(r => r.json())
      .then(setConfig)
  }, [])

  async function toggle(flag: keyof Omit<SiteConfig, 'id'>) {
    if (!config) return
    const next = !config[flag]
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [flag]: next }),
      })
      if (res.ok) setConfig(await res.json())
    } finally {
      setSaving(false)
    }
  }

  if (!config) {
    return <p className="font-mono text-xs text-zinc-400">Loading…</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="font-mono text-xs font-bold text-zinc-950 dark:text-white">Named Individuals</p>
          <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Show carousel, /people gallery, and /people/[slug] detail pages
          </p>
        </div>
        <button
          onClick={() => toggle('named_individuals_enabled')}
          disabled={saving}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            config.named_individuals_enabled
              ? 'bg-zinc-950 dark:bg-white'
              : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
          aria-checked={config.named_individuals_enabled}
          role="switch"
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
              config.named_individuals_enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
