import type { AuthUser } from "@/components/AuthModal";
import type { ChannelId } from "@/lib/channels";

function keyFor(channel: ChannelId) {
  return `spin-play-session-${channel}`;
}

export function savePlaySession(channel: ChannelId, user: AuthUser) {
  try {
    sessionStorage.setItem(keyFor(channel), JSON.stringify(user));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadPlaySession(channel: ChannelId): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(keyFor(channel));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.phone || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlaySession(channel: ChannelId) {
  try {
    sessionStorage.removeItem(keyFor(channel));
  } catch {
    /* ignore */
  }
}
