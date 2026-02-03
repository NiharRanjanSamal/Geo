import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const {
    user,
    profileImageUri,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    setProfileImageUri,
    clearError,
  } = useAuthStore();

  return {
    user,
    profileImageUri,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    setProfileImageUri,
    clearError,
  };
}
