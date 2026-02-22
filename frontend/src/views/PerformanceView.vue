<template>
  <div class="container mt-4">
    <div class="d-flex align-items-center mb-4 gap-3">
      <router-link :to="`/portfolio/${portfolioId}`" class="btn btn-outline-secondary btn-sm">← Back</router-link>
      <h2 class="mb-0">Performance</h2>
      <span v-if="portfolioName" class="text-muted">— {{ portfolioName }}</span>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Cumulative Return (TWR)</h5>
      </div>
      <div class="card-body">
        <PerformanceChart :portfolio-id="portfolioId" />
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between">
        <h5 class="mb-0">Risk Statistics</h5>
        <span class="text-muted small">vs VNINDEX</span>
      </div>
      <div class="card-body">
        <StatisticsPanel :portfolio-id="portfolioId" :window-days="statisticsWindow" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePortfolioStore } from '../stores/portfolio';
import api from '../services/api';
import PerformanceChart from '../components/PerformanceChart.vue';
import StatisticsPanel from '../components/StatisticsPanel.vue';

const route = useRoute();
const portfolioStore = usePortfolioStore();
const portfolioId = route.params.id;
const portfolioName = ref('');
const statisticsWindow = ref(90);

onMounted(async () => {
  const [portfolioRes, feeRes] = await Promise.all([
    portfolioStore.fetchPortfolio(portfolioId).catch(() => null),
    api.get('/settings/fees').catch(() => null),
  ]);

  portfolioName.value = portfolioStore.currentPortfolio?.name || '';

  if (feeRes?.data?.feeConfig?.statisticsWindow) {
    statisticsWindow.value = feeRes.data.feeConfig.statisticsWindow;
  }
});
</script>
