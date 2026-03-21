'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Switch } from '@/app/components/shared/Switch'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { X, Plus, Bold, Italic, Link as LinkIcon, List, ListOrdered, Heading2, Heading3, Trash2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LegalAction {
  title: string
  status: string
  description: string
  url?: string
}

interface BillChip {
  id: string
  bill_number: string
  title: string
}

interface MppChip {
  id: string
  name: string
  party: string
  riding: string
}

interface NewsLink {
  // linked existing
  newsEventId?: string
  newsEventHeadline?: string
  // external
  external_url?: string
  external_title?: string
  external_source?: string
  external_date?: string
}

interface Source {
  url: string
  title: string
}

interface ScandalDetail {
  id: string
  title: string
  slug: string
  tldr: string | null
  summary: string | null
  date_reported: string
  published: boolean
  why_it_matters: string | null
  rippling_effects: string | null
  legal_actions: LegalAction[]
  sources: Source[]
  news_links: {
    newsEventId: string | null
    news_event: { id: string; headline: string } | null
    external_url: string | null
    external_title: string | null
    external_source: string | null
    external_date: string | null
  }[]
  bills: BillChip[]
  mpps: MppChip[]
}

interface NewsEventResult {
  id: string
  headline: string
  url: string | null
  source: string | null
  published_at: string | null
}

// ─── TipTap Editor ───────────────────────────────────────────────────────────

function TipTapEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate({ editor }: { editor: Editor }) {
      onChange(editor.getHTML())
    },
  })

  function setLink() {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  if (!editor) return null

  const btnBase =
    'px-1.5 py-0.5 rounded text-[10px] font-mono border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors'
  const btnActive =
    'px-1.5 py-0.5 rounded text-[10px] font-mono border border-zinc-500 bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 transition-colors'

  return (
    <div className="border border-zinc-300 dark:border-zinc-600 rounded overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-300 dark:border-zinc-600 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? btnActive : btnBase}
          title="Bold"
        >
          <Bold size={11} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? btnActive : btnBase}
          title="Italic"
        >
          <Italic size={11} />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={editor.isActive('link') ? btnActive : btnBase}
          title="Link"
        >
          <LinkIcon size={11} />
        </button>
        <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? btnActive : btnBase}
          title="Heading 2"
        >
          <Heading2 size={11} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? btnActive : btnBase}
          title="Heading 3"
        >
          <Heading3 size={11} />
        </button>
        <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? btnActive : btnBase}
          title="Bullet list"
        >
          <List size={11} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? btnActive : btnBase}
          title="Ordered list"
        >
          <ListOrdered size={11} />
        </button>
      </div>
      {/* Content */}
      <div className="min-h-[150px] p-3 prose prose-sm dark:prose-invert max-w-none focus-within:ring-1 focus-within:ring-blue-500 rounded-b">
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className="outline-none min-h-[150px]"
        />
      </div>
    </div>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">
      {children}
    </p>
  )
}

const inputCls =
  'text-sm border border-zinc-300 dark:border-zinc-600 rounded px-3 py-1.5 bg-white dark:bg-zinc-900 w-full'

const LEGAL_STATUSES = ['pending', 'active', 'dismissed', 'settled', 'convicted'] as const

// ─── Main Form ────────────────────────────────────────────────────────────────

interface ScandalFormProps {
  scandalId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function ScandalForm({ scandalId, onClose, onSaved }: ScandalFormProps) {
  const isEdit = !!scandalId

  // Basic fields
  const [title, setTitle] = useState('')
  const [tldr, setTldr] = useState('')
  const [summary, setSummary] = useState('')
  const [dateReported, setDateReported] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [published, setPublished] = useState(false)
  const [whyItMatters, setWhyItMatters] = useState('')
  const [ripplingEffects, setRipplingEffects] = useState('')

  // Relational fields
  const [legalActions, setLegalActions] = useState<LegalAction[]>([])
  const [selectedBills, setSelectedBills] = useState<BillChip[]>([])
  const [selectedMpps, setSelectedMpps] = useState<MppChip[]>([])
  const [newsLinks, setNewsLinks] = useState<NewsLink[]>([])
  const [sources, setSources] = useState<Source[]>([])

  // Bill autocomplete
  const [billQuery, setBillQuery] = useState('')
  const [billResults, setBillResults] = useState<BillChip[]>([])
  const [billDropOpen, setBillDropOpen] = useState(false)

  // MPP autocomplete
  const [mppQuery, setMppQuery] = useState('')
  const [allMpps, setAllMpps] = useState<MppChip[]>([])
  const [mppResults, setMppResults] = useState<MppChip[]>([])
  const [mppDropOpen, setMppDropOpen] = useState(false)

  // News
  const [newsTab, setNewsTab] = useState<'link' | 'external'>('link')
  const [newsQuery, setNewsQuery] = useState('')
  const [newsResults, setNewsResults] = useState<NewsEventResult[]>([])
  const [newsDropOpen, setNewsDropOpen] = useState(false)
  const [extUrl, setExtUrl] = useState('')
  const [extTitle, setExtTitle] = useState('')
  const [extSource, setExtSource] = useState('')
  const [extDate, setExtDate] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const billDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const newsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load existing data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!scandalId) return
    setLoading(true)
    fetch(`/api/admin/scandals/${scandalId}`)
      .then(r => r.json())
      .then((data: ScandalDetail) => {
        setTitle(data.title)
        setTldr(data.tldr ?? '')
        setSummary(data.summary ?? '')
        setDateReported(data.date_reported.slice(0, 10))
        setPublished(data.published)
        setWhyItMatters(data.why_it_matters ?? '')
        setRipplingEffects(data.rippling_effects ?? '')
        setLegalActions(data.legal_actions)
        setSelectedBills(data.bills)
        setSelectedMpps(data.mpps)
        setSources(data.sources)
        setNewsLinks(
          data.news_links.map(nl => ({
            newsEventId: nl.newsEventId ?? undefined,
            newsEventHeadline: nl.news_event?.headline ?? undefined,
            external_url: nl.external_url ?? undefined,
            external_title: nl.external_title ?? undefined,
            external_source: nl.external_source ?? undefined,
            external_date: nl.external_date ? nl.external_date.slice(0, 10) : undefined,
          }))
        )
      })
      .catch(() => setError('Failed to load scandal'))
      .finally(() => setLoading(false))
  }, [scandalId])

  // ── Load all MPPs once ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/mpps/search?q=')
      .then(r => r.json())
      .then(data => setAllMpps(data.mpps ?? []))
      .catch(() => {})
  }, [])

  // ── Bill autocomplete ──────────────────────────────────────────────────────
  useEffect(() => {
    if (billDebounce.current) clearTimeout(billDebounce.current)
    if (!billQuery.trim()) {
      setBillResults([])
      setBillDropOpen(false)
      return
    }
    billDebounce.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/bills?q=${encodeURIComponent(billQuery)}&page=1`)
      if (!res.ok) return
      const data = await res.json()
      setBillResults((data.bills ?? []).slice(0, 10))
      setBillDropOpen(true)
    }, 250)
  }, [billQuery])

  // ── MPP filter ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mppQuery.trim()) {
      setMppResults([])
      setMppDropOpen(false)
      return
    }
    const q = mppQuery.toLowerCase()
    const filtered = allMpps.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.party.toLowerCase().includes(q) ||
        m.riding.toLowerCase().includes(q)
    ).slice(0, 20)
    setMppResults(filtered)
    setMppDropOpen(filtered.length > 0)
  }, [mppQuery, allMpps])

  // ── News event search ──────────────────────────────────────────────────────
  function handleNewsQueryChange(q: string) {
    setNewsQuery(q)
    if (newsDebounce.current) clearTimeout(newsDebounce.current)
    if (!q.trim()) {
      setNewsResults([])
      setNewsDropOpen(false)
      return
    }
    newsDebounce.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/news/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const data = await res.json()
      setNewsResults(data.news ?? [])
      setNewsDropOpen(true)
    }, 250)
  }

  // ── Source title fetch ─────────────────────────────────────────────────────
  async function handleSourceUrlBlur(idx: number) {
    const url = sources[idx]?.url
    if (!url || sources[idx]?.title) return
    try {
      const res = await fetch('/api/admin/scandals/fetch-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.title) {
        setSources(prev => prev.map((s, i) => i === idx ? { ...s, title: data.title } : s))
      }
    } catch {}
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title,
        tldr,
        summary,
        date_reported: dateReported,
        published,
        why_it_matters: whyItMatters,
        rippling_effects: ripplingEffects,
        legal_actions: legalActions,
        bill_ids: selectedBills.map(b => b.id),
        mpp_ids: selectedMpps.map(m => m.id),
        news_links: newsLinks.map(nl => ({
          ...(nl.newsEventId ? { newsEventId: nl.newsEventId } : {}),
          ...(nl.external_url ? { external_url: nl.external_url } : {}),
          external_title: nl.external_title,
          external_source: nl.external_source,
          external_date: nl.external_date,
        })),
        sources,
      }

      const url = isEdit ? `/api/admin/scandals/${scandalId}` : '/api/admin/scandals'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to save')
        return
      }
      onSaved()
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/scandals/${scandalId}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Failed to delete')
        setDeleting(false)
        setDeleteConfirm(false)
        return
      }
      onSaved()
    } catch {
      setError('Failed to delete')
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
        <h2 className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {isEdit ? 'Edit Scandal' : 'New Scandal'}
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
        >
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-xs text-zinc-400">Loading…</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded px-4 py-2 text-sm text-red-700 dark:text-red-400 font-mono">
              {error}
            </div>
          )}

          {/* ── Basic Info ─────────────────────────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Basic Info</h3>

            <div>
              <Label>Title</Label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputCls}
                placeholder="Scandal title"
              />
            </div>

            <div>
              <Label>TL;DR</Label>
              <textarea
                value={tldr}
                onChange={e => setTldr(e.target.value)}
                rows={2}
                className={`${inputCls} resize-y`}
                placeholder="One or two sentences — the plain-English punchline…"
              />
            </div>

            <div>
              <Label>Summary</Label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={3}
                className={`${inputCls} resize-y`}
                placeholder="Brief summary…"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Date Reported</Label>
                <input
                  type="date"
                  value={dateReported}
                  onChange={e => setDateReported(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Published</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <Switch
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                  <span className="font-mono text-xs text-zinc-500">
                    {published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── Rich Text ─────────────────────────────────────────────────── */}
          <section className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Content</h3>

            <div>
              <Label>Why It Matters</Label>
              <TipTapEditor
                content={whyItMatters}
                onChange={setWhyItMatters}
                placeholder="Why does this scandal matter?"
              />
            </div>

            <div>
              <Label>Rippling Effects</Label>
              <TipTapEditor
                content={ripplingEffects}
                onChange={setRipplingEffects}
                placeholder="What are the rippling effects?"
              />
            </div>
          </section>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── Legal Actions ─────────────────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Legal Actions</h3>
              <button
                type="button"
                onClick={() =>
                  setLegalActions(prev => [
                    ...prev,
                    { title: '', status: 'pending', description: '', url: '' },
                  ])
                }
                className="flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <Plus size={12} />
                Add Legal Action
              </button>
            </div>

            {legalActions.length === 0 && (
              <p className="text-xs font-mono text-zinc-400 italic">No legal actions yet.</p>
            )}

            {legalActions.map((la, i) => (
              <div
                key={i}
                className="border border-zinc-200 dark:border-zinc-700 rounded p-3 space-y-2"
              >
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Title</Label>
                    <input
                      type="text"
                      value={la.title}
                      onChange={e =>
                        setLegalActions(prev =>
                          prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x)
                        )
                      }
                      className={inputCls}
                      placeholder="Action title"
                    />
                  </div>
                  <div className="w-36">
                    <Label>Status</Label>
                    <select
                      value={la.status}
                      onChange={e =>
                        setLegalActions(prev =>
                          prev.map((x, j) => j === i ? { ...x, status: e.target.value } : x)
                        )
                      }
                      className={inputCls}
                    >
                      {LEGAL_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLegalActions(prev => prev.filter((_, j) => j !== i))}
                    className="mt-5 p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    value={la.description}
                    onChange={e =>
                      setLegalActions(prev =>
                        prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x)
                      )
                    }
                    rows={2}
                    className={`${inputCls} resize-y`}
                    placeholder="Describe the legal action…"
                  />
                </div>
                <div>
                  <Label>Source URL (optional)</Label>
                  <input
                    type="url"
                    value={la.url ?? ''}
                    onChange={e =>
                      setLegalActions(prev =>
                        prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x)
                      )
                    }
                    className={inputCls}
                    placeholder="https://court-record or news link…"
                  />
                </div>
              </div>
            ))}
          </section>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── Linked Bills ─────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Linked Bills</h3>

            <div className="relative">
              <Label>Search bills</Label>
              <input
                type="text"
                value={billQuery}
                onChange={e => setBillQuery(e.target.value)}
                onFocus={() => billResults.length > 0 && setBillDropOpen(true)}
                onBlur={() => setTimeout(() => setBillDropOpen(false), 150)}
                className={inputCls}
                placeholder="Search by bill number or title…"
              />
              {billDropOpen && billResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto">
                  {billResults
                    .filter(b => !selectedBills.some(sb => sb.id === b.id))
                    .map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedBills(prev => [...prev, b])
                          setBillQuery('')
                          setBillDropOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 mr-2">
                          {b.bill_number}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400">{b.title}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {selectedBills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedBills.map(b => (
                  <span
                    key={b.id}
                    className="flex items-center gap-1 text-[11px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"
                  >
                    <span className="font-semibold">{b.bill_number}</span>
                    <span className="text-blue-500 dark:text-blue-400 max-w-[120px] truncate">{b.title}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBills(prev => prev.filter(x => x.id !== b.id))}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── Involved MPPs ─────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Involved MPPs</h3>

            <div className="relative">
              <Label>Search MPPs</Label>
              <input
                type="text"
                value={mppQuery}
                onChange={e => setMppQuery(e.target.value)}
                onFocus={() => mppResults.length > 0 && setMppDropOpen(true)}
                onBlur={() => setTimeout(() => setMppDropOpen(false), 150)}
                className={inputCls}
                placeholder="Search by name, party, or riding…"
              />
              {mppDropOpen && mppResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto">
                  {mppResults
                    .filter(m => !selectedMpps.some(sm => sm.id === m.id))
                    .map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedMpps(prev => [...prev, m])
                          setMppQuery('')
                          setMppDropOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{m.name}</span>
                        <span className="text-zinc-400 ml-2">{m.party} · {m.riding}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {selectedMpps.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedMpps.map(m => (
                  <span
                    key={m.id}
                    className="flex items-center gap-1 text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded"
                  >
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-zinc-400">{m.party}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMpps(prev => prev.filter(x => x.id !== m.id))}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── News Coverage ─────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">News Coverage</h3>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setNewsTab('link')}
                className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 -mb-px ${
                  newsTab === 'link'
                    ? 'border-zinc-800 dark:border-zinc-200 text-zinc-800 dark:text-zinc-200'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Link Existing
              </button>
              <button
                type="button"
                onClick={() => setNewsTab('external')}
                className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 -mb-px ${
                  newsTab === 'external'
                    ? 'border-zinc-800 dark:border-zinc-200 text-zinc-800 dark:text-zinc-200'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Add External
              </button>
            </div>

            {newsTab === 'link' && (
              <div className="relative">
                <Label>Search news events</Label>
                <input
                  type="text"
                  value={newsQuery}
                  onChange={e => handleNewsQueryChange(e.target.value)}
                  onFocus={() => newsResults.length > 0 && setNewsDropOpen(true)}
                  onBlur={() => setTimeout(() => setNewsDropOpen(false), 150)}
                  className={inputCls}
                  placeholder="Search by headline…"
                />
                {newsDropOpen && newsResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg max-h-48 overflow-y-auto">
                    {newsResults
                      .filter(n => !newsLinks.some(nl => nl.newsEventId === n.id))
                      .map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onMouseDown={() => {
                            setNewsLinks(prev => [
                              ...prev,
                              { newsEventId: n.id, newsEventHeadline: n.headline },
                            ])
                            setNewsQuery('')
                            setNewsDropOpen(false)
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <span className="text-zinc-700 dark:text-zinc-300">{n.headline}</span>
                          {n.source && (
                            <span className="text-zinc-400 ml-2">{n.source}</span>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {newsTab === 'external' && (
              <div className="space-y-2 border border-zinc-200 dark:border-zinc-700 rounded p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>URL</Label>
                    <input
                      type="url"
                      value={extUrl}
                      onChange={e => setExtUrl(e.target.value)}
                      className={inputCls}
                      placeholder="https://…"
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <input
                      type="text"
                      value={extTitle}
                      onChange={e => setExtTitle(e.target.value)}
                      className={inputCls}
                      placeholder="Article title"
                    />
                  </div>
                  <div>
                    <Label>Source</Label>
                    <input
                      type="text"
                      value={extSource}
                      onChange={e => setExtSource(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Toronto Star"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <input
                      type="date"
                      value={extDate}
                      onChange={e => setExtDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!extUrl.trim()) return
                    setNewsLinks(prev => [
                      ...prev,
                      {
                        external_url: extUrl,
                        external_title: extTitle,
                        external_source: extSource,
                        external_date: extDate || undefined,
                      },
                    ])
                    setExtUrl('')
                    setExtTitle('')
                    setExtSource('')
                    setExtDate('')
                  }}
                  className="flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
            )}

            {/* Listed news links */}
            {newsLinks.length > 0 && (
              <div className="space-y-1.5">
                {newsLinks.map((nl, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      {nl.newsEventId ? (
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate block">
                          {nl.newsEventHeadline ?? nl.newsEventId}
                        </span>
                      ) : (
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate block">
                          {nl.external_title || nl.external_url}
                          {nl.external_source && (
                            <span className="text-zinc-400 ml-1">· {nl.external_source}</span>
                          )}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewsLinks(prev => prev.filter((_, j) => j !== i))}
                      className="ml-2 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── Sources ───────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Sources</h3>
              <button
                type="button"
                onClick={() => setSources(prev => [...prev, { url: '', title: '' }])}
                className="flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <Plus size={12} />
                Add Source
              </button>
            </div>

            {sources.length === 0 && (
              <p className="text-xs font-mono text-zinc-400 italic">No sources yet.</p>
            )}

            {sources.map((src, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>URL</Label>
                  <input
                    type="url"
                    value={src.url}
                    onChange={e =>
                      setSources(prev => prev.map((s, j) => j === i ? { ...s, url: e.target.value } : s))
                    }
                    onBlur={() => handleSourceUrlBlur(i)}
                    className={inputCls}
                    placeholder="https://…"
                  />
                </div>
                <div className="flex-1">
                  <Label>Title</Label>
                  <input
                    type="text"
                    value={src.title}
                    onChange={e =>
                      setSources(prev => prev.map((s, j) => j === i ? { ...s, title: e.target.value } : s))
                    }
                    className={inputCls}
                    placeholder="Auto-fetched on blur"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSources(prev => prev.filter((_, j) => j !== i))}
                  className="pb-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </section>

          <hr className="border-zinc-200 dark:border-zinc-700" />

          {/* ── Form Actions ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pb-8">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-sm font-mono bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-sm font-mono border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono rounded transition-colors disabled:opacity-50 ${
                  deleteConfirm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                }`}
              >
                <Trash2 size={13} />
                {deleting ? 'Deleting…' : deleteConfirm ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
