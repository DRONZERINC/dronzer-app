import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'
export const maxDuration = 30

type Row = Record<string, string>

function toStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().split('T')[0]
  return String(v)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name
    const fileSizeKB = (file.size / 1024).toFixed(1)
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

    // ── Spreadsheet (CSV / Excel) ────────────────────────────────────────────
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
      const sheetName = wb.SheetNames[0]
      const sheet = wb.Sheets[sheetName]
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      const rows: Row[] = rawRows.map(r =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [k, toStr(v)]))
      )
      const headers = rows.length > 0 ? Object.keys(rows[0]) : []

      return NextResponse.json({
        type: 'spreadsheet',
        fileName,
        fileSizeKB,
        headers,
        totalRows: rows.length,
        preview: rows.slice(0, 20),
        allRows: rows.slice(0, 500), // capped for AI processing payload
      })
    }

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (
        buf: Buffer
      ) => Promise<{ text: string; numpages: number }>
      const data = await pdfParse(buffer)
      const fullText = data.text.trim()

      return NextResponse.json({
        type: 'text',
        fileName,
        fileSizeKB,
        fullText,
        preview: fullText.slice(0, 2000),
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        charCount: fullText.length,
        pages: data.numpages,
      })
    }

    // ── Word document ────────────────────────────────────────────────────────
    if (['docx', 'doc'].includes(ext)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth') as {
        extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>
      }
      const result = await mammoth.extractRawText({ buffer })
      const fullText = result.value.trim()

      return NextResponse.json({
        type: 'text',
        fileName,
        fileSizeKB,
        fullText,
        preview: fullText.slice(0, 2000),
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        charCount: fullText.length,
      })
    }

    return NextResponse.json(
      { error: 'Unsupported file type. Upload a CSV, XLSX, PDF, or DOCX file.' },
      { status: 400 }
    )
  } catch (err) {
    console.error('[/api/upload]', err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to parse file. Check it is not corrupted or password-protected.',
      },
      { status: 500 }
    )
  }
}
