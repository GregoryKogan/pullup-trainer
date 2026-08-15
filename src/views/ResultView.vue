<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const success = computed(() => route.query.result === 'success')
</script>

<template>
  <div class="panel">
    <p class="kicker">{{ success ? t('workout.resultSuccess') : t('workout.resultFail') }}</p>
    <button type="button" class="btn accent" @click="router.push('/')">{{ t('nav.home') }}</button>
  </div>
</template>
