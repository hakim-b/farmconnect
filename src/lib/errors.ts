// Supabase calls throw a PostgrestError (or a plain fetch failure). Neither
// reaches the UI as a reliably readable string, and PostgREST puts the
// actionable fix in `hint`, not `message`. Flatten both here so screens can
// show something useful.

type SupabaseLikeError = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

export const AUTH_SESSION_HINT =
  'This request was blocked because you are not signed in to the database. Sign out and sign in again, then retry.';

function hasPostgrestFields(err: object): err is SupabaseLikeError {
  return 'code' in err || 'hint' in err || 'details' in err;
}

/** True when the failure looks like a missing/invalid auth token rather than bad data. */
export function looksLikeAuthFailure(err: unknown): boolean {
  const e = (err ?? {}) as SupabaseLikeError;
  const code = String(e.code ?? '');
  const msg = (e.message ?? '').toLowerCase();
  return (
    code === '42501' || // Postgres: RLS violation / permission denied
    code === 'PGRST301' || // PostgREST: JWT missing, invalid, or expired
    code === 'PGRST302' || // PostgREST: anonymous access disabled
    msg.includes('row-level security') ||
    msg.includes('jwt') ||
    msg.includes('permission denied')
  );
}

/** Normalise anything thrown by a Supabase call into a real Error worth showing. */
export function toError(err: unknown): Error {
  if (err instanceof Error && !hasPostgrestFields(err)) {
    return err;
  }

  const e = (err ?? {}) as SupabaseLikeError;
  const parts: string[] = [];
  if (e.message?.trim()) parts.push(e.message.trim());
  if (e.details && e.details !== e.message) parts.push(String(e.details).trim());
  if (e.hint) parts.push(`Hint: ${String(e.hint).trim()}`);
  if (e.code) parts.push(`(${e.code})`);

  let message = parts.join(' ') || 'Something went wrong talking to Supabase.';
  if (looksLikeAuthFailure(err)) message += `\n\n${AUTH_SESSION_HINT}`;
  return new Error(message);
}
