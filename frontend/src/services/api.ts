import type {
  AuthResponse,
  CurrentCombatSessionResponse,
  CurrentUserResponse,
  LoginRequest,
} from '../types/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const LIKELY_LOGGED_IN_KEY = 'isLikelyLoggedIn';
const ACTIVE_COMBAT_ID_KEY = 'activeCombatId';

export function isValidToken(token: string | null | undefined): token is string {
  return (
    typeof token === 'string' &&
    token.trim().length > 0 &&
    token !== 'null' &&
    token !== 'undefined'
  );
}

export function getAccessToken(): string | null {
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (isValidToken(stored)) {
    return stored;
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  return null;
}

export function setAccessToken(token: string | null | undefined): void {
  if (isValidToken(token)) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  const win = window as Window & { setAccessToken?: (t: string | null) => void };
  if (typeof win.setAccessToken === 'function') {
    win.setAccessToken(isValidToken(token) ? token : null);
  }
}

export function isAlreadyAuthenticated(): boolean {
  const isLikely = localStorage.getItem(LIKELY_LOGGED_IN_KEY) === 'true';
  const token = getAccessToken();
  return isLikely && isValidToken(token);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem('refreshToken');
  localStorage.removeItem(LIKELY_LOGGED_IN_KEY);
  localStorage.removeItem(ACTIVE_COMBAT_ID_KEY);
}

let refreshingTokenPromise: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  if (!refreshingTokenPromise) {
    refreshingTokenPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as AuthResponse;
          if (isValidToken(data.token)) {
            setAccessToken(data.token);
            return true;
          }
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        setTimeout(() => {
          refreshingTokenPromise = null;
        }, 200);
      });
  }
  return refreshingTokenPromise;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || undefined);
  const token = getAccessToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? 'same-origin',
  });

  if (
    res.status === 401 &&
    !url.includes('/api/auth/refresh') &&
    !url.includes('/api/auth/login') &&
    !url.includes('/api/auth/register')
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      const updatedToken = getAccessToken();
      if (updatedToken) {
        headers.set('Authorization', `Bearer ${updatedToken}`);
      }
      res = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials ?? 'same-origin',
      });
    } else {
      clearAuthStorage();
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
  }

  return res;
}

export async function loginApi(
  credentials: LoginRequest
): Promise<{ ok: boolean; message?: string; activeCombatSessionId?: string | null }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(credentials),
  });

  const data = (await res.json()) as AuthResponse;

  if (!res.ok) {
    return {
      ok: false,
      message: data.message || data.error || 'Erreur de connexion',
    };
  }

  if (data.token) {
    setAccessToken(data.token);
  }
  localStorage.setItem(LIKELY_LOGGED_IN_KEY, 'true');

  // Vérification d'une session de combat active (parité avec auth.js)
  let activeCombatSessionId: string | null = null;
  if (data.token) {
    try {
      const currentSessionRes = await fetch('/api/pve/combat/current', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (currentSessionRes.ok) {
        const sessionData = (await currentSessionRes.json()) as CurrentCombatSessionResponse;
        if (sessionData && sessionData.sessionId) {
          activeCombatSessionId = sessionData.sessionId;
          localStorage.setItem(ACTIVE_COMBAT_ID_KEY, sessionData.sessionId);
        }
      }
    } catch (e) {
      console.warn('Could not check active combat session on login', e);
    }
  }

  return {
    ok: true,
    message: data.message,
    activeCombatSessionId,
  };
}

export async function registerApi(
  credentials: LoginRequest
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(credentials),
  });

  const data = (await res.json()) as AuthResponse;

  if (!res.ok) {
    return {
      ok: false,
      message: data.message || data.error || "Erreur lors de l'inscription",
    };
  }

  if (data.token) {
    setAccessToken(data.token);
  }
  localStorage.setItem(LIKELY_LOGGED_IN_KEY, 'true');

  return {
    ok: true,
    message: data.message || "Inscription réussie ! Redirection vers l'armurerie...",
  };
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse | null> {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as CurrentUserResponse;
}

export function isAdmin(user: CurrentUserResponse | null | undefined): boolean {
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }
  return user.roles.some(
    (r) => r.authority === 'ADMIN' || r.authority === 'ROLE_ADMIN'
  );
}

export async function logoutApi(): Promise<void> {
  clearAuthStorage();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch (e) {
    console.warn('Logout request failed', e);
  }
}

export async function apiGet<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(url, { ...options, method: 'GET' });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Erreur GET ${url}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || undefined);
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await apiFetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Erreur POST ${url}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || undefined);
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await apiFetch(url, {
    ...options,
    method: 'PUT',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Erreur PUT ${url}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function apiDelete<T = void>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(url, { ...options, method: 'DELETE' });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Erreur DELETE ${url}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

