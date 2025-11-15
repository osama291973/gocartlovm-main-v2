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
 * Uses Hugging Face FREE API for vision analysis (no API key needed!)
 * Supports image-to-text extraction for product metadata
 * 
 * NO OPENAI COSTS - COMPLETELY FREE!
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

    console.log(`🖼️ [Hugging Face] Analyzing image: ${imageUrl}`);

    // Step 1: Use Hugging Face Image-to-Text model (FREE - no API key needed)
    // This model analyzes the image and returns a text description
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
      console.error(`Hugging Face API error: ${huggingFaceResponse.status} - ${errorText}`);
      throw new Error(`Image analysis failed: ${huggingFaceResponse.statusText}`);
    }

    const huggingFaceData = await huggingFaceResponse.json();
    
    // Hugging Face returns array of results with "generated_text"
    let imageDescription = "Product";
    if (Array.isArray(huggingFaceData) && huggingFaceData[0]?.generated_text) {
      imageDescription = huggingFaceData[0].generated_text;
    } else if (huggingFaceData?.generated_text) {
      imageDescription = huggingFaceData.generated_text;
    }

    console.log(`✨ [Image Analysis] Extracted: "${imageDescription}"`);

    // Step 2: Extract product name and description from the analyzed text
    // Using simple but effective rules:
    const nameMatch = imageDescription.match(/(?:a |an |the )?([a-z0-9\s]+?)(?:\s+(?:with|in|on|for|of|and))/i);
    let productName = nameMatch ? nameMatch[1].trim() : imageDescription.split(" ").slice(0, 3).join(" ");
    
    // Ensure name is max 50 chars
    productName = productName.substring(0, 50).trim();
    
    // Create slug
    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Step 3: Generate Arabic translations (simple transliteration + description)
    // For production, you'd use a translation API, but this is a simple fallback
    const arabicName = await generateArabicTranslation(productName);
    const arabicDescription = await generateArabicTranslation(imageDescription);

    // Step 4: Build response
    const response: SuccessResponse = {
      success: true,
      generated: {
        en: {
          name: productName || "Product",
          description: imageDescription || "Quality product",
          slug: slug || "product",
        },
        ar: {
          name: arabicName || "منتج",
          description: arabicDescription || "منتج بجودة عالية",
        },
      },
    };

    console.log(`✅ [Success] Generated metadata for product`);
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

/**
 * Simple Arabic translation helper
 * For full production app, integrate with Google Translate or Microsoft Translator API
 */
async function generateArabicTranslation(text: string): Promise<string> {
  try {
    // Using Hugging Face's Helsinki translation model (FREE)
    // Model: Helsinki-NLP/opus-mt-en-ar (English to Arabic)
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
      console.warn(`Translation failed: ${translationResponse.statusText}`);
      return "منتج"; // Fallback
    }

    const translationData = await translationResponse.json();
    if (Array.isArray(translationData) && translationData[0]?.translation_text) {
      return translationData[0].translation_text;
    }
    return "منتج";
  } catch (error) {
    console.warn(`Arabic translation error:`, error);
    return "منتج"; // Fallback
  }
}
