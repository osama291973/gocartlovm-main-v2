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

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!["en", "ar"].includes(language)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Language must be 'en' or 'ar'",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not set in environment");
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenAI API key not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 1: Call OpenAI Vision to analyze the image
    console.log(`[Vision API] Analyzing image: ${imageUrl}`);
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using mini for cost efficiency
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
                text: "Analyze this product image and provide a detailed description. What is the product? What are its key features? Be concise but comprehensive. Return only the description, no intro.",
              },
            ],
          },
        ],
        max_tokens: 150,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error(`Vision API error: ${visionResponse.status} - ${errorText}`);
      throw new Error(`OpenAI Vision API failed: ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    const productDescription =
      visionData.choices?.[0]?.message?.content || "Product";

    console.log(`[Vision Analysis] Extracted: ${productDescription}`);

    // Step 2: Generate product name, description, and slug in EN & AR
    console.log(`[Text API] Generating metadata in ${language}...`);
    const textResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `Based on this product description: "${productDescription}"
            
Generate a JSON response with ONLY the following structure (no markdown, no code blocks, pure JSON):
{
  "en_name": "short product name in English (2-5 words, max 50 chars)",
  "en_description": "concise product description in English (20-100 words)",
  "en_slug": "url-friendly-slug-for-english (lowercase, hyphens, no spaces)",
  "ar_name": "اسم المنتج بالعربية (2-5 كلمات)",
  "ar_description": "وصف المنتج بالعربية المختصر (20-100 كلمة)"
}

Important:
- Names should be catchy and SEO-friendly
- Descriptions should highlight key features
- Slugs should be lowercase, alphanumeric, hyphens only
- AR names/descriptions should be in proper Arabic
- Return ONLY valid JSON, nothing else`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error(`Text API error: ${textResponse.status} - ${errorText}`);
      throw new Error(`OpenAI Text API failed: ${textResponse.statusText}`);
    }

    const textData = await textResponse.json();
    const generatedRaw = textData.choices?.[0]?.message?.content;

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

    // Step 3: Build response with both EN & AR
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
    });
  }
});
