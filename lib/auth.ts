// Auth utilities for client-side

export interface AuthUser {
  role: 'user' | 'admin';
  username: string;
  user: {
    id: string;
    name: string;
    squad_id: number;
    batch: number;
  } | null;
}

export function getAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  const authStr = localStorage.getItem('auth');
  if (!authStr) return null;
  
  try {
    return JSON.parse(authStr);
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth', JSON.stringify(auth));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth');
}

export function isAuthenticated(): boolean {
  return getAuth() !== null;
}

export function isAdmin(): boolean {
  const auth = getAuth();
  return auth?.role === 'admin';
}
