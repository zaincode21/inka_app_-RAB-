const DEFAULT_API_BASE_URL = 'http://localhost:4000/api/v1';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Network request failed. Check your connection and try again.');
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}.`);
      }
      throw new Error('Unexpected end of JSON input from server.');
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload &&
      'message' in payload &&
      typeof (payload as { message: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : `API request failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return payload as T;
}

/** Fetch a non-JSON body (e.g. CSV export). */
export async function apiRequestText(path: string, options: RequestInit = {}): Promise<string> {
  const headers: Record<string, string> = {
    Accept: 'text/csv, text/plain, */*',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const payload = text ? JSON.parse(text) : null;
      if (typeof payload?.message === 'string') {
        message = payload.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return text;
}

/** Absolute URL for media stored as /uploads/... or already absolute. */
export function resolveMediaUrl(uri?: string | null): string {
  if (!uri?.trim()) {
    return '';
  }
  if (/^https?:\/\//i.test(uri) || uri.startsWith('file:') || uri.startsWith('content:')) {
    return uri;
  }
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${uri.startsWith('/') ? uri : `/${uri}`}`;
}

export function toJsonBody(data: unknown): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify(data),
  };
}
