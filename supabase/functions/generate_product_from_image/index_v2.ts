import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RequestBody {
  imageUrl: string;
  language?: string;
  storeId: string;
}

interface Metadata {
  en: { name: string; description: string; slug: string };
  ar: { name: string; description: string };
}

interface SuccessResponse {
  success: true;
  generated: Metadata;
  provider: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type Response = SuccessResponse | ErrorResponse;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new globalThis.Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new globalThis.Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { imageUrl, storeId } = body;

    if (!imageUrl) {
      return new globalThis.Response(
        JSON.stringify({ success: false, error: "Missing imageUrl" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!storeId) {
      return new globalThis.Response(
        JSON.stringify({ success: false, error: "Missing storeId" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[START] Image: ${imageUrl.substring(0, 50)}...`);

    // Try OpenAI
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (apiKey) {
      try {
        console.log("[OpenAI] Trying OpenAI...");
        const result = await analyzeWithOpenAI(imageUrl, apiKey);
        console.log("[OpenAI] Success!");
        return new globalThis.Response(
          JSON.stringify({
            success: true,
            generated: result,
            provider: "openai",
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (e) {
        console.warn(`[OpenAI] Failed: ${e}`);
      }
    }

    // Fallback to HuggingFace
    console.log("[HuggingFace] Trying HuggingFace...");
    const result = await analyzeWithHuggingFace(imageUrl);
    console.log("[HuggingFace] Success!");
    return new globalThis.Response(
      JSON.stringify({
        success: true,
        generated: result,
        provider: "huggingface",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] ${msg}`);
    return new globalThis.Response(
      JSON.stringify({ success: false, error: msg }),
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
              text: `Analyze this product image and return ONLY valid JSON (no markdown, no text before/after):
{
  "en_name": "product name (specific, not generic)",
  "en_description": "product description",
  "en_slug": "url-slug-format",
  "ar_name": "اسم المنتج بالعربية",
  "ar_description": "وصف المنتج بالعربية"
}`,
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

async function analyzeWithHuggingFace(imageUrl: string): Promise<Metadata> {
  const visionResp = await fetch(
    "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: imageUrl }),
    }
  );

  if (!visionResp.ok) throw new Error(`Vision: ${visionResp.statusText}`);

  const visionData = await visionResp.json();
  const caption = Array.isArray(visionData)
    ? visionData[0]?.generated_text || "product"
    : visionData?.generated_text || "product";

  const name = caption.split(" ").slice(0, 3).join(" ");
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

  const arName = await translateAr(name);
  const arDesc = await translateAr(caption);

  return {
    en: { name, description: caption, slug },
    ar: { name: arName, description: arDesc },
  };
}

async function translateAr(text: string): Promise<string> {
  try {
    const resp = await fetch(
      "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-ar",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!resp.ok) return "منتج";
    const data = await resp.json();
    return Array.isArray(data)
      ? data[0]?.translation_text || "منتج"
      : data?.translation_text || "منتج";
  } catch {
    return "منتج";
  }
}
