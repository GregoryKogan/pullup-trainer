<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useModalA11y } from '@/composables/use-modal-a11y'

const props = defineProps<{
  visible: boolean
  message: string
  title?: string
  destructive?: boolean
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const { t } = useI18n()

const dialogTitle = computed(() => props.title ?? t('common.confirm'))

const { panelRef } = useModalA11y(toRef(props, 'visible'), {
  onEscape: () => emit('cancel'),
  initialFocusSelector: '[data-modal-primary]',
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('cancel')">
      <div
        ref="panelRef"
        class="modal-card panel confirm-panel"
        role="alertdialog"
        aria-modal="true"
        tabindex="-1"
        :aria-labelledby="'confirm-title'"
        :aria-describedby="'confirm-desc'"
      >
        <p id="confirm-title" class="confirm-title">{{ dialogTitle }}</p>
        <p id="confirm-desc" class="confirm-msg">{{ message }}</p>
        <div class="btnrow">
          <button
            type="button"
            class="btn"
            :class="destructive ? 'destructive' : 'accent'"
            data-modal-primary
            @click="emit('confirm')"
          >
            {{ t('common.confirm') }}
          </button>
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
.confirm-title {
  font: 800 0.95rem/1.2 'Arial Black', system-ui, sans-serif;
  text-transform: uppercase;
  margin: 0 0 8px;
}
.confirm-msg {
  font: 700 0.85rem/1.4 ui-monospace, 'SF Mono', Menlo, monospace;
  margin: 0 0 16px;
}
</style>
