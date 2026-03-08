import { createClient } from "@supabase/supabase-js";

/** Browser (client-side) Supabase client — for auth flows (forgot/reset password) */
export function createAuthBrowserClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
