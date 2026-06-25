import { defineStore } from 'pinia';
import { ref } from 'vue';
import { User } from '../types/auth.types.js';
import { UpdateProfilePayload } from '../types/user.types.js';
import { userApi } from '../api/user.api.js';

export const useUserStore = defineStore('user', () => {
  const profile = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProfile = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await userApi.getMe();
      if (response.success && response.data) {
        profile.value = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch profile';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await userApi.updateMe(payload);
      if (response.success && response.data) {
        profile.value = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update profile';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
});
export default useUserStore;
