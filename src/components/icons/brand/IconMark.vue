<script setup lang="ts">
defineProps<{ size?: number }>()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size ?? 36"
    :height="size ?? 36"
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
  >
    <line x1="9.5" y1="12.06" x2="54.5" y2="12.06" stroke="currentColor" stroke-width="6.25" stroke-linecap="square" />
    <line x1="15.75" y1="12.06" x2="15.75" y2="22.69" stroke="currentColor" stroke-width="6.25" stroke-linecap="butt" />
    <line x1="48.25" y1="12.06" x2="48.25" y2="22.69" stroke="currentColor" stroke-width="6.25" stroke-linecap="butt" />
    <line x1="15.75" y1="22.69" x2="29.5" y2="29.56" stroke="currentColor" stroke-width="6.25" stroke-linecap="butt" />
    <line x1="48.25" y1="22.69" x2="34.5" y2="29.56" stroke="currentColor" stroke-width="6.25" stroke-linecap="butt" />
    <rect x="26.38" y="16.44" width="11.25" height="12.5" fill="currentColor" />
    <line x1="32" y1="26.94" x2="32" y2="47.06" stroke="currentColor" stroke-width="6.25" stroke-linecap="butt" />
    <line x1="32" y1="47.06" x2="27" y2="54.56" stroke="currentColor" stroke-width="6.25" stroke-linecap="butt" />
    <line x1="32" y1="47.06" x2="37" y2="54.56" stroke="currentColor" stroke-width="6.25" stroke-linecap="butt" />
  </svg>
</template>
