import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

const EMPLOYEE_SYSTEM = `You are a data extraction assistant for Gulf Pioneer Petroleum Contractors (GPPC), an oil & gas company operating across the Gulf region. Extract employee records from the provided content and return them as a JSON array.

Each record must have these exact fields:
- name: string (required — omit the record if truly unknown)
- email: string or null
- job_title: string or null
- department: string or null — map to the closest of: Drilling Operations, Pipeline Engineering, HSE, Procurement, Finance, HR, Maintenance, Project Management
- site: string or null — map to the closest of: ruwais, dammam, duqm, doha
- salary: number or null (annual, in USD)
- status: "active" or "inactive" (default "active" if not specified)
- hire_date: string or null (YYYY-MM-DD format)

IMPORTANT: Return ONLY a valid JSON array. No markdown code fences, no explanation text. If no records found, return []. Never invent data — use null for genuinely unknown fields.`

const PROJECT_SYSTEM = `You are a data extraction assistant for Gulf Pioneer Petroleum Contractors (GPPC), an oil & gas company. Extract project records from the provided content and return them as a JSON array.

Each record must have these exact fields:
- name: string (required — omit the record if truly unknown)
- site: string or null — map to the closest of: ruwais, dammam, duqm, doha
- country: string or null
- status: one of on_track, at_risk, completed, archived (default "on_track" if not specified)
- phase: string or null
- deadline: string or null (YYYY-MM-DD format)
- pm: string or null (project manager full name)
- description: string or null
- budget_amount: number or null (in USD)
- milestone_pct: number 0–100 (default 0 if not specified)

IMPORTANT: Return ONLY a valid JSON array. No markdown code fences, no explanation text. If no records found, return []. Never invent data — use null for genuinely unknown fields.`

export async function POST(request: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY

  if (!key) {
    return NextResponse.json(
      {
        configured: false,
        error:
          'AI key not configured yet. Add ANTHROPIC_API_KEY to .env.local to enable AI processing.',
      },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as {
      importType: 'employees' | 'projects'
      content: string
    }

    if (!body.importType || !body.content) {
      return NextResponse.json(
        { error: 'importType and content are required' },
        { status: 400 }
      )
    }

    const client = new Anthropic({ apiKey: key })
    const system = body.importType === 'employees' ? EMPLOYEE_SYSTEM : PROJECT_SYSTEM

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [
        {
          role: 'user',
          content: `Extract all ${body.importType} records from the following content:\n\n${body.content}`,
        },
      ],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Strip accidental markdown fences if Claude adds them
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()

    let records: unknown[]
    try {
      records = JSON.parse(cleaned)
      if (!Array.isArray(records)) records = []
    } catch {
      console.error('[/api/ai-process] JSON parse failed:', rawText)
      return NextResponse.json(
        {
          error:
            'AI returned an unexpected format. Please try again or use a simpler file.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ configured: true, records })
  } catch (err) {
    console.error('[/api/ai-process]', err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'AI processing failed. Please try again.',
      },
      { status: 500 }
    )
  }
}
