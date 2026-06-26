import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginPayload, RegisterPayload } from '../types/auth.types.js';
import { authApi } from '../api/auth.api.js';
import { userApi } from '../api/user.api.js';
import { tokenStorage } from '../utils/tokenStorage.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  const login = async (payload: LoginPayload) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await authApi.login(payload);
      if (response.success && response.data) {
        user.value = response.data.user;
        tokenStorage.setAccessToken(response.data.accessToken);
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (payload: RegisterPayload) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await authApi.register(payload);
      if (response.success && response.data) {
        user.value = response.data.user;
        tokenStorage.setAccessToken(response.data.accessToken);
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Failed to call logout endpoint', err);
    } finally {
      user.value = null;
      tokenStorage.clearTokens();
      loading.value = false;
    }
  };

  const initAuth = async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) return;
    loading.value = true;
    try {
      const response = await userApi.getMe();
      if (response.success && response.data) {
        user.value = response.data;
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
      tokenStorage.clearTokens();
    } finally {
      loading.value = false;
    }
  };

  const googleLogin = async (credentialToken: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await authApi.googleLogin(credentialToken);
      if (response.success && response.data) {
        user.value = response.data.user;
        tokenStorage.setAccessToken(response.data.accessToken);
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Google login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    googleLogin,
    register,
    logout,
    initAuth,
  };
});
export default useAuthStore;
