import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    "https://jypaxiijripktsqmocgh.supabase.co",
    "sb_publishable_JGFOeLC80aYZwZ41K4ETUQ_oQu3gQIj"
  )
}
