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
  provider: "openai" | "huggingface"; // Shows which provider was used
}

interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * Supabase Edge Function: generate_product_from_image (HYBRID MODE)
 * 
 * SMART FALLBACK STRATEGY:
 * 1. Try OpenAI first (premium quality, costs money but best results)
 * 2. If OpenAI key missing → Use HuggingFace (free, unlimited)
 * 3. If OpenAI quota exceeded (429) → Use HuggingFace (free, unlimited)
 * 4. If both fail → Return error
 * 
 * This gives you the best of both worlds:
 * - Quality: OpenAI when available
 * - Cost: Free alternative when quota is used
 * - Reliability: Always has a fallback option
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

    console.log(`[Hybrid] Starting image analysis with fallback strategy...`);

    // ============================================================================
    // STEP 1: TRY OPENAI FIRST
    // ============================================================================
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (openaiApiKey) {
      console.log(`[OpenAI] API key found, attempting to use OpenAI...`);
      
      try {
        const metadata = await analyzeWithOpenAI(imageUrl, openaiApiKey);
        
        const response: SuccessResponse = {
          success: true,
          generated: metadata,
          provider: "openai", // ✅ Using OpenAI
        };

        console.log(`✅ [OpenAI Success] Generated metadata using OpenAI`);
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (openaiError) {
        const errorMsg = openaiError instanceof Error ? openaiError.message : String(openaiError);
        
        // Check if this is a quota exceeded error (429)
        if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("rate limit")) {
          console.warn(`⚠️ [OpenAI] Quota/Rate limit exceeded, falling back to HuggingFace...`);
        } else if (errorMsg.includes("401") || errorMsg.includes("unauthorized")) {
          console.warn(`⚠️ [OpenAI] Authentication failed, falling back to HuggingFace...`);
        } else {
          console.warn(`⚠️ [OpenAI] Error: ${errorMsg}, falling back to HuggingFace...`);
        }
        
        // Fall through to HuggingFace
      }
    } else {
      console.log(`[OpenAI] API key not found, skipping to HuggingFace...`);
    }

    // ============================================================================
    // STEP 2: FALLBACK TO HUGGINGFACE
    // ============================================================================
    console.log(`[HuggingFace] Attempting to use HuggingFace (free alternative)...`);
    
    const metadata = await analyzeWithHuggingFace(imageUrl);

    const response: SuccessResponse = {
      success: true,
      generated: metadata,
      provider: "huggingface", // ✅ Using HuggingFace
    };

    console.log(`✅ [HuggingFace Success] Generated metadata using HuggingFace`);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Fatal Error] Both providers failed: ${errorMessage}`);

    const errorResponse: ErrorResponse = {
      success: false,
      error: `All providers failed: ${errorMessage}`,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

/**
 * PROVIDER 1: OpenAI Vision API
 * Pros: Better quality, more accurate, handles complex images
 * Cons: Costs money, has quota limits
 */
async function analyzeWithOpenAI(
  imageUrl: string,
  apiKey: string
): Promise<GeneratedMetadata> {
  console.log(`[OpenAI] Calling OpenAI Chat Completions with Vision...`);

  const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: `Analyze this product image carefully and generate metadata in VALID JSON format. Return ONLY raw JSON, no markdown formatting, no comments, no extra text.

REQUIRED JSON STRUCTURE:
{
  "en_name": "short product name in English (2-5 words, max 50 characters)",
  "en_description": "concise English description (20-100 words, highlight key features and benefits)",
  "en_slug": "url-friendly-slug-lowercase-hyphens-no-spaces",
  "ar_name": "اسم المنتج باللغة العربية (2-5 كلمات)",
  "ar_description": "وصف المنتج المختصر بالعربية (20-100 كلمة، ركز على الميزات الرئيسية)"
}

CRITICAL RULES:
1. Analyze image content to identify the actual product
2. Product names MUST be specific (not generic "Product")
3. Descriptions MUST highlight actual features seen in image
4. Slugs: lowercase only, hyphens for spaces, alphanumeric + hyphens ONLY
5. Arabic text MUST be proper, grammatically correct Arabic
6. Return ONLY the JSON object, nothing before or after
7. NO markdown code blocks (\`\`\`json)
8. NO explanations or comments
9. All fields must be strings with actual content`,
            },
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  // Check for rate limit (429) or quota errors
  if (apiResponse.status === 429) {
    throw new Error("429 - OpenAI quota exceeded or rate limited");
  }

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(`OpenAI API failed (${apiResponse.status}): ${errorText}`);
  }

  const apiData = await apiResponse.json();
  const generatedRaw = apiData.choices?.[0]?.message?.content;

  if (!generatedRaw) {
    throw new Error("No content returned from OpenAI");
  }

  console.log(`[OpenAI] Raw response received, parsing JSON...`);

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

  // Normalize keys - handle both underscore and nested formats
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[_\s]/g, "");
  };

  const findValue = (keys: string[]): string => {
    for (const key of keys) {
      const normalized = normalizeKey(key);
      for (const [objKey, value] of Object.entries(generatedJson)) {
        if (normalizeKey(objKey) === normalized && typeof value === "string") {
          return value;
        }
      }
    }
    return "";
  };

  // Extract values with fallbacks for different response formats
  const enName =
    findValue(["en_name", "name", "product_name"]) || "Product";
  const enDescription =
    findValue(["en_description", "description", "product_description"]) ||
    "Quality product";
  const enSlug =
    findValue(["en_slug", "slug", "product_slug"]) ||
    enName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const arName =
    findValue(["ar_name", "arabic_name", "name_ar"]) || "منتج";
  const arDescription =
    findValue(["ar_description", "arabic_description", "description_ar"]) ||
    "منتج بجودة عالية";

  // Build response
  const metadata: GeneratedMetadata = {
    en: {
      name: enName,
      description: enDescription,
      slug: enSlug,
    },
    ar: {
      name: arName,
      description: arDescription,
    },
  };

  return metadata;
}

/**
 * PROVIDER 2: HuggingFace Vision API
 * Pros: FREE, unlimited, no quota
 * Cons: Lower quality than OpenAI, simpler descriptions
 * 
 * Uses:
 * 1. Salesforce BLIP for image captioning
 * 2. Helsinki-NLP for English → Arabic translation
 */
async function analyzeWithHuggingFace(imageUrl: string): Promise<GeneratedMetadata> {
  console.log(`[HuggingFace] Step 1: Analyzing image with BLIP vision model...`);

  // Step 1: Use Hugging Face Image-to-Text model (FREE)
  const huggingFaceResponse = await fetch(
    "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: imageUrl,
      }),
    }
  );

  if (!huggingFaceResponse.ok) {
    const errorText = await huggingFaceResponse.text();
    throw new Error(`HuggingFace vision failed: ${huggingFaceResponse.statusText} - ${errorText}`);
  }

  const huggingFaceData = await huggingFaceResponse.json();

  // Hugging Face returns array of results with "generated_text"
  let imageDescription = "Product";
  if (Array.isArray(huggingFaceData) && huggingFaceData[0]?.generated_text) {
    imageDescription = huggingFaceData[0].generated_text;
  } else if (huggingFaceData?.generated_text) {
    imageDescription = huggingFaceData.generated_text;
  }

  console.log(`[HuggingFace] Image analysis result: "${imageDescription}"`);

  // Step 2: Extract product name and description from the analyzed text
  const nameMatch = imageDescription.match(
    /(?:a |an |the )?([a-z0-9\s]+?)(?:\s+(?:with|in|on|for|of|and))/i
  );
  let productName = nameMatch
    ? nameMatch[1].trim()
    : imageDescription.split(" ").slice(0, 3).join(" ");

  // Ensure name is max 50 chars
  productName = productName.substring(0, 50).trim();

  // Create slug
  const slug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Step 3: Generate Arabic translations
  console.log(`[HuggingFace] Step 2: Translating to Arabic...`);
  
  const arabicName = await translateToArabic(productName);
  const arabicDescription = await translateToArabic(imageDescription);

  // Step 4: Build response
  const metadata: GeneratedMetadata = {
    en: {
      name: productName || "Product",
      description: imageDescription || "Quality product",
      slug: slug || "product",
    },
    ar: {
      name: arabicName || "منتج",
      description: arabicDescription || "منتج بجودة عالية",
    },
  };

  console.log(`[HuggingFace] Translation complete`);
  return metadata;
}

/**
 * Translate English text to Arabic using HuggingFace Helsinki-NLP model
 * This is a FREE translation service with no API key required
 */
async function translateToArabic(text: string): Promise<string> {
  try {
    // Using Helsinki-NLP's English to Arabic translation model (FREE)
    const translationResponse = await fetch(
      "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-ar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
        }),
      }
    );

    if (!translationResponse.ok) {
      console.warn(
        `[HuggingFace] Translation API returned ${translationResponse.status}, using fallback`
      );
      return "منتج"; // Fallback
    }

    const translationData = await translationResponse.json();
    
    if (Array.isArray(translationData) && translationData[0]?.translation_text) {
      return translationData[0].translation_text;
    }

    console.warn(`[HuggingFace] Unexpected translation response format, using fallback`);
    return "منتج";
  } catch (error) {
    console.warn(
      `[HuggingFace] Translation error: ${error instanceof Error ? error.message : String(error)}, using fallback`
    );
    return "منتج"; // Fallback
  }
}
