<template>
  <div>
    <div v-if="success" class="alert alert-success py-2">Settings saved.</div>
    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
    <form @submit.prevent="handleSave">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Buy Fee Rate (%)</label>
          <input v-model.number="form.buyFeeRate" type="number" class="form-control" step="0.001" min="0" max="100" required />
        </div>
        <div class="col-md-4">
          <label class="form-label">Sell Fee Rate (%)</label>
          <input v-model.number="form.sellFeeRate" type="number" class="form-control" step="0.001" min="0" max="100" required />
        </div>
        <div class="col-md-4">
          <label class="form-label">Tax Rate (%)</label>
          <input v-model.number="form.taxRate" type="number" class="form-control" step="0.001" min="0" max="100" required />
        </div>
      </div>
      <button type="submit" class="btn btn-primary mt-3" :disabled="loading">
        {{ loading ? 'Saving...' : 'Save Settings' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const form = ref({ buyFeeRate: 0.15, sellFeeRate: 0.15, taxRate: 0.1 });
const loading = ref(false);
const success = ref(false);
const error = ref('');

onMounted(async () => {
  const res = await api.get('/settings/fees');
  const c = res.data.feeConfig;
  form.value = {
    buyFeeRate: +(c.buyFeeRate * 100).toFixed(4),
    sellFeeRate: +(c.sellFeeRate * 100).toFixed(4),
    taxRate: +(c.taxRate * 100).toFixed(4),
  };
});

async function handleSave() {
  success.value = false;
  error.value = '';
  loading.value = true;
  try {
    await api.put('/settings/fees', {
      buyFeeRate: form.value.buyFeeRate / 100,
      sellFeeRate: form.value.sellFeeRate / 100,
      taxRate: form.value.taxRate / 100,
    });
    success.value = true;
    setTimeout(() => (success.value = false), 3000);
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save';
  } finally {
    loading.value = false;
  }
}
</script>
