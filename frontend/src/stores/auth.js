import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isLoggedIn = ref(false);

  async function tryRestoreSession() {
    try {
      const res = await api.get('/auth/me');
      user.value = res.data.user;
      isLoggedIn.value = true;
    } catch {
      user.value = null;
      isLoggedIn.value = false;
    }
  }

  async function login({ username, password }) {
    const res = await api.post('/auth/login', { username, password });
    user.value = res.data.user;
    isLoggedIn.value = true;
  }

  async function register({ username, email, password }) {
    const res = await api.post('/auth/register', { username, email, password });
    user.value = res.data.user;
    isLoggedIn.value = true;
  }

  async function logout() {
    await api.post('/auth/logout');
    user.value = null;
    isLoggedIn.value = false;
  }

  return { user, isLoggedIn, tryRestoreSession, login, register, logout };
});
