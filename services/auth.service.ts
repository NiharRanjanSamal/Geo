import { apiClient } from './api';
import * as SecureStore from 'expo-secure-store';
import { generateNonce, getDeviceId } from '@/utils/security.utils';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeCode: string;
  companyCode: string;
  displayName?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department?: string;
  position?: string;
}

export interface LoginResponse {
  token: string;
  user: Employee;
}

export interface SignupResponse {
  message: string;
  emailVerificationRequired: boolean;
}

/**
 * Login against the backend API. Use the same email/password you created in the web app (e.g. Ram Kishan).
 * The JWT includes employeeId so attendance can be marked for that employee.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.getClient().post<LoginResponse>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
    ...(!__DEV__ && { nonce: generateNonce(), deviceId: await getDeviceId() }),
  });

  await SecureStore.setItemAsync('auth_token', response.data.token);
  await SecureStore.setItemAsync('device_id', await getDeviceId());

  return response.data;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('device_id');
}

export async function getStoredToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('auth_token');
}

export async function validateToken(): Promise<Employee | null> {
  const token = await getStoredToken();
  if (!token) return null;

  try {
    const response = await apiClient.getClient().get<Employee>('/auth/me');
    return response.data;
  } catch (error) {
    await logout();
    return null;
  }
}

/**
 * Register a new employee account. Account will be pending approval by admin.
 */
export async function signup(credentials: SignupCredentials): Promise<SignupResponse> {
  const response = await apiClient.getClient().post<SignupResponse>('/auth/register', {
    email: credentials.email.trim(),
    password: credentials.password,
    firstName: credentials.firstName.trim(),
    lastName: credentials.lastName.trim(),
    phone: credentials.phone.trim(),
    employeeCode: credentials.employeeCode.trim(),
    companyCode: credentials.companyCode.trim().toUpperCase(),
    displayName: credentials.displayName?.trim(),
  });

  return response.data;
}
