const IOS_GESTURE_EVENTS = ['gesturestart', 'gesturechange', 'gestureend'] as const

function blockDefault(event: Event): void {
  event.preventDefault()
}

export function installZoomPrevention(): void {
  for (const type of IOS_GESTURE_EVENTS) {
    document.addEventListener(type, blockDefault, { passive: false })
  }

  document.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey) event.preventDefault()
    },
    { passive: false },
  )

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1) event.preventDefault()
    },
    { passive: false },
  )
}
