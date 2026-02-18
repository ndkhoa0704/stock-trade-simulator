import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const usePortfolioStore = defineStore('portfolio', () => {
  const portfolios = ref([]);
  const currentPortfolio = ref(null);
  const holdings = ref([]);
  const transactions = ref([]);

  async function fetchPortfolios() {
    const res = await api.get('/portfolios');
    portfolios.value = res.data.portfolios;
  }

  async function createPortfolio(name) {
    const res = await api.post('/portfolios', { name });
    portfolios.value.unshift(res.data.portfolio);
    return res.data.portfolio;
  }

  async function deletePortfolio(id) {
    await api.delete(`/portfolios/${id}`);
    portfolios.value = portfolios.value.filter((p) => p._id !== id);
  }

  async function fetchPortfolio(id) {
    const res = await api.get(`/portfolios/${id}`);
    currentPortfolio.value = res.data.portfolio;
  }

  async function fetchHoldings(portfolioId) {
    const res = await api.get(`/portfolios/${portfolioId}/holdings`);
    holdings.value = res.data.holdings;
  }

  async function fetchTransactions(portfolioId, params = {}) {
    const res = await api.get(`/portfolios/${portfolioId}/transactions`, { params });
    transactions.value = res.data.transactions;
    return res.data;
  }

  async function createTransaction(portfolioId, data) {
    const res = await api.post(`/portfolios/${portfolioId}/transactions`, data);
    return res.data.transaction;
  }

  async function deleteTransaction(portfolioId, id) {
    await api.delete(`/portfolios/${portfolioId}/transactions/${id}`);
    transactions.value = transactions.value.filter((t) => t._id !== id);
  }

  return {
    portfolios,
    currentPortfolio,
    holdings,
    transactions,
    fetchPortfolios,
    createPortfolio,
    deletePortfolio,
    fetchPortfolio,
    fetchHoldings,
    fetchTransactions,
    createTransaction,
    deleteTransaction,
  };
});
