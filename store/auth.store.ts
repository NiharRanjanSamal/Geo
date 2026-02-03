import { create } from 'zustand';
import { login, logout, validateToken, getStoredToken, Employee } from '@/services/auth.service';
import { getStoredProfileImageUri, saveProfileImageUri, clearProfileImageUri } from '@/services/profile.service';

interface AuthState {
  user: Employee | null;
  token: string | null;
  profileImageUri: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setProfileImageUri: (uri: string | null) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  profileImageUri: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setProfileImageUri: async (uri: string | null) => {
    await saveProfileImageUri(uri);
    set({ profileImageUri: uri });
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await login({ email, password });
      const storedAvatar = await getStoredProfileImageUri();
      set({
        user: response.user,
        token: response.token,
        profileImageUri: storedAvatar,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  logout: async () => {
    await logout();
    await clearProfileImageUri();
    set({
      user: null,
      token: null,
      profileImageUri: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getStoredToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await validateToken();
      const storedAvatar = await getStoredProfileImageUri();
      if (user) {
        set({
          user,
          token,
          profileImageUri: storedAvatar,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
