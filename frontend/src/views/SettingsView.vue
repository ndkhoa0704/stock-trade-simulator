<template>
  <div class="container mt-4">
    <h2 class="mb-4">Fee Settings</h2>
    <div class="card">
      <div class="card-body">
        <p class="text-muted mb-3">Configure fee and tax rates. These will be applied to all future transactions.</p>
        <FeeConfigForm />
      </div>
    </div>
  </div>
</template>

<script setup>
import FeeConfigForm from '../components/FeeConfigForm.vue';
</script>
