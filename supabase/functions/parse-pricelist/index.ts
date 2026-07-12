import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

const SYSTEM_PROMPT = `You are a data-extraction engine for a real-estate admin tool.
You receive the raw text (and/or a table) of a developer's property price list — it may come from an Excel sheet or a PDF and the layout is messy and inconsistent.

Your job: return EVERY individual unit/lot as a structured row. One object per apartment/villa/plot.

Rules:
- "reference_code": the unit identifier. If the sheet is split into blocks/buildings (e.g. "Block A", "Building 2", "Phase 1") prefix the block onto the unit number so codes stay unique, e.g. "A101", "B302". Keep it short, no spaces if it reads naturally as a code.
- "category": one of Apartment, Penthouse, Studio, Maisonette, Villa, House, Bungalow, Townhouse, Office, Shop, Land / Plot. Infer from context; default to "Apartment" for numbered flats.
- Numeric fields (beds, baths, internal_area, covered_verandas, uncovered_verandas, basement, storage_room, roof_garden, parking, covered_parking, lot_size, price_value): output digits only — strip units like "m²", currency symbols, and thousands separators. "n/a", "-", "" → leave as empty string "".
- "price_value": the sale price as a plain number. If the cell says SOLD / RESERVED / UNDER OFFER, set price_value to "" and set status accordingly.
- "status": "available" (default), "sold" (SOLD), or "reserved" (RESERVED / UNDER OFFER).
- Ignore note lines, footnotes (VAT, furniture packages), totals, and repeated header rows.
- Do not invent values. If a column is missing for a unit, use "".

Return ONLY via the provided tool.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI is not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    const text: string = body?.text ?? ''
    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'No readable content was provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tool = {
      type: 'function',
      function: {
        name: 'return_lots',
        description: 'Return the extracted property units.',
        parameters: {
          type: 'object',
          properties: {
            lots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  reference_code: { type: 'string' },
                  category: { type: 'string' },
                  beds: { type: 'string' },
                  baths: { type: 'string' },
                  internal_area: { type: 'string' },
                  covered_verandas: { type: 'string' },
                  uncovered_verandas: { type: 'string' },
                  basement: { type: 'string' },
                  storage_room: { type: 'string' },
                  roof_garden: { type: 'string' },
                  parking: { type: 'string' },
                  covered_parking: { type: 'string' },
                  lot_size: { type: 'string' },
                  price_value: { type: 'string' },
                  status: { type: 'string', enum: ['available', 'sold', 'reserved'] },
                },
                required: ['reference_code', 'category', 'status'],
                additionalProperties: false,
              },
            },
          },
          required: ['lots'],
          additionalProperties: false,
        },
      },
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract every unit from this price list:\n\n${text.slice(0, 60000)}` },
        ],
        tools: [tool],
        tool_choice: { type: 'function', function: { name: 'return_lots' } },
      }),
    })

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit reached, please try again shortly.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Please top up to continue.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!aiRes.ok) {
      const detail = await aiRes.text()
      console.error('AI gateway error', aiRes.status, detail)
      return new Response(JSON.stringify({ error: 'AI extraction failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await aiRes.json()
    const call = data?.choices?.[0]?.message?.tool_calls?.[0]
    let lots: unknown[] = []
    try {
      lots = JSON.parse(call?.function?.arguments ?? '{}')?.lots ?? []
    } catch (e) {
      console.error('Failed to parse tool arguments', e)
    }

    return new Response(JSON.stringify({ lots }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
