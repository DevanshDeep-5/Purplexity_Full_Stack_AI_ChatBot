
import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  return createClient(
    "https://jypaxiijripktsqmocgh.supabase.co",
    process.env.SUPABASE_API_SECRET!
  )
}
