import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, setAuthToken, setUnauthorizedHandler, toJsonBody } from './apiClient';

const SESSION_KEY = 'inka.auth.session';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  farmId: string | null;
  farmName?: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type MyFarm = {
  farmId: string;
  name: string;
  location: string;
  district: string;
  sector: string;
  role: string;
  isActive: boolean;
};

export type ManagedUser = AuthUser & {
  isActive: boolean;
  createdAt?: string;
};

let currentSession: AuthSession | null = null;
let hydratePromise: Promise<AuthSession | null> | null = null;
let clearingUnauthorized = false;

setUnauthorizedHandler(() => {
  if (clearingUnauthorized || !currentSession) {
    return;
  }
  clearingUnauthorized = true;
  void persistSession(null).finally(() => {
    clearingUnauthorized = false;
  });
});

async function persistSession(session: AuthSession | null) {
  currentSession = session;
  setAuthToken(session?.token ?? null);
  if (session) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}

export async function hydrateSession(): Promise<AuthSession | null> {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!raw) {
          currentSession = null;
          setAuthToken(null);
          return null;
        }
        const session = JSON.parse(raw) as AuthSession;
        if (!session?.token || !session?.user) {
          await persistSession(null);
          return null;
        }
        currentSession = session;
        setAuthToken(session.token);
        try {
          await apiRequest('/users/me');
          return session;
        } catch {
          await persistSession(null);
          return null;
        }
      } catch {
        currentSession = null;
        setAuthToken(null);
        return null;
      }
    })();
  }
  return hydratePromise;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/login', toJsonBody({ email, password }));
  await persistSession(session);
  return session;
}

export async function register(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  farmName: string;
  district: string;
  sector: string;
}): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/register', toJsonBody(input));
  await persistSession(session);
  return session;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest<{ ok: boolean }>('/auth/change-password', toJsonBody({ currentPassword, newPassword }));
}

export async function requestPasswordReset(email: string): Promise<{
  ok: boolean;
  message: string;
  devResetToken?: string;
}> {
  return apiRequest('/auth/forgot-password', toJsonBody({ email }));
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest<{ ok: boolean }>('/auth/reset-password', toJsonBody({ token, newPassword }));
}

export function getCurrentSession(): AuthSession | null {
  return currentSession;
}

export async function logout() {
  await persistSession(null);
}

export async function listMyFarms(): Promise<MyFarm[]> {
  return apiRequest<MyFarm[]>('/farms/mine');
}

export async function switchFarm(farmId: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/switch-farm', toJsonBody({ farmId }));
  await persistSession(session);
  return session;
}

export async function listUsers(farmId?: string): Promise<ManagedUser[]> {
  const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
  return apiRequest<ManagedUser[]>(`/users${query}`);
}

export async function createUser(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  farmId?: string;
}): Promise<ManagedUser> {
  return apiRequest<ManagedUser>('/users', toJsonBody(input));
}

export async function updateUser(
  id: string,
  input: {
    fullName?: string;
    phone?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
  },
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
