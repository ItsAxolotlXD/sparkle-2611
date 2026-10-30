import { createClient } from '@supabase/supabase-js';

const viteEnv = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const supabaseUrl =
  viteEnv.VITE_SUPABASE_URL ||
  viteEnv.NEXT_PUBLIC_SUPABASE_URL ||
  viteEnv.SUPABASE_URL;
const supabaseAnonKey =
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  viteEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  viteEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  viteEnv.SUPABASE_PUBLISHABLE_KEY ||
  viteEnv.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

const configuredRedirectUrl = viteEnv.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;

// OAuth providers must return to the origin currently hosting the Vite app.
// A stale localhost redirect variable breaks sign-in from previews and production.
export const authRedirectUrl = (() => {
  if (!configuredRedirectUrl) return window.location.origin;

  try {
    const configuredUrl = new URL(configuredRedirectUrl);
    return configuredUrl.origin === window.location.origin
      ? configuredUrl.toString()
      : window.location.origin;
  } catch {
    return window.location.origin;
  }
})();
