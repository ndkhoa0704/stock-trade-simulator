<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">New Transaction</h5>
      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
      <form @submit.prevent="handleSubmit" class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Stock Code</label>
          <input v-model="form.stockCode" type="text" class="form-control text-uppercase" placeholder="e.g. AAPL" required />
        </div>
        <div class="col-md-2">
          <label class="form-label">Type</label>
          <select v-model="form.type" class="form-select" required>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Price</label>
          <input v-model.number="form.price" type="number" class="form-control" min="0" step="0.01" required />
        </div>
        <div class="col-md-2">
          <label class="form-label">Volume</label>
          <input v-model.number="form.volume" type="number" class="form-control" min="1" step="1" required />
        </div>
        <div class="col-md-3">
          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            {{ loading ? 'Saving...' : 'Add Transaction' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['created']);
const props = defineProps({ portfolioId: String });

const form = ref({ stockCode: '', type: 'BUY', price: '', volume: '' });
const error = ref('');
const loading = ref(false);

import { usePortfolioStore } from '../stores/portfolio';
const portfolioStore = usePortfolioStore();

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const tx = await portfolioStore.createTransaction(props.portfolioId, {
      stockCode: form.value.stockCode.toUpperCase(),
      type: form.value.type,
      price: form.value.price,
      volume: form.value.volume,
    });
    form.value = { stockCode: '', type: 'BUY', price: '', volume: '' };
    emit('created', tx);
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to add transaction';
  } finally {
    loading.value = false;
  }
}
</script>
