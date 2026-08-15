<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
</script>

<template>
  <svg :width="size ?? 20" :height="size ?? 20" aria-hidden="true">
    <use :href="`#icon-${name}`" />
  </svg>
</template>
