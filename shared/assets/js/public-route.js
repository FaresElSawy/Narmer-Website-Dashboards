// Named HTML entry points hydrate at their existing localized application URL.
export function restorePublicRoute() {
  const route = JSON.parse(document.getElementById('narmer-page-route')?.textContent || 'null')
  if (route && (window.location.pathname === '/' || window.location.pathname.endsWith('.html'))) {
    window.history.replaceState(
      window.history.state,
      '',
      `${route}${window.location.search}${window.location.hash}`,
    )
  }
}
