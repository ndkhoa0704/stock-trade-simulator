<template>
  <div>
    <div class="d-flex gap-2 mb-3">
      <button
        v-for="opt in periodOptions"
        :key="opt.value"
        class="btn btn-sm"
        :class="selectedDays === opt.value ? 'btn-primary' : 'btn-outline-secondary'"
        @click="selectPeriod(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm"></div>
    </div>
    <div v-else-if="error" class="alert alert-danger py-2">{{ error }}</div>
    <div v-else-if="!chartData.labels.length" class="text-muted text-center py-4">
      No performance data available yet.
    </div>
    <Line v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps({
  portfolioId: { type: String, required: true },
});

const periodOptions = [
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: '180D', value: 180 },
  { label: '1Y', value: 365 },
  { label: 'All', value: 3650 },
];

const selectedDays = ref(90);
const history = ref([]);
const loading = ref(false);
const error = ref('');

async function fetchHistory() {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.get(`/portfolios/${props.portfolioId}/performance`, {
      params: { days: selectedDays.value },
    });
    history.value = res.data.history || [];
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load performance data';
  } finally {
    loading.value = false;
  }
}

function selectPeriod(days) {
  selectedDays.value = days;
  fetchHistory();
}

const chartData = computed(() => {
  const labels = history.value.map(s =>
    new Date(s.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
  );
  const values = history.value.map(s => +(s.cumulativeTWR * 100).toFixed(2));

  return {
    labels,
    datasets: [
      {
        label: 'Cumulative TWR (%)',
        data: values,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.08)',
        borderWidth: 2,
        pointRadius: values.length > 60 ? 0 : 3,
        fill: true,
        tension: 0.3,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: ctx => ` ${ctx.parsed.y.toFixed(2)}%`,
      },
    },
  },
  scales: {
    y: {
      ticks: {
        callback: v => `${v}%`,
      },
    },
  },
};

onMounted(fetchHistory);
</script>
