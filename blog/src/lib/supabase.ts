import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Public client — used for reads in server components
// Returns null if env vars are not configured (e.g. during CI build)
function createPublicClient(): SupabaseClient | null {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return null;
    }
    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createPublicClient();

// Service-role client — used in API routes for writes
export function getServiceClient(): SupabaseClient {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceKey) {
        throw new Error("Missing Supabase service role configuration");
    }
    return createClient(supabaseUrl, serviceKey);
}
