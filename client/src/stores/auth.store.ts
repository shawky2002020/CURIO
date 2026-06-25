import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { User, LoginPayload, RegisterPayload } from '../types/auth.types.js';
import { authApi } from '../api/auth.api.js';
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

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
  };
});
export default useAuthStore;
