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
    <path d="M2 8h13.5" />
    <path d="M18.5 8h-3" />
    <circle cx="18.5" cy="4.7" r="1.7" />
    <path d="M18.5 8.2v7.3" />
  </svg>
</template>
