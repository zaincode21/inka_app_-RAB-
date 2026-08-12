import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Fallback LAN IP — update if your PC IP changes (`hostname -I`). Prefer hotspot/USB (172.20.x) when phone shares internet. */
const FALLBACK_LAN_HOST = '172.20.10.3';
const API_PORT = 4000;
const API_PREFIX = '/api/v1';

const PLACEHOLDER_API_BASE_URL = 'http://YOUR_COMPUTER_IP:4000/api/v1';

/**
 * Default API base URL (same approach as asset-audit mobile).
 * - Web (Expo in browser): localhost
 * - Device / emulator: Expo debugger host or fallback LAN IP
 */
function getDefaultApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}${API_PREFIX}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${API_PORT}${API_PREFIX}`;
    }
  }

  const manifest2 = (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2;
  const debuggerHost = manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host) {
      return `http://${host}:${API_PORT}${API_PREFIX}`;
    }
  }

  return `http://${FALLBACK_LAN_HOST}:${API_PORT}${API_PREFIX}`;
}

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = (
  configuredApiBaseUrl && configuredApiBaseUrl !== PLACEHOLDER_API_BASE_URL
    ? configuredApiBaseUrl
    : getDefaultApiBaseUrl()
).replace(/\/$/, '');

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function handleUnauthorizedResponse(status: number) {
  if (status !== 401) {
    return;
  }
  authToken = null;
  unauthorizedHandler?.();
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
    handleUnauthorizedResponse(response.status);
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
    handleUnauthorizedResponse(response.status);
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

/** Fetch a binary body (e.g. PDF export) as base64 for Expo FileSystem. */
export async function apiRequestBase64(path: string, options: RequestInit = {}): Promise<string> {
  const headers: Record<string, string> = {
    Accept: 'application/pdf, application/octet-stream, */*',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    handleUnauthorizedResponse(response.status);
    const text = await response.text();
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

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
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
