import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);

  const add = (message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration };
    toasts.value.push(newToast);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  };

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return {
    toasts,
    success: (msg: string, dur?: number) => add(msg, 'success', dur),
    error: (msg: string, dur?: number) => add(msg, 'error', dur),
    info: (msg: string, dur?: number) => add(msg, 'info', dur),
    warning: (msg: string, dur?: number) => add(msg, 'warning', dur),
    remove,
  };
});

export default useToastStore;
