import { supabase } from "@/integrations/supabase/client";

export interface GeneratedProductMetadata {
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

interface EdgeFunctionResponse {
  success: boolean;
  generated?: GeneratedProductMetadata;
  error?: string;
}

/**
 * Call Supabase Edge Function to generate product metadata from image
 * Uses OpenAI Vision + GPT-4o-mini for AI analysis
 *
 * @param imageUrl - Full URL of the product image (must be publicly accessible)
 * @param language - Primary language for generation ('en' or 'ar')
 * @param storeId - UUID of the store creating the product
 * @returns Promise with generated metadata in both EN & AR
 *
 * @example
 * const result = await generateProductFromImage(
 *   'https://storage.googleapis.com/bucket/product.jpg',
 *   'en',
 *   'store-uuid-here'
 * );
 * if (result.success) {
 *   console.log(result.generated.en.name); // "Premium Leather Wallet"
 *   console.log(result.generated.ar.name); // "محفظة جلد فاخرة"
 * }
 */
export async function generateProductFromImage(
  imageUrl: string,
  language: "en" | "ar",
  storeId: string
): Promise<{ success: boolean; generated?: GeneratedProductMetadata; error?: string }> {
  try {
    // Validate inputs
    if (!imageUrl || !imageUrl.startsWith("http")) {
      throw new Error("Invalid image URL");
    }

    if (!["en", "ar"].includes(language)) {
      throw new Error("Language must be 'en' or 'ar'");
    }

    if (!storeId) {
      throw new Error("Store ID is required");
    }

    console.log(`[generateProductFromImage] Calling Edge Function with image: ${imageUrl}`);

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>(
      "generate_product_from_image",
      {
        body: {
          imageUrl,
          language,
          storeId,
        },
      }
    );

    if (error) {
      console.error("[generateProductFromImage] Edge Function error:", error);
      throw new Error(error.message || "Edge Function call failed");
    }

    if (!data?.success) {
      const errorMsg = data?.error || "Unknown error from Edge Function";
      console.error("[generateProductFromImage] Function returned error:", errorMsg);
      throw new Error(errorMsg);
    }

    console.log("[generateProductFromImage] Success:", data.generated);
    return {
      success: true,
      generated: data.generated,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[generateProductFromImage] Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
