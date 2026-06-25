<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../../stores/user.store.js';
import BaseInput from '../../../components/ui/BaseInput.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import BaseAlert from '../../../components/ui/BaseAlert.vue';

const userStore = useUserStore();
const router = useRouter();

const fullName = ref('');
const phone = ref('');

onMounted(async () => {
  if (!userStore.profile) {
    try {
      await userStore.fetchProfile();
    } catch (err) {
      console.error(err);
    }
  }

  if (userStore.profile) {
    fullName.value = userStore.profile.fullName;
    phone.value = userStore.profile.phone || '';
  }
});

const handleSave = async () => {
  try {
    await userStore.updateProfile({
      fullName: fullName.value,
      phone: phone.value,
    });
    router.push({ name: 'profile' });
  } catch (err) {
    // Handled in store
  }
};
</script>

<template>
  <div class="edit-profile-page">
    <h1 class="page-title">Edit Profile</h1>

    <div class="form-card">
      <BaseAlert v-if="userStore.error" type="error" :message="userStore.error" />

      <form @submit.prevent="handleSave" class="form">
        <BaseInput
          id="name"
          v-model="fullName"
          type="text"
          label="Full Name"
          required
        />

        <BaseInput
          id="phone"
          v-model="phone"
          type="tel"
          label="Phone Number"
          placeholder="+1234567890"
        />

        <div class="actions">
          <router-link to="/profile" class="btn-cancel">Cancel</router-link>
          <BaseButton type="submit" :loading="userStore.loading" class="btn-save">
            Save Changes
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.edit-profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #f3f4f6;
  margin-bottom: 2rem;
}

.form-card {
  background-color: #111827;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.btn-cancel {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  color: #9ca3af;
  text-decoration: none;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  box-sizing: border-box;
}

.btn-cancel:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #f3f4f6;
}

.btn-save {
  width: 100%;
}
</style>
