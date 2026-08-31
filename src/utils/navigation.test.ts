import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  getAppMain,
  preferredScrollBehavior,
  scrollAppMainToTop,
  scrollToHash,
} from '@/utils/navigation'

describe('navigation scroll helpers', () => {
  let main: HTMLElement
  let target: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = `
      <main class="app-main" style="height: 200px; overflow: auto;">
        <div style="height: 800px;"></div>
        <section id="sources" style="height: 100px;">Sources</section>
        <div style="height: 400px;"></div>
      </main>
    `
    main = document.querySelector('.app-main') as HTMLElement
    target = document.getElementById('sources') as HTMLElement
    main.scrollTop = 500
    main.scrollTo = ((options?: ScrollToOptions | number, y?: number) => {
      if (typeof options === 'number') {
        main.scrollTop = y ?? 0
        return
      }
      main.scrollTop = options?.top ?? 0
    }) as HTMLElement['scrollTo']
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('getAppMain returns the scroll container', () => {
    expect(getAppMain()).toBe(main)
  })

  it('falls back to an instant jump when the user asks for reduced motion', () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) =>
      ({ matches: query.includes('reduce') }) as MediaQueryList) as typeof window.matchMedia
    expect(preferredScrollBehavior()).toBe('auto')
    window.matchMedia = ((query: string) =>
      ({ matches: false, media: query }) as MediaQueryList) as typeof window.matchMedia
    expect(preferredScrollBehavior()).toBe('smooth')
    window.matchMedia = original
  })

  it('scrollAppMainToTop resets scroll position', () => {
    scrollAppMainToTop('auto')
    expect(main.scrollTop).toBe(0)
  })

  it('scrollToHash scrolls within app-main', () => {
    target.getBoundingClientRect = () =>
      ({
        top: 900,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 100,
        x: 0,
        y: 900,
        toJSON: () => ({}),
      }) as DOMRect
    main.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 200,
        width: 0,
        height: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect

    scrollToHash('#sources', 'auto')
    expect(main.scrollTop).toBe(1400)
  })
})
