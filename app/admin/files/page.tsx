'use client'

import { useState, useRef, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import { createEmployee } from '@/lib/supabase/employees'
import { createProject } from '@/lib/supabase/projects'

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = Record<string, string>

interface SpreadsheetResult {
  type: 'spreadsheet'
  fileName: string
  fileSizeKB: string
  headers: string[]
  totalRows: number
  preview: Row[]
  allRows: Row[]
}

interface TextResult {
  type: 'text'
  fileName: string
  fileSizeKB: string
  fullText: string
  preview: string
  wordCount: number
  charCount: number
  pages?: number
}

type ParseResult = SpreadsheetResult | TextResult

interface AIEmployee {
  name: string | null
  email: string | null
  job_title: string | null
  department: string | null
  site: string | null
  salary: number | null
  status: 'active' | 'inactive'
  hire_date: string | null
}

interface AIProject {
  name: string | null
  site: string | null
  country: string | null
  status: 'on_track' | 'at_risk' | 'completed' | 'archived'
  phase: string | null
  deadline: string | null
  pm: string | null
  description: string | null
  budget_amount: number | null
  milestone_pct: number
}

type ImportType = 'employees' | 'projects'

type PageState =
  | 'idle'
  | 'uploading'
  | 'error'
  | 'parsed'
  | 'ai-processing'
  | 'ai-done'
  | 'saving'
  | 'imported'

interface ImportResult {
  saved: number
  failed: number
  importType: ImportType
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMATS = [
  { ext: 'CSV',        icon: '📊', color: '#22c55e' },
  { ext: 'XLSX / XLS', icon: '📗', color: '#16a34a' },
  { ext: 'PDF',        icon: '📕', color: '#ef4444' },
  { ext: 'DOCX / DOC', icon: '📘', color: '#3b82f6' },
]

const STEPS = ['Upload', 'Parse & Review', 'AI Extract', 'Import']

const VALID_STATUSES = ['on_track', 'at_risk', 'completed', 'archived'] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📕'
  if (ext === 'xlsx' || ext === 'xls') return '📗'
  if (ext === 'csv') return '📊'
  return '📘'
}

function stateToStep(s: PageState): number {
  if (s === 'parsed') return 2
  if (s === 'ai-processing' || s === 'ai-done') return 3
  if (s === 'saving' || s === 'imported') return 4
  return 1
}

function parseMeta(r: ParseResult): string {
  if (r.type === 'spreadsheet') return `${r.totalRows} rows · ${r.headers.length} cols`
  return `${r.wordCount.toLocaleString()} words${r.pages ? ` · ${r.pages} pages` : ''}`
}

function contentForAI(r: ParseResult): string {
  return r.type === 'spreadsheet'
    ? JSON.stringify(r.allRows, null, 2)
    : r.fullText
}

// ─── StepBar ─────────────────────────────────────────────────────────────────

function StepBar({ state }: { state: PageState }) {
  const cur = stateToStep(state)
  return (
    <div className="flex items-start mb-8">
      {STEPS.map((label, i) => {
        const num = i + 1
        const done = num < cur
        const active = num === cur
        return (
          <div key={i} className="flex items-start flex-1">
            <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: done
                    ? 'rgba(34,197,94,0.15)'
                    : active
                    ? 'rgba(245,158,11,0.15)'
                    : '#1a1f2e',
                  border: `1.5px solid ${done ? '#22c55e' : active ? '#f59e0b' : '#2a3347'}`,
                  color: done ? '#22c55e' : active ? '#f59e0b' : '#4b5563',
                }}
              >
                {done ? '✓' : num}
              </div>
              <span
                className="text-xs mt-1.5 text-center leading-tight"
                style={{
                  color: done ? '#4ade80' : active ? '#fbbf24' : '#4b5563',
                  maxWidth: 64,
                  display: 'block',
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mt-3.5 mx-1.5"
                style={{ background: done ? 'rgba(34,197,94,0.4)' : '#2a3347' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── SpreadsheetPreview ──────────────────────────────────────────────────────

function SpreadsheetPreview({ headers, rows }: { headers: string[]; rows: Row[] }) {
  return (
    <div style={{ maxHeight: 300, overflowY: 'auto', overflowX: 'auto', background: '#161b27' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: 400, width: '100%', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#1a1f2e', position: 'sticky', top: 0, zIndex: 1 }}>
            {headers.map(h => (
              <th
                key={h}
                style={{
                  textAlign: 'left', padding: '10px 14px', color: '#64748b',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #2a3347', whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid #1e2433' }}>
              {headers.map(h => (
                <td
                  key={h}
                  title={row[h] ?? ''}
                  style={{ padding: '8px 14px', color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {row[h] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── TextPreview ─────────────────────────────────────────────────────────────

function TextPreview({ text, truncated }: { text: string; truncated: boolean }) {
  return (
    <div style={{ background: '#161b27', padding: '16px 20px' }}>
      <pre
        style={{
          color: '#94a3b8', fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre-wrap',
          wordBreak: 'break-word', fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          maxHeight: 300, overflowY: 'auto', margin: 0,
        }}
      >
        {text}
      </pre>
      {truncated && (
        <p style={{ color: '#4b5563', fontSize: 11, textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
          — preview shows first 2,000 characters · full content will be sent to AI —
        </p>
      )}
    </div>
  )
}

// ─── FileSummaryBar ───────────────────────────────────────────────────────────

function FileSummaryBar({ result, onReset }: { result: ParseResult; onReset: () => void }) {
  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: '#161b27', border: '1px solid #2a3347' }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(result.fileName)}</span>
      <span className="text-sm flex-1 truncate" style={{ color: '#94a3b8' }}>{result.fileName}</span>
      <span className="text-xs shrink-0" style={{ color: '#4b5563' }}>{parseMeta(result)}</span>
      <button
        onClick={onReset}
        title="Start over"
        style={{ background: 'transparent', border: 'none', color: '#4b5563', fontSize: 20, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}

// ─── AIRecordTable ────────────────────────────────────────────────────────────

const EMP_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'department', label: 'Department' },
  { key: 'site', label: 'Site' },
  { key: 'salary', label: 'Salary' },
  { key: 'status', label: 'Status' },
]

const PROJ_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'site', label: 'Site' },
  { key: 'status', label: 'Status' },
  { key: 'phase', label: 'Phase' },
  { key: 'pm', label: 'PM' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'budget_amount', label: 'Budget (USD)' },
  { key: 'milestone_pct', label: 'Milestone %' },
]

function statusColor(val: unknown): string {
  if (val === 'active' || val === 'on_track') return '#22c55e'
  if (val === 'at_risk') return '#f59e0b'
  if (val === 'inactive') return '#64748b'
  return '#94a3b8'
}

function AIRecordTable({
  records,
  importType,
}: {
  records: (AIEmployee | AIProject)[]
  importType: ImportType
}) {
  const cols = importType === 'employees' ? EMP_COLS : PROJ_COLS
  const preview = records.slice(0, 10)

  return (
    <div style={{ maxHeight: 300, overflowY: 'auto', overflowX: 'auto', background: '#161b27' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: 500, width: '100%', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#1a1f2e', position: 'sticky', top: 0, zIndex: 1 }}>
            {cols.map(c => (
              <th
                key={c.key}
                style={{
                  textAlign: 'left', padding: '10px 14px', color: '#64748b',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #2a3347', whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((record, ri) => {
            const r = record as unknown as Record<string, unknown>
            return (
              <tr key={ri} style={{ borderBottom: '1px solid #1e2433' }}>
                {cols.map(c => {
                  const val = r[c.key]
                  const isNull = val === null || val === undefined
                  const display = isNull ? '—' : String(val)

                  if (c.key === 'status') {
                    const color = statusColor(val)
                    return (
                      <td key={c.key} style={{ padding: '8px 14px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: `${color}18`, color, fontWeight: 500 }}>
                          {display}
                        </span>
                      </td>
                    )
                  }

                  return (
                    <td
                      key={c.key}
                      title={display}
                      style={{
                        padding: '8px 14px',
                        color: isNull ? '#4b5563' : '#94a3b8',
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontStyle: isNull ? 'italic' : 'normal',
                      }}
                    >
                      {display}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FilesPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [pageState, setPageState] = useState<PageState>('idle')
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [importType, setImportType] = useState<ImportType>('employees')
  const [aiRecords, setAiRecords] = useState<(AIEmployee | AIProject)[] | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Progress helpers ───────────────────────────────────────────────────────

  const startProgress = () => {
    setProgress(5)
    let cur = 5
    progressTimer.current = setInterval(() => {
      cur += cur < 40 ? 4 : cur < 70 ? 2 : 0.4
      if (cur >= 88) { clearInterval(progressTimer.current!); cur = 88 }
      setProgress(cur)
    }, 160)
  }

  const finishProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current)
    setProgress(100)
  }

  const reset = () => {
    if (progressTimer.current) clearInterval(progressTimer.current)
    setPageState('idle')
    setProgress(0)
    setSelectedFile(null)
    setParseResult(null)
    setUploadError(null)
    setAiRecords(null)
    setAiError(null)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Step 1 + 2: Upload and parse ──────────────────────────────────────────

  const uploadAndParse = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['csv', 'xlsx', 'xls', 'pdf', 'docx', 'doc'].includes(ext)) {
      setUploadError(`"${file.name}" is not supported. Upload CSV, XLSX, PDF, or DOCX.`)
      setPageState('error')
      return
    }

    setSelectedFile(file)
    setPageState('uploading')
    startProgress()

    const body = new FormData()
    body.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body })
      finishProgress()
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Upload failed')
      }
      const result: ParseResult = await res.json()
      setParseResult(result)
      setTimeout(() => setPageState('parsed'), 350)
    } catch (err) {
      if (progressTimer.current) clearInterval(progressTimer.current)
      setUploadError(err instanceof Error ? err.message : 'Unexpected error. Please try again.')
      setPageState('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && (pageState === 'idle' || pageState === 'error')) uploadAndParse(file)
    },
    [uploadAndParse, pageState]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAndParse(file)
  }

  // ── Step 3: AI extraction ──────────────────────────────────────────────────

  const processWithAI = async () => {
    if (!parseResult) return
    setPageState('ai-processing')
    setAiError(null)

    try {
      const res = await fetch('/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importType, content: contentForAI(parseResult) }),
      })

      const json = await res.json()

      if (!res.ok || json.configured === false) {
        throw new Error(json.error ?? 'AI processing failed')
      }

      setAiRecords(json.records ?? [])
      setPageState('ai-done')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI processing failed.')
      setPageState('parsed')
    }
  }

  // ── Step 4: Save to Supabase ──────────────────────────────────────────────

  const importRecords = async () => {
    if (!aiRecords?.length) return
    setPageState('saving')

    let saved = 0
    let failed = 0

    if (importType === 'employees') {
      const results = await Promise.all(
        (aiRecords as AIEmployee[]).map(async r => {
          if (!r.name) return false
          try {
            await createEmployee({
              name: r.name,
              email: r.email ?? '',
              job_title: r.job_title ?? null,
              department: r.department ?? null,
              site: r.site ?? null,
              salary: r.salary ?? null,
              status: r.status === 'inactive' ? 'inactive' : 'active',
              hire_date: r.hire_date ?? null,
            })
            return true
          } catch { return false }
        })
      )
      saved = results.filter(Boolean).length
      failed = results.length - saved
    } else {
      const results = await Promise.all(
        (aiRecords as AIProject[]).map(async r => {
          if (!r.name) return false
          try {
            await createProject({
              name: r.name,
              site: r.site ?? null,
              country: r.country ?? null,
              status: VALID_STATUSES.includes(r.status as (typeof VALID_STATUSES)[number])
                ? (r.status as (typeof VALID_STATUSES)[number])
                : 'on_track',
              phase: r.phase ?? null,
              deadline: r.deadline ?? null,
              pm: r.pm ?? null,
              description: r.description ?? null,
              budget_amount: r.budget_amount ?? 0,
              actual_spend: 0,
              milestone_pct: r.milestone_pct ?? 0,
            })
            return true
          } catch { return false }
        })
      )
      saved = results.filter(Boolean).length
      failed = results.length - saved
    }

    setImportResult({ saved, failed, importType })
    setPageState('imported')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isUploadStage = pageState === 'idle' || pageState === 'uploading' || pageState === 'error'

  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#4b5563' }}>
            Admin · AI Import
          </p>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
            AI Document Import
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Upload a file — CSV, Excel, PDF, or Word — to extract and import structured data
          </p>
        </div>

        <StepBar state={pageState} />

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {pageState === 'error' && (
          <div
            className="rounded-xl px-5 py-4 mb-6 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <span style={{ fontSize: 20, marginTop: 2, flexShrink: 0 }}>⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>Upload failed</p>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{uploadError}</p>
            </div>
            <button
              onClick={reset}
              style={{ background: '#1e2433', color: '#94a3b8', border: '1px solid #2a3347', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Upload zone ──────────────────────────────────────────────────── */}
        {isUploadStage && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); if (pageState !== 'uploading') setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => {
                if (pageState !== 'uploading') {
                  if (pageState === 'error') reset()
                  fileInputRef.current?.click()
                }
              }}
              className="rounded-2xl flex flex-col items-center justify-center py-16 px-8 text-center transition-all mb-6"
              style={{
                background: isDragging ? 'rgba(245,158,11,0.06)' : '#161b27',
                border: `2px dashed ${isDragging ? '#f59e0b' : pageState === 'uploading' ? '#f59e0b' : '#2a3347'}`,
                cursor: pageState !== 'uploading' ? 'pointer' : 'default',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.docx,.doc" className="hidden" onChange={handleFileChange} />

              {pageState === 'uploading' ? (
                <>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>{selectedFile && fileIcon(selectedFile.name)}</div>
                  <p className="text-base font-semibold mb-1" style={{ color: '#e2e8f0' }}>{selectedFile?.name}</p>
                  <p className="text-sm mb-6" style={{ color: '#64748b' }}>Uploading and parsing…</p>
                  <div style={{ width: '100%', maxWidth: 300 }}>
                    <div className="flex justify-between mb-1.5" style={{ fontSize: 11, color: '#64748b' }}>
                      <span>Progress</span><span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2433' }}>
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#f59e0b', transition: 'width 0.15s ease-out' }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16, background: isDragging ? 'rgba(245,158,11,0.15)' : '#1e2433', border: `1px solid ${isDragging ? '#f59e0b' : '#2a3347'}` }}>
                    {isDragging ? '📂' : '📁'}
                  </div>
                  <p className="text-base font-semibold mb-1" style={{ color: isDragging ? '#f59e0b' : '#e2e8f0' }}>
                    {isDragging ? 'Drop to upload' : 'Drag & drop a file here'}
                  </p>
                  <p className="text-sm mb-5" style={{ color: '#64748b' }}>or click to browse</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {FORMATS.map(f => (
                      <span key={f.ext} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: '#1e2433', border: '1px solid #2a3347', color: '#94a3b8' }}>
                        {f.icon} {f.ext}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {pageState !== 'uploading' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FORMATS.map(fmt => (
                  <div key={fmt.ext} className="rounded-xl p-4 flex flex-col items-center text-center" style={{ background: '#161b27', border: '1px solid #2a3347' }}>
                    <span style={{ fontSize: 24, marginBottom: 6 }}>{fmt.icon}</span>
                    <span className="text-sm font-medium" style={{ color: fmt.color }}>{fmt.ext}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Parsed — review + AI selector ───────────────────────────────── */}
        {pageState === 'parsed' && parseResult && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="rounded-xl px-5 py-4 flex items-center gap-4" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>File parsed successfully</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>
                  {parseResult.fileName} · {parseResult.fileSizeKB} KB · {parseMeta(parseResult)}
                </p>
              </div>
              <button onClick={reset} style={{ background: '#1e2433', color: '#94a3b8', border: '1px solid #2a3347', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                Upload new file
              </button>
            </div>

            {/* Extracted content */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a3347' }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#1a1f2e', borderBottom: '1px solid #2a3347' }}>
                <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Extracted Content</span>
                <span className="text-xs" style={{ color: '#64748b' }}>
                  {parseResult.type === 'spreadsheet'
                    ? `Showing ${parseResult.preview.length} of ${parseResult.totalRows} rows`
                    : `${parseResult.charCount.toLocaleString()} chars${parseResult.charCount > 2000 ? ' · preview truncated' : ''}`}
                </span>
              </div>
              {parseResult.type === 'spreadsheet'
                ? <SpreadsheetPreview headers={parseResult.headers} rows={parseResult.preview} />
                : <TextPreview text={parseResult.preview} truncated={parseResult.charCount > 2000} />}
            </div>

            {/* AI section */}
            <div className="rounded-xl p-5" style={{ background: '#161b27', border: '1px solid #2a3347' }}>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#e2e8f0' }}>Step 3 — AI Processing</p>
              <p className="text-xs mb-4" style={{ color: '#64748b' }}>
                Choose what to extract, then let Claude read the content and return structured records.
              </p>

              {/* Import type picker */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(['employees', 'projects'] as ImportType[]).map(t => {
                  const selected = importType === t
                  return (
                    <button
                      key={t}
                      onClick={() => setImportType(t)}
                      className="rounded-xl p-4 text-left flex items-start gap-3 transition-all"
                      style={{ background: selected ? 'rgba(245,158,11,0.08)' : '#1a1f2e', border: `1.5px solid ${selected ? '#f59e0b' : '#2a3347'}`, cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 20 }}>{t === 'employees' ? '👤' : '📋'}</span>
                      <div>
                        <p className="text-sm font-semibold capitalize" style={{ color: selected ? '#f59e0b' : '#e2e8f0' }}>{t}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                          {t === 'employees' ? 'Save to employees table' : 'Save to projects table'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* AI error from previous attempt */}
              {aiError && (
                <div className="rounded-lg px-4 py-3 mb-4 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>⚠️</span>
                  <p className="text-xs" style={{ color: '#ef4444' }}>{aiError}</p>
                </div>
              )}

              <button
                onClick={processWithAI}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: '#f59e0b', color: '#0d1117', cursor: 'pointer', border: 'none' }}
              >
                🤖 Process with AI →
              </button>
            </div>
          </div>
        )}

        {/* ── AI processing spinner ────────────────────────────────────────── */}
        {pageState === 'ai-processing' && parseResult && (
          <div className="space-y-5">
            <FileSummaryBar result={parseResult} onReset={reset} />
            <div className="rounded-xl p-10 flex flex-col items-center text-center" style={{ background: '#161b27', border: '1px solid #2a3347' }}>
              <svg className="animate-spin h-10 w-10 mb-5" viewBox="0 0 24 24" fill="none" style={{ color: '#f59e0b' }}>
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-base font-semibold mb-1" style={{ color: '#e2e8f0' }}>
                Claude is reading your document
              </p>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Extracting {importType} · this takes 10–30 seconds for large files
              </p>
            </div>
          </div>
        )}

        {/* ── AI results — preview + import ────────────────────────────────── */}
        {pageState === 'ai-done' && parseResult && aiRecords && (
          <div className="space-y-5">
            <FileSummaryBar result={parseResult} onReset={reset} />

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a3347' }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#1a1f2e', borderBottom: '1px solid #2a3347' }}>
                <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                  🤖 AI extracted {aiRecords.length} {importType} record{aiRecords.length !== 1 ? 's' : ''}
                </span>
                {aiRecords.length > 10 && (
                  <span className="text-xs" style={{ color: '#64748b' }}>Showing 10 of {aiRecords.length}</span>
                )}
              </div>

              {aiRecords.length === 0 ? (
                <div className="py-12 text-center" style={{ background: '#161b27' }}>
                  <p className="text-sm mb-1" style={{ color: '#64748b' }}>No records found in this file.</p>
                  <p className="text-xs" style={{ color: '#4b5563' }}>
                    Try switching to &quot;{importType === 'employees' ? 'projects' : 'employees'}&quot; or check the file contains relevant data.
                  </p>
                </div>
              ) : (
                <AIRecordTable records={aiRecords} importType={importType} />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPageState('parsed')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#1a1f2e', color: '#94a3b8', border: '1px solid #2a3347', cursor: 'pointer' }}
              >
                ↩ Re-process
              </button>
              {aiRecords.length > 0 && (
                <button
                  onClick={importRecords}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#f59e0b', color: '#0d1117', border: 'none', cursor: 'pointer' }}
                >
                  Import {aiRecords.length} record{aiRecords.length !== 1 ? 's' : ''} → {importType === 'employees' ? 'Employees' : 'Projects'} ↗
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Saving spinner ───────────────────────────────────────────────── */}
        {pageState === 'saving' && parseResult && (
          <div className="space-y-5">
            <FileSummaryBar result={parseResult} onReset={reset} />
            <div className="rounded-xl p-10 flex flex-col items-center text-center" style={{ background: '#161b27', border: '1px solid #2a3347' }}>
              <svg className="animate-spin h-10 w-10 mb-5" viewBox="0 0 24 24" fill="none" style={{ color: '#14b8a6' }}>
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-base font-semibold mb-1" style={{ color: '#e2e8f0' }}>
                Importing {aiRecords?.length} records…
              </p>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Saving to {importType} table in Supabase
              </p>
            </div>
          </div>
        )}

        {/* ── Import success ───────────────────────────────────────────────── */}
        {pageState === 'imported' && importResult && (
          <div className="rounded-xl p-10" style={{ background: '#161b27', border: '1px solid #2a3347' }}>
            <div className="flex flex-col items-center text-center">
              <div style={{ fontSize: 52, marginBottom: 16 }}>
                {importResult.failed === 0 ? '✅' : '⚠️'}
              </div>
              <p className="text-xl font-bold mb-3" style={{ color: '#e2e8f0' }}>Import complete</p>
              <p className="text-sm" style={{ color: '#4ade80' }}>
                {importResult.saved} record{importResult.saved !== 1 ? 's' : ''} saved to {importResult.importType}
              </p>
              {importResult.failed > 0 && (
                <p className="text-sm mt-1" style={{ color: '#ef4444' }}>
                  {importResult.failed} record{importResult.failed !== 1 ? 's' : ''} skipped (missing required name field)
                </p>
              )}

              <div className="flex gap-3 mt-7">
                <a
                  href={importResult.importType === 'employees' ? '/admin/workforce' : '/admin/projects'}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#f59e0b', color: '#0d1117', textDecoration: 'none' }}
                >
                  View {importResult.importType === 'employees' ? 'Workforce' : 'Projects'} ↗
                </a>
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: '#1a1f2e', color: '#94a3b8', border: '1px solid #2a3347', cursor: 'pointer' }}
                >
                  Import another file
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
