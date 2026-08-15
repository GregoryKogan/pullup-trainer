import { onMounted, shallowRef } from 'vue'
import { detectPlatform, isPwaInstalled, type InstallPlatform } from '@/utils/platform'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwaInstall() {
  const visible = shallowRef(false)
  const platform = shallowRef<InstallPlatform>('other')
  const deferredPrompt = shallowRef<BeforeInstallPromptEvent | null>(null)
  const dismissedThisSession = shallowRef(false)

  function check() {
    platform.value = detectPlatform()
    if (isPwaInstalled()) {
      visible.value = false
      return
    }
    if (dismissedThisSession.value) {
      visible.value = false
      return
    }
    visible.value = true
  }

  function dismiss() {
    dismissedThisSession.value = true
    visible.value = false
  }

  async function install() {
    const prompt = deferredPrompt.value
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice
    deferredPrompt.value = null
    check()
  }

  onMounted(() => {
    check()
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e as BeforeInstallPromptEvent
    })
    window.matchMedia('(display-mode: standalone)').addEventListener('change', check)
  })

  return { visible, platform, deferredPrompt, check, dismiss, install, canInstall: () => !!deferredPrompt.value }
}
