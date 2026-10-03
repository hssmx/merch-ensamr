const DEFAULT_SUPABASE_URL = 'https://hpnocasdahzrwcjttuok.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_42Zn7mZ-k3u1HxohxpU3zQ_FnQXscax';

// These defaults are public browser configuration, not privileged credentials.
// Environment variables can still override them for another deployment target.
export const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
).replace(/\/$/, '');

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;
