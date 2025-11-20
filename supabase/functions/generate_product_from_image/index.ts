
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

interface RequestBody {
  imageUrl: string;
  storeId: string;
}

interface Metadata {
  en: { name: string; description: string; slug: string };
  ar: { name: string; description: string };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { imageUrl, storeId } = body;
  if (!imageUrl || !storeId) {
    const missing = [];
    if (!imageUrl) missing.push("imageUrl");
    if (!storeId) missing.push("storeId");
    return new Response(
      JSON.stringify({ success: false, error: `Missing required fields: ${missing.join(", ")}` }),
      { status: 400, headers: corsHeaders }
    );
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing OpenAI API key in environment variables." }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const result = await analyzeWithOpenAI(imageUrl, apiKey);
    return new Response(
      JSON.stringify({
        success: true,
        generated: result,
        provider: "openai",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function analyzeWithOpenAI(imageUrl: string, apiKey: string): Promise<Metadata> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            {
              type: "text",
              text: `Analyze this product image and return ONLY valid JSON (no markdown, no text before/after):\n{\n  \"en_name\": \"product name (specific, not generic)\",\n  \"en_description\": \"product description\",\n  \"en_slug\": \"url-slug-format\",\n  \"ar_name\": \"اسم المنتج بالعربية\",\n  \"ar_description\": \"وصف المنتج بالعربية\"\n}`,
            },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from OpenAI");

  let json = JSON.parse(content);
  return {
    en: {
      name: json.en_name || "Product",
      description: json.en_description || "Quality product",
      slug: json.en_slug || "product",
    },
    ar: {
      name: json.ar_name || "منتج",
      description: json.ar_description || "منتج بجودة عالية",
    },
  };
}
