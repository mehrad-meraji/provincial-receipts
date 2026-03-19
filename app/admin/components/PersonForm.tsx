'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

const CONNECTION_TYPES = ['Lobbyist', 'Donor', 'Director', 'Beneficiary'] as const
const SOURCE_TYPES = ['Registry', 'News', 'Corporate', 'Court', 'FOI'] as const
const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const

interface PersonDetail {
  id: string
  name: string
  slug: string
  bio: string | null
  photo_filename: string | null
  organization: string | null
  organization_url: string | null
  confidence: string
  published: boolean
  connections: {
    id: string
    connection_type: string
    description: string
    scandal: { id: string; title: string; slug: string }
  }[]
  sources: {
    id: string
    url: string
    title: string
    source_type: string
  }[]
}

interface ScandalResult {
  id: string
  title: string
  slug: string
}

interface PersonFormProps {
  editingId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function PersonForm({ editingId, onClose, onSaved }: PersonFormProps) {
  const isEdit = !!editingId

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [photoFilename, setPhotoFilename] = useState('')
  const [organization, setOrganization] = useState('')
  const [organizationUrl, setOrganizationUrl] = useState('')
  const [confidence, setConfidence] = useState<string>('medium')
  const [published, setPublished] = useState(false)

  const [connections, setConnections] = useState<PersonDetail['connections']>([])
  const [sources, setSources] = useState<PersonDetail['sources']>([])

  // New connection form
  const [scandalSearch, setScandalSearch] = useState('')
  const [scandalResults, setScandalResults] = useState<ScandalResult[]>([])
  const [selectedScandal, setSelectedScandal] = useState<ScandalResult | null>(null)
  const [newConnType, setNewConnType] = useState<string>(CONNECTION_TYPES[0])
  const [newConnDesc, setNewConnDesc] = useState('')

  // New source form
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [newSourceTitle, setNewSourceTitle] = useState('')
  const [newSourceType, setNewSourceType] = useState<string>(SOURCE_TYPES[0])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name
  function slugify(n: string) {
    return n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }

  useEffect(() => {
    if (!isEdit) setSlug(slugify(name))
  }, [name, isEdit])

  // Load existing person for edit
  useEffect(() => {
    if (!editingId) return
    fetch(`/api/admin/people/${editingId}`)
      .then(r => r.json())
      .then((p: PersonDetail) => {
        setName(p.name)
        setSlug(p.slug)
        setBio(p.bio ?? '')
        setPhotoFilename(p.photo_filename ?? '')
        setOrganization(p.organization ?? '')
        setOrganizationUrl(p.organization_url ?? '')
        setConfidence(p.confidence)
        setPublished(p.published)
        setConnections(p.connections)
        setSources(p.sources)
      })
  }, [editingId])

  // Scandal search
  useEffect(() => {
    if (!scandalSearch.trim()) { setScandalResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/scandals?q=${encodeURIComponent(scandalSearch)}&page=1`)
      const data = await res.json()
      setScandalResults((data.scandals ?? []).slice(0, 6))
    }, 300)
    return () => clearTimeout(t)
  }, [scandalSearch])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const url = isEdit ? `/api/admin/people/${editingId}` : '/api/admin/people'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          bio: bio.trim() || null,
          photo_filename: photoFilename.trim() || null,
          organization: organization.trim() || null,
          organization_url: organizationUrl.trim() || null,
          confidence,
          published,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Save failed')
        return
      }
      onSaved()
    } catch (e) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingId) return
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    await fetch(`/api/admin/people/${editingId}`, { method: 'DELETE' })
    onSaved()
  }

  async function handleAddConnection() {
    if (!selectedScandal || !editingId) return
    const res = await fetch(`/api/admin/people/${editingId}/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scandalId: selectedScandal.id, connection_type: newConnType, description: newConnDesc }),
    })
    if (res.ok) {
      const conn = await res.json()
      setConnections(prev => [...prev, conn])
      setSelectedScandal(null)
      setScandalSearch('')
      setNewConnDesc('')
    }
  }

  async function handleDeleteConnection(connId: string, personId: string) {
    await fetch(`/api/admin/people/${personId}/connections/${connId}`, { method: 'DELETE' })
    setConnections(prev => prev.filter(c => c.id !== connId))
  }

  async function handleAddSource() {
    if (!editingId) return
    const res = await fetch(`/api/admin/people/${editingId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newSourceUrl, title: newSourceTitle, source_type: newSourceType }),
    })
    if (res.ok) {
      const src = await res.json()
      setSources(prev => [...prev, src])
      setNewSourceUrl('')
      setNewSourceTitle('')
    }
  }

  async function handleDeleteSource(srcId: string, personId: string) {
    await fetch(`/api/admin/people/${personId}/sources/${srcId}`, { method: 'DELETE' })
    setSources(prev => prev.filter(s => s.id !== srcId))
  }

  const inputClass = 'w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-950 dark:text-white placeholder-zinc-400'
  const labelClass = 'block text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-mono text-sm uppercase tracking-widest font-bold">
            {isEdit ? 'Edit Person' : 'Add Person'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input className={inputClass} value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-slug" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Organization</label>
              <input className={inputClass} value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Company or org" />
            </div>
            <div>
              <label className={labelClass}>Organization URL</label>
              <input className={inputClass} value={organizationUrl} onChange={e => setOrganizationUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className={labelClass}>Photo filename</label>
            <input className={inputClass} value={photoFilename} onChange={e => setPhotoFilename(e.target.value)} placeholder="john-doe.jpg (place in public/people/)" />
          </div>

          <div>
            <label className={labelClass}>Bio</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Short biography..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Confidence</label>
              <select className={inputClass} value={confidence} onChange={e => setConfidence(e.target.value)}>
                {CONFIDENCE_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-400">Published</span>
              </label>
            </div>
          </div>

          {/* Connections — only available in edit mode */}
          {isEdit && (
            <div>
              <label className={labelClass}>Connected Scandals</label>
              {connections.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {connections.map(c => (
                    <li key={c.id} className="flex items-start gap-2 text-xs border border-zinc-100 dark:border-zinc-800 p-2">
                      <span className="flex-1 font-mono text-zinc-700 dark:text-zinc-300">
                        <span className="font-bold">[{c.connection_type}]</span> {c.scandal.title} — {c.description}
                      </span>
                      <button onClick={() => handleDeleteConnection(c.id, editingId!)} className="text-zinc-400 hover:text-red-500 flex-none mt-0.5">
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {/* Add connection */}
              <div className="border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                <input
                  className={inputClass}
                  value={scandalSearch}
                  onChange={e => { setScandalSearch(e.target.value); setSelectedScandal(null) }}
                  placeholder="Search scandals..."
                />
                {scandalResults.length > 0 && !selectedScandal && (
                  <ul className="border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {scandalResults.map(s => (
                      <li key={s.id}>
                        <button
                          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 font-mono"
                          onClick={() => { setSelectedScandal(s); setScandalSearch(s.title); setScandalResults([]) }}
                        >
                          {s.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedScandal && (
                  <div className="space-y-2">
                    <select className={inputClass} value={newConnType} onChange={e => setNewConnType(e.target.value)}>
                      {CONNECTION_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                    <input className={inputClass} value={newConnDesc} onChange={e => setNewConnDesc(e.target.value)} placeholder="One-sentence description of the connection..." />
                    <button
                      onClick={handleAddConnection}
                      disabled={!newConnDesc.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40"
                    >
                      <Plus size={12} /> Add Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sources — only available in edit mode */}
          {isEdit && (
            <div>
              <label className={labelClass}>Sources</label>
              {sources.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {sources.map(s => (
                    <li key={s.id} className="flex items-start gap-2 text-xs border border-zinc-100 dark:border-zinc-800 p-2">
                      <span className="flex-1 font-mono text-zinc-700 dark:text-zinc-300">
                        <span className="font-bold">[{s.source_type}]</span> {s.title}
                      </span>
                      <button onClick={() => handleDeleteSource(s.id, editingId!)} className="text-zinc-400 hover:text-red-500 flex-none mt-0.5">
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                <input className={inputClass} value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} placeholder="https://..." />
                <input className={inputClass} value={newSourceTitle} onChange={e => setNewSourceTitle(e.target.value)} placeholder="Source title / description" />
                <select className={inputClass} value={newSourceType} onChange={e => setNewSourceType(e.target.value)}>
                  {SOURCE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <button
                  onClick={handleAddSource}
                  disabled={!newSourceUrl.trim() || !newSourceTitle.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40"
                >
                  <Plus size={12} /> Add Source
                </button>
              </div>
            </div>
          )}

          {!isEdit && (
            <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              Connections and sources can be added after saving.
            </p>
          )}

          {error && (
            <p className="font-mono text-xs text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !slug.trim()}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-40"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Person'}
            </button>
            {isEdit && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-mono uppercase tracking-widest border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            )}
            <button onClick={onClose} className="ml-auto text-xs font-mono text-zinc-500 hover:text-zinc-950 dark:hover:text-white uppercase tracking-widest">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
