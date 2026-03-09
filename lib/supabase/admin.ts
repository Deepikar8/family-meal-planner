import { createClient } from '@supabase/supabase-js'

/**
 * Admin (service-role) Supabase client — bypasses Row Level Security.
 * Use ONLY in server-side code (Server Components, Route Handlers) for
 * operations that intentionally need to bypass RLS, like reading a shared
 * meal plan by its public share_token without requiring authentication.
 *
 * NEVER import this in client components or expose it to the browser.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in your environment variables.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env.local file. ' +
      'Find it in your Supabase dashboard → Project Settings → API → service_role key.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // Disable auto-refresh and session persistence — not needed for server-side admin ops
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
