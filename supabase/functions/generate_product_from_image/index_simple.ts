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

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

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

    console.log(`✅ [Autofill] Processing image for store: ${storeId}`);

    // SIMPLE APPROACH: Extract filename from URL to generate product name
    // This is instant, free, and doesn't depend on external APIs
    const fileName = imageUrl.split("/").pop() || "product";
    const fileWithoutExt = fileName.split(".")[0] || "product";
    
    // Generate product name from filename
    let productName = fileWithoutExt
      .replace(/\d+/g, "") // Remove numbers
      .replace(/-/g, " ") // Replace dashes with spaces
      .replace(/_/g, " ") // Replace underscores with spaces
      .trim();
    
    // If name is too short or just numbers, use generic
    if (!productName || productName.length < 3) {
      productName = "Product";
    }

    // Capitalize first letter of each word
    productName = productName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
      .substring(0, 50);

    // Create slug
    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Generate description based on product type
    const description =
      `High-quality ${productName.toLowerCase()}. Perfect for everyday use. ` +
      `Premium materials and excellent craftsmanship. ` +
      `This product combines durability with elegant design.`;

    // Arabic translations (simple approach - you can enhance later)
    const arabicName = await simpleTranslate(productName);
    const arabicDescription = await simpleTranslate(description);

    const response: SuccessResponse = {
      success: true,
      generated: {
        en: {
          name: productName,
          description: description,
          slug: slug,
        },
        ar: {
          name: arabicName,
          description: arabicDescription,
        },
      },
    };

    console.log(`✅ [Success] Generated: ${productName}`);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Error] ${errorMessage}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

/**
 * Simple translation using Deno's built-in capabilities
 * For production, integrate with Google Translate or Azure Translator
 */
async function simpleTranslate(text: string): Promise<string> {
  try {
    // Basic English to Arabic mapping for common words
    const translations: Record<string, string> = {
      "high-quality": "عالي الجودة",
      "perfect": "مثالي",
      "everyday": "يومي",
      "premium": "ممتاز",
      "materials": "مواد",
      "excellent": "ممتاز",
      "craftsmanship": "حرفية",
      "combines": "يجمع",
      "durability": "متانة",
      "elegant": "أنيق",
      "design": "التصميم",
      "product": "منتج",
      "use": "استخدام",
      "quality": "جودة",
    };

    let result = text.toLowerCase();
    for (const [eng, ar] of Object.entries(translations)) {
      result = result.replace(new RegExp(eng, "g"), ar);
    }

    // If no translation happened, return generic Arabic
    if (result === text.toLowerCase()) {
      return "منتج";
    }

    return result;
  } catch (error) {
    console.warn(`Translation error: ${error}`);
    return "منتج";
  }
}
