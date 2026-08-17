function setMetaContent(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function syncAppBranding(title: string, shortTitle: string) {
  document.title = title
  setMetaContent('apple-mobile-web-app-title', shortTitle)
  setMetaContent('application-name', shortTitle)
}
