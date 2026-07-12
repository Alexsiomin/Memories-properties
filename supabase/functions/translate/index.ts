// Batch translation edge function using Lovable AI.
// Receives an array of English strings, returns the same array translated to Russian.

// Hard-coded glossary overrides for specific UI terms.
const RU_OVERRIDES: Record<string, string> = {
  "Account": "Кабинет",
  "ADVOCACY": "адвокатура",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { texts, target } = await req.json();
    if (!Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ translations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = target === "ru" ? "Russian" : String(target || "Russian");

    // Number each segment so the model can return an aligned JSON array.
    const numbered = texts.map((t, i) => `${i}\u0001${t}`).join("\n\u0002\n");

    const systemPrompt =
      `You are a professional translator for a luxury real estate website. ` +
      `Translate each numbered segment from English into ${lang}. ` +
      `Keep the SAME meaning, tone (discreet, prestige) and any numbers, prices, currency symbols and proper nouns / brand names (e.g. "Memories") unchanged. ` +
      `Do NOT translate email addresses, URLs, or phone numbers. ` +
      `Preserve leading/trailing spaces. ` +
      `Return ONLY a JSON object of the form {"t":["...","..."]} where the array has EXACTLY one translated string per input segment, in the same order. No extra commentary.`;

    const userPrompt =
      `Segments (each line starts with an index and \u0001 separator, segments separated by \u0002):\n` +
      numbered;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const status = resp.status;
      const body = await resp.text();
      return new Response(JSON.stringify({ error: "gateway", status, body }), {
        status: status === 429 || status === 402 ? status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let translations: string[] = [];
    try {
      const parsed = JSON.parse(content);
      translations = Array.isArray(parsed) ? parsed : parsed.t ?? parsed.translations ?? [];
    } catch {
      translations = [];
    }

    // Fallback to originals for any missing entries, then apply glossary overrides.
    const result = texts.map((t, i) => {
      const raw =
        typeof translations[i] === "string" && translations[i].length > 0 ? translations[i] : t;
      return RU_OVERRIDES[t] ?? raw;
    });

    return new Response(JSON.stringify({ translations: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
