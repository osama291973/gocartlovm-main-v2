
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


export async function generateProductFromImage(
  imageUrl: string,
  language: "en" | "ar",
  storeId: string
): Promise<{ success: boolean; generated?: GeneratedProductMetadata; error?: string }> {
  try {
    if (!imageUrl || !imageUrl.startsWith("http")) throw new Error("Invalid image URL");
    if (!["en", "ar"].includes(language)) throw new Error("Language must be 'en' or 'ar'");
    if (!storeId) throw new Error("Store ID is required");

    // Get Supabase credentials from environment variables
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    if (!supabaseAnonKey) {
      throw new Error("Supabase anon key not found in environment variables");
    }

    // Always use the deployed function URL
    const functionUrl = `https://${supabaseProjectId}.functions.supabase.co/generate_product_from_image`;

    const resp = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "apikey": supabaseAnonKey,
        "x-client-info": "gocart-frontend"
      },
      body: JSON.stringify({ imageUrl, storeId, language }),
    });

    const data = await resp.json();
    if (!resp.ok || !data.success) throw new Error(data.error || "Edge Function call failed");

    return { success: true, generated: data.generated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
