<template>
  <div>
    <AppNavbar v-if="authStore.isLoggedIn" />
    <router-view />
  </div>
</template>

<script setup>
import AppNavbar from './components/AppNavbar.vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();
</script>