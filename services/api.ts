import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

class ApiClient {
  private client: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupNetworkListener();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await SecureStore.deleteItemAsync('auth_token');
          // Redirect to login will be handled by auth store
        }
        return Promise.reject(error);
      }
    );
  }

  private setupNetworkListener() {
    // In production, use @react-native-community/netinfo
    // For now, assume online
    this.isOnline = true;
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  public isConnected(): boolean {
    return this.isOnline;
  }

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
  }
}

export const apiClient = new ApiClient();
