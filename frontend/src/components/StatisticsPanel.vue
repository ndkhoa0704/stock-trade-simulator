<template>
  <div>
    <div v-if="loading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm"></div>
    </div>
    <div v-else-if="error" class="alert alert-danger py-2">{{ error }}</div>
    <div v-else>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-body text-center">
              <div class="text-muted small mb-1">Beta (vs VNINDEX)</div>
              <div class="fs-4 fw-bold" :class="betaClass">
                {{ stats.beta !== null ? stats.beta.toFixed(3) : '—' }}
              </div>
              <div class="text-muted small mt-1">
                <span v-if="stats.beta !== null">
                  {{ stats.beta > 1 ? 'More volatile than market' : stats.beta < 1 ? 'Less volatile than market' : 'Matches market' }}
                </span>
                <span v-else>Insufficient data</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-body text-center">
              <div class="text-muted small mb-1">Std Deviation (daily)</div>
              <div class="fs-4 fw-bold text-info">
                {{ stats.stdDev !== null ? (stats.stdDev * 100).toFixed(3) + '%' : '—' }}
              </div>
              <div class="text-muted small mt-1">Daily return dispersion</div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-body text-center">
              <div class="text-muted small mb-1">Variance (daily)</div>
              <div class="fs-4 fw-bold text-secondary">
                {{ stats.variance !== null ? (stats.variance * 10000).toFixed(4) : '—' }}
              </div>
              <div class="text-muted small mt-1">×10⁻⁴ · {{ stats.dataPoints || 0 }} data points</div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-muted small mt-2 text-end">
        Window: {{ stats.window || windowDays }} days
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const props = defineProps({
  portfolioId: { type: String, required: true },
  windowDays: { type: Number, default: 90 },
});

const stats = ref({ beta: null, variance: null, stdDev: null, dataPoints: 0 });
const loading = ref(false);
const error = ref('');

const betaClass = computed(() => {
  if (stats.value.beta === null) return 'text-secondary';
  if (stats.value.beta > 1.2) return 'text-danger';
  if (stats.value.beta < 0.8) return 'text-success';
  return 'text-warning';
});

async function fetchStatistics() {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.get(`/portfolios/${props.portfolioId}/statistics`, {
      params: { window: props.windowDays },
    });
    stats.value = res.data.statistics || {};
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load statistics';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStatistics);
</script>
