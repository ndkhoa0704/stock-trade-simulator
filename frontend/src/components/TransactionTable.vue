<template>
  <div>
    <div class="d-flex gap-2 mb-3">
      <input v-model="filterCode" type="text" class="form-control form-control-sm w-auto text-uppercase" placeholder="Filter by code" @input="applyFilter" />
      <select v-model="filterType" class="form-select form-select-sm w-auto" @change="applyFilter">
        <option value="">All types</option>
        <option value="BUY">BUY</option>
        <option value="SELL">SELL</option>
      </select>
    </div>
    <div v-if="loading" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>
    <div v-else-if="portfolioStore.transactions.length === 0" class="text-muted text-center py-3">No transactions found.</div>
    <div v-else class="table-responsive">
      <table class="table table-sm table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>Date</th>
            <th>Code</th>
            <th>Type</th>
            <th class="text-end">Price</th>
            <th class="text-end">Volume</th>
            <th class="text-end">Fee Rate</th>
            <th class="text-end">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in portfolioStore.transactions" :key="tx._id">
            <td class="text-nowrap">{{ formatDate(tx.createdAt) }}</td>
            <td><strong>{{ tx.stockCode }}</strong></td>
            <td>
              <span :class="tx.type === 'BUY' ? 'badge bg-success' : 'badge bg-danger'">{{ tx.type }}</span>
            </td>
            <td class="text-end">{{ fmt(tx.price) }}</td>
            <td class="text-end">{{ tx.volume.toLocaleString() }}</td>
            <td class="text-end">{{ (tx.feeRate * 100).toFixed(3) }}%</td>
            <td class="text-end">{{ fmt(tx.totalCost) }}</td>
            <td class="text-end">
              <button class="btn btn-outline-danger btn-sm py-0" @click="handleDelete(tx._id)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="d-flex justify-content-between align-items-center mt-2">
      <small class="text-muted">Total: {{ total }}</small>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" :disabled="page <= 1" @click="changePage(page - 1)">‹</button>
        <button class="btn btn-outline-secondary" disabled>{{ page }}</button>
        <button class="btn btn-outline-secondary" :disabled="page * limit >= total" @click="changePage(page + 1)">›</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePortfolioStore } from '../stores/portfolio';

const props = defineProps({ portfolioId: String });
const emit = defineEmits(['deleted']);

const portfolioStore = usePortfolioStore();

const loading = ref(false);
const total = ref(0);
const page = ref(1);
const limit = 20;
const filterCode = ref('');
const filterType = ref('');

async function load() {
  loading.value = true;
  const params = { page: page.value, limit };
  if (filterCode.value) params.stockCode = filterCode.value.toUpperCase();
  if (filterType.value) params.type = filterType.value;
  const data = await portfolioStore.fetchTransactions(props.portfolioId, params);
  total.value = data.total;
  loading.value = false;
}

onMounted(load);

function applyFilter() {
  page.value = 1;
  load();
}

function changePage(p) {
  page.value = p;
  load();
}

async function handleDelete(id) {
  if (!confirm('Delete this transaction?')) return;
  await portfolioStore.deleteTransaction(props.portfolioId, id);
  total.value -= 1;
  emit('deleted');
}

function formatDate(d) {
  return new Date(d).toLocaleString();
}

function fmt(v) {
  return v?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>
