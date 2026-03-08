import { createBrowserClient } from "@supabase/ssr";

/** Browser (client-side) Supabase client — use inside client components only */
export function createAuthBrowserClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
