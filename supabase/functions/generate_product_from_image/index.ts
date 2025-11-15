import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RequestBody {
  imageUrl: string;
  language: "en" | "ar";
  storeId: string;
}

interface GeneratedMetadata {
  en: {
    name: string;
    description: string;
    slug: string;
  };
  ar: {
    name: string;
    description: string;
  };
}

interface SuccessResponse {
  success: true;
  generated: GeneratedMetadata;
}

interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * Supabase Edge Function: generate_product_from_image
 * Calls OpenAI Vision to analyze product image and generate metadata in EN & AR
 * 
 * Usage:
 * const response = await supabase.functions.invoke('generate_product_from_image', {
 *   body: {
 *     imageUrl: 'https://example.com/image.jpg',
 *     language: 'en',
 *     storeId: 'uuid-here'
 *   }
 * })
 */

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { imageUrl, language, storeId } = body;

    // Validate inputs
    if (!imageUrl || !language || !storeId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: imageUrl, language, storeId",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!["en", "ar"].includes(language)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Language must be 'en' or 'ar'",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get OpenAI API key from environment
    console.log("🔍 [Environment] Checking for OPENAI_API_KEY...");
    
    let openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    console.log(`📌 [Environment] OPENAI_API_KEY exists: ${!!openaiApiKey}`);
    
    if (!openaiApiKey) {
      // Try alternative environment variable names
      openaiApiKey = Deno.env.get("openai_api_key");
      console.log(`📌 [Environment] openai_api_key (lowercase) exists: ${!!openaiApiKey}`);
    }
    
    if (!openaiApiKey) {
      // Log all available environment variables for debugging
      const allEnvVars = Deno.env.toObject();
      const relevantVars = Object.keys(allEnvVars).filter(k => 
        k.toLowerCase().includes("openai") || 
        k.toLowerCase().includes("api") ||
        k.toLowerCase().includes("key")
      );
      
      console.error("❌ [ERROR] OPENAI_API_KEY not found in environment");
      console.error("📋 [Debug] Relevant env variables found:", relevantVars);
      console.error("📋 [Debug] Total env variables:", Object.keys(allEnvVars).length);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenAI API key not configured - OPENAI_API_KEY secret not bound to function",
          debug: {
            keyExists: false,
            relevantVarsFound: relevantVars,
            instruction: "Go to Supabase Dashboard → Functions → generate_product_from_image → Settings → Secrets → Toggle OPENAI_API_KEY ON"
          }
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log("✅ [Success] OPENAI_API_KEY found and loaded");

    // Combined Vision + Text API call (single call = better rate limits)
    console.log(`[Combined API] Analyzing image and generating metadata...`);
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: `Analyze this product image and generate metadata in JSON format (no markdown, pure JSON only):

{
  "en_name": "short product name in English (2-5 words, max 50 chars)",
  "en_description": "concise product description in English (20-100 words, highlight features)",
  "en_slug": "url-friendly-slug (lowercase, hyphens, no spaces)",
  "ar_name": "اسم المنتج بالعربية (2-5 كلمات)",
  "ar_description": "وصف المنتج بالعربية المختصر (20-100 كلمة)"
}

Rules:
- Analyze the image carefully
- Names should be catchy and SEO-friendly
- Descriptions should highlight key features
- Slugs must be lowercase, alphanumeric, hyphens only
- AR text must be proper Arabic
- Return ONLY valid JSON, nothing else`,
              },
            ],
          },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`OpenAI API error: ${apiResponse.status} - ${errorText}`);
      throw new Error(`OpenAI API failed: ${apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();
    const generatedRaw = apiData.choices?.[0]?.message?.content;

    if (!generatedRaw) {
      throw new Error("No content returned from OpenAI");
    }

    console.log(`[Raw Response] ${generatedRaw}`);

    // Parse JSON response
    let generatedJson: Record<string, string>;
    try {
      generatedJson = JSON.parse(generatedRaw);
    } catch (_) {
      // If direct parse fails, try extracting JSON from response
      const jsonMatch = generatedRaw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse JSON from OpenAI response");
      }
      generatedJson = JSON.parse(jsonMatch[0]);
    }

    // Build response with both EN & AR
    const response: SuccessResponse = {
      success: true,
      generated: {
        en: {
          name: generatedJson.en_name || "Product",
          description: generatedJson.en_description || "Quality product",
          slug: generatedJson.en_slug || "product",
        },
        ar: {
          name: generatedJson.ar_name || "منتج",
          description: generatedJson.ar_description || "منتج بجودة عالية",
        },
      },
    };

    console.log(`[Success] Generated metadata for product`);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Error] ${errorMessage}`);

    const errorResponse: ErrorResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
