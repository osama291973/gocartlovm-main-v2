// Use explicit URL import for Deno std to satisfy the Supabase bundler
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

if (!OPENAI_KEY) {
  console.error('OPENAI_API_KEY not set');
}

async function callOpenAI(prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      temperature: 0.15,
      messages: [
        { role: 'system', content: 'You are an assistant that outputs strictly valid JSON.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const j = await res.json();
  return j;
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const body = await req.json();
    const imageUrls: string[] = body.imageUrls || (body.imageUrl ? (Array.isArray(body.imageUrl) ? body.imageUrl : [body.imageUrl]) : []);
    const language = (body.language || 'en') as 'en' | 'ar';
    const storeId = body.storeId || null;

    if (!imageUrls.length) {
      return new Response(JSON.stringify({ success: false, error: 'imageUrls required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!['en', 'ar'].includes(language)) {
      return new Response(JSON.stringify({ success: false, error: 'language must be en or ar' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const urlsText = imageUrls.slice(0, 4).map((u, i) => `${i + 1}. ${u}`).join('\n');

    const prompt = `
You will output ONLY valid JSON with the exact shape:
{
  "en": { "name": "<short english name>", "description": "<1-2 sentence english description>", "slug": "<seo-friendly-slug>" },
  "ar": { "name": "<short arabic name>", "description": "<1-2 sentence arabic description>" }
}

Images (assume they show the product clearly):
${urlsText}

Constraints:
- English name: max 6 words.
- Arabic name: short and natural.
- Slug: lowercase ascii, hyphen-separated, max 6 words, no spaces or special chars.
- Provide very concise descriptions (1-2 sentences).
- Do not include any extra text. Output only the JSON object.
`;

    const openAiResp = await callOpenAI(prompt);

    const assistantText = (openAiResp.choices?.[0]?.message?.content) ?? (openAiResp.choices?.[0]?.text ?? '');
    let parsed;
    try {
      parsed = JSON.parse(assistantText);
    } catch (err) {
      const match = assistantText.match(/{[\s\S]*}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('OpenAI did not return parseable JSON');
      }
    }

    if (!parsed?.en?.name || !parsed?.ar?.name) {
      return new Response(JSON.stringify({ success: false, error: 'OpenAI returned incomplete data', raw: parsed }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, generated: parsed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('generate_product_from_image error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
