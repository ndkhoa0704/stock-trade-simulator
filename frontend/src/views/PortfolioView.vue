<template>
  <div class="container mt-4">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border"></div></div>
    <div v-else>
      <div class="d-flex align-items-center mb-4 gap-3">
        <router-link to="/" class="btn btn-outline-secondary btn-sm">← Back</router-link>
        <h2 class="mb-0">{{ portfolioStore.currentPortfolio?.name }}</h2>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <HoldingSummary :holdings="portfolioStore.holdings" :portfolio-id="portfolioId" />
        </div>
      </div>

      <div class="mb-4">
        <TransactionForm :portfolio-id="portfolioId" @created="onTransactionCreated" />
      </div>

      <div class="card">
        <div class="card-body">
          <h5 class="card-title mb-3">Transaction History</h5>
          <TransactionTable ref="txTableRef" :portfolio-id="portfolioId" @deleted="refreshHoldings" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePortfolioStore } from '../stores/portfolio';
import HoldingSummary from '../components/HoldingSummary.vue';
import TransactionForm from '../components/TransactionForm.vue';
import TransactionTable from '../components/TransactionTable.vue';

const route = useRoute();
const portfolioStore = usePortfolioStore();
const portfolioId = route.params.id;
const loading = ref(true);

onMounted(async () => {
  await Promise.all([
    portfolioStore.fetchPortfolio(portfolioId),
    portfolioStore.fetchHoldings(portfolioId),
  ]);
  loading.value = false;
});

async function onTransactionCreated() {
  await portfolioStore.fetchHoldings(portfolioId);
}

async function refreshHoldings() {
  await portfolioStore.fetchHoldings(portfolioId);
}
</script>
