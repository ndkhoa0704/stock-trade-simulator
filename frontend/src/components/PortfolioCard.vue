<template>
  <div class="card h-100">
    <div class="card-body d-flex flex-column">
      <h5 class="card-title">{{ portfolio.name }}</h5>
      <p class="text-muted small">Created {{ formatDate(portfolio.createdAt) }}</p>
      <div class="mt-auto d-flex gap-2">
        <router-link :to="`/portfolio/${portfolio._id}`" class="btn btn-primary btn-sm flex-grow-1">
          View
        </router-link>
        <button class="btn btn-outline-danger btn-sm" @click="$emit('delete', portfolio._id)">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ portfolio: Object });
defineEmits(['delete']);

function formatDate(d) {
  return new Date(d).toLocaleDateString();
}
</script>
