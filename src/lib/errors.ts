// Supabase calls throw a PostgrestError (or a plain fetch failure). Neither
// reaches the UI as a reliably readable string, and PostgREST puts the
// actionable fix in `hint`, not `message`. Flatten both here so screens can
// show something useful, and add setup guidance for the common case: the Clerk
// session never reaches Supabase, so RLS runs the request as `anon` and every
// `to authenticated` policy rejects it.

type SupabaseLikeError = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

export const CLERK_SUPABASE_HINT =
  "Supabase isn't accepting your Clerk sign-in, so the row was saved as a signed-out " +
  'request and blocked. Enable the Clerk third-party auth integration in the Supabase ' +
  'dashboard (Authentication -> Sign In / Providers -> Third-Party Auth -> Clerk), turn ' +
  'on the Supabase integration in the Clerk dashboard, then restart the dev server.';

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
    // Plain JS or network error - keep it as-is.
    return err;
  }

  const e = (err ?? {}) as SupabaseLikeError;
  const parts: string[] = [];
  if (e.message?.trim()) parts.push(e.message.trim());
  if (e.details && e.details !== e.message) parts.push(String(e.details).trim());
  if (e.hint) parts.push(`Hint: ${String(e.hint).trim()}`);
  if (e.code) parts.push(`(${e.code})`);

  let message = parts.join(' ') || 'Something went wrong talking to Supabase.';
  if (looksLikeAuthFailure(err)) message += `\n\n${CLERK_SUPABASE_HINT}`;
  return new Error(message);
}
