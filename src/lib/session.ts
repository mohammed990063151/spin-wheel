import type { AuthUser } from "@/components/AuthModal";
import type { BrandId } from "@/lib/prizes";

function keyFor(brand: BrandId) {
  return `spin-play-session-${brand}`;
}

export function savePlaySession(brand: BrandId, user: AuthUser) {
  try {
    sessionStorage.setItem(keyFor(brand), JSON.stringify(user));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadPlaySession(brand: BrandId): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(keyFor(brand));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.phone || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPlaySession(brand: BrandId) {
  try {
    sessionStorage.removeItem(keyFor(brand));
  } catch {
    /* ignore */
  }
}
