import { createBrowserClient } from '@supabase/ssr';

/**
 * 🌐 Global Client-Side Supabase (Next.js 16 Optimized)
 * This client automatically syncs with the server-side cookies
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
