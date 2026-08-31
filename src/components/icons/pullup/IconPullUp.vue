<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size ?? 24"
    :height="size ?? 24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8.6 6v2.6M15.4 6v2.6" />
    <circle cx="12" cy="10.6" r="2" />
    <path d="M12 12.6v8" />
  </svg>
</template>
