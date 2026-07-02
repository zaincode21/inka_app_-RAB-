import { apiRequest, toJsonBody } from './apiClient';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

let currentSession: AuthSession | null = null;

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/login', toJsonBody({ email, password }));
  currentSession = session;
  return session;
}

export async function register(input: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/register', toJsonBody(input));
  currentSession = session;
  return session;
}

export function getCurrentSession(): AuthSession | null {
  return currentSession;
}

export function logout() {
  currentSession = null;
}
