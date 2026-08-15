<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  visible: boolean
  message: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-overlay"
      role="alertdialog"
      aria-modal="true"
      @click.self="emit('cancel')"
    >
      <div class="modal-card panel confirm-panel">
        <p class="confirm-msg">{{ message }}</p>
        <div class="btnrow">
          <button type="button" class="btn accent" @click="emit('confirm')">{{ t('common.confirm') }}</button>
          <button type="button" class="btn ghost" @click="emit('cancel')">{{ t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm-panel {
  max-width: 360px;
  width: 100%;
}
.confirm-msg {
  font: 700 0.85rem/1.4 ui-monospace, 'SF Mono', Menlo, monospace;
  margin: 0 0 16px;
}
</style>
