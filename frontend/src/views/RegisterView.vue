<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h4 class="card-title mb-4 text-center">Register</h4>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <form @submit.prevent="handleRegister">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input v-model="form.username" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input v-model="form.password" type="password" class="form-control" required minlength="6" />
              </div>
              <button type="submit" class="btn btn-success w-100" :disabled="loading">
                {{ loading ? 'Registering...' : 'Register' }}
              </button>
            </form>
            <p class="text-center mt-3 mb-0">
              Have an account? <router-link to="/login">Login</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const form = ref({ username: '', email: '', password: '' });
const error = ref('');
const loading = ref(false);

async function handleRegister() {
  error.value = '';
  loading.value = true;
  try {
    await authStore.register(form.value);
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.error || 'Registration failed';
  } finally {
    loading.value = false;
  }
}
</script>
