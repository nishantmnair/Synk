import { User } from '../services/djangoAuth';

/** Display name: first_name > last_name > username. Never fake placeholder. */
export function getDisplayName(user: User | null): string {
  if (!user) return 'Signed in';
  const first = (user.first_name ?? '').trim();
  const last = (user.last_name ?? '').trim();
  const name = [first, last].filter(Boolean).join(' ').trim();
  if (name) return name;
  return (user.username ?? '').trim() || 'Signed in';
}

/** Email or username for secondary display. Never use fake placeholder like user@synk.app. */
export function getEmailOrUsername(user: User | null): string | null {
  if (!user) return null;
  const e = (user.email ?? '').trim();
  const u = (user.username ?? '').trim();
  if (e) return e;
  if (u) return u;
  return null;
}
