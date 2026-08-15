export function rowNeedsScroll(el: HTMLElement | null): boolean {
  return !!el && el.scrollWidth > el.clientWidth + 1
}
