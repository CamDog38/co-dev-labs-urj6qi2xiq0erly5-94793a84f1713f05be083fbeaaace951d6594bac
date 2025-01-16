import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: true,
      },
      cookieOptions: {
        sameSite: 'none',
        secure: true,
        domain: process.env.NEXT_PUBLIC_APP_ENV === "development" ? ".localhost" : ".preview.co.dev",
      }
    }
  )

  return supabase
}