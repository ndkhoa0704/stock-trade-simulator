<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>My Portfolios</h2>
      <button class="btn btn-success" @click="showCreate = true">+ New Portfolio</button>
    </div>

    <div v-if="showCreate" class="card mb-4">
      <div class="card-body">
        <h6 class="card-title">Create Portfolio</h6>
        <div class="input-group">
          <input v-model="newName" type="text" class="form-control" placeholder="Portfolio name" @keyup.enter="handleCreate" />
          <button class="btn btn-primary" @click="handleCreate" :disabled="!newName.trim()">Create</button>
          <button class="btn btn-outline-secondary" @click="showCreate = false; newName = ''">Cancel</button>
        </div>
        <div v-if="createError" class="text-danger mt-1 small">{{ createError }}</div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border"></div>
    </div>
    <div v-else-if="portfolioStore.portfolios.length === 0" class="text-center text-muted py-5">
      No portfolios yet. Create one to get started.
    </div>
    <div v-else class="row g-3">
      <div v-for="p in portfolioStore.portfolios" :key="p._id" class="col-md-4">
        <PortfolioCard :portfolio="p" @delete="handleDelete" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PortfolioCard from '../components/PortfolioCard.vue';
import { usePortfolioStore } from '../stores/portfolio';

const portfolioStore = usePortfolioStore();
const loading = ref(true);
const showCreate = ref(false);
const newName = ref('');
const createError = ref('');

onMounted(async () => {
  await portfolioStore.fetchPortfolios();
  loading.value = false;
});

async function handleCreate() {
  if (!newName.value.trim()) return;
  createError.value = '';
  try {
    await portfolioStore.createPortfolio(newName.value.trim());
    newName.value = '';
    showCreate.value = false;
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create';
  }
}

async function handleDelete(id) {
  if (!confirm('Delete this portfolio and all its transactions?')) return;
  await portfolioStore.deletePortfolio(id);
}
</script>
