<template>
  <div>
    <h5 class="mb-3">Holdings</h5>
    <div v-if="loading" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>
    <div v-else-if="holdings.length === 0" class="text-muted">No holdings yet.</div>
    <div v-else class="table-responsive">
      <table class="table table-sm table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>Code</th>
            <th class="text-end">Shares</th>
            <th class="text-end">Avg Cost</th>
            <th class="text-end">Current Price</th>
            <th class="text-end">Market Value</th>
            <th class="text-end">P&L</th>
            <th class="text-end">P&L %</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in holdingsWithPrice" :key="h.stockCode">
            <td><strong>{{ h.stockCode }}</strong></td>
            <td class="text-end">{{ h.shares.toLocaleString() }}</td>
            <td class="text-end">{{ fmt(h.avgCostPerShare) }}</td>
            <td class="text-end">{{ h.currentPrice != null ? fmt(h.currentPrice) : 'N/A' }}</td>
            <td class="text-end">{{ h.marketValue != null ? fmt(h.marketValue) : 'N/A' }}</td>
            <td class="text-end" :class="pnlClass(h.pnl)">
              {{ h.pnl != null ? fmt(h.pnl) : 'N/A' }}
            </td>
            <td class="text-end" :class="pnlClass(h.pnlPct)">
              {{ h.pnlPct != null ? h.pnlPct.toFixed(2) + '%' : 'N/A' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../services/api';

const props = defineProps({ holdings: Array, portfolioId: String });
const loading = ref(false);
const prices = ref({});

async function loadPrices() {
  loading.value = true;
  const results = {};
  await Promise.allSettled(
    props.holdings.map(async (h) => {
      try {
        const res = await api.get(`/stocks/${h.stockCode}/price`);
        results[h.stockCode] = res.data.price;
      } catch {
        results[h.stockCode] = null;
      }
    })
  );
  prices.value = results;
  loading.value = false;
}

onMounted(loadPrices);
watch(() => props.holdings, loadPrices, { deep: true });

const holdingsWithPrice = computed(() =>
  props.holdings.map((h) => {
    const currentPrice = prices.value[h.stockCode];
    const marketValue = currentPrice != null ? currentPrice * h.shares : null;
    const pnl = marketValue != null ? marketValue - h.totalCostBasis : null;
    const pnlPct = pnl != null && h.totalCostBasis > 0 ? (pnl / h.totalCostBasis) * 100 : null;
    return { ...h, currentPrice, marketValue, pnl, pnlPct };
  })
);

function fmt(v) {
  return v?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pnlClass(v) {
  if (v == null) return '';
  return v >= 0 ? 'text-success' : 'text-danger';
}
</script>
