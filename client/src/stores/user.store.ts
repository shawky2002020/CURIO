import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '../types/auth.types.js';
import type { UpdateProfilePayload } from '../types/user.types.js';
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

  const uploadAvatar = async (file: File) => {
    loading.value = true;
    error.value = null;
    try {
      // Simulate file upload API call
      console.log(`[Store] Uploading avatar: ${file.name} (${file.size} bytes)`);
      if (profile.value) {
        // Mock update local profile with a temporary object URL for visual feedback
        profile.value.avatarUrl = URL.createObjectURL(file);
      }
    } catch (err: any) {
      error.value = 'Failed to upload avatar';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await userApi.uploadLogo(file);
      if (response.success && response.data) {
        return response.data.logoUrl;
      }
      throw new Error(response.message || 'Failed to upload logo');
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to upload logo';
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
    uploadAvatar,
    uploadLogo,
  };
});
export default useUserStore;

