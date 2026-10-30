// One observer per public page; content stays visible if motion is unavailable.
const targets = [
  '.business-section__heading',
  '.business-service-card',
  '.business-wholesale__image',
  '.business-wholesale__copy',
  '.business-inquiry__intro',
  '.business-step',
  '.business-service-heading',
  '.business-service-illustration',
  '.business-service-columns',
  '.business-service-family',
  '.business-contact>h1',
  '.business-contact>.business-lead',
  '.business-contact__illustration',
  '.business-contact-panel',
  '.business-information>section',
  '.inquiry-heading',
  '.inquiry-steps',
  '.service-picker',
  '.form-section',
  '.reference-upload',
  '.inquiry-aside',
  '.request-snapshot',
  '.inquiry-success',
  '.tracking-access',
  '.wholesale-intro',
  '.wholesale-search',
  '.offer-card',
  '.offer-images',
  '.offer-details',
  '.auth-art',
  '.retail-section-heading',
  '.retail-collections article',
  '.retail-sale-feature',
  '.retail-story',
  '.shop-heading',
  '.product-card',
  '.product-selection',
  '.cart-line',
  '.cart-summary',
].join(',')

const accountTabPaths = /^\/(en|ar)\/(?:account(?:\/(?:profile|addresses))?|orders)$/
const accountContentAnimations = new WeakMap()

export function isAccountTabPath(pathname) {
  return accountTabPaths.test(pathname)
}

export function animateAccountTabContent(root) {
  const content = root?.querySelector('.account-content')
  if (!content?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  accountContentAnimations.get(content)?.cancel()
  const animation = content.animate(
    [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' },
  )
  accountContentAnimations.set(content, animation)
  animation.finished.then(
    () => {
      if (accountContentAnimations.get(content) === animation)
        accountContentAnimations.delete(content)
    },
    () => {},
  )
  return () => {
    animation.cancel()
    if (accountContentAnimations.get(content) === animation)
      accountContentAnimations.delete(content)
  }
}

export function startPageMotion(root) {
  if (!root || !window.IntersectionObserver || !Element.prototype.animate) return
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  const seen = new WeakSet(),
    active = new Map(),
    pending = new Set()
  const style = getComputedStyle(root)
  const timing = style.getPropertyValue('--motion-reveal').trim()
  const duration = parseFloat(timing) * (timing.endsWith('ms') ? 1 : 1000) || 720
  const easing = style.getPropertyValue('--ease-reveal').trim() || 'cubic-bezier(.25,.46,.45,.94)'
  const show = (node) => {
    observer.unobserve(node)
    pending.delete(node)
    node.removeAttribute('data-motion-pending')
  }
  const cancel = () => {
    active.forEach((animation) => animation.cancel())
    active.clear()
  }
  const onPreference = () => {
    if (preference.matches) {
      cancel()
      pending.forEach(show)
    } else scan(root)
  }
  const onInteraction = (event) => {
    pending.forEach((node) => {
      if (node.contains(event.target)) show(node)
    })
    active.forEach((animation, node) => {
      if (node.contains(event.target)) {
        animation.cancel()
        active.delete(node)
      }
    })
  }
  const observer = new IntersectionObserver(
    (entries) => {
      let order = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const node = entry.target
        show(node)
        if (
          preference.matches ||
          node.contains(document.activeElement) ||
          entry.boundingClientRect.bottom <= 0
        )
          continue
        const animation = node.animate(
          [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration,
            delay: Math.min(order++ * 80, 240),
            easing,
            fill: 'backwards',
          },
        )
        active.set(node, animation)
        animation.finished.then(
          () => active.delete(node),
          () => {},
        )
      }
    },
    { threshold: 0, rootMargin: `0px 0px -${Math.round(Math.min(innerHeight * 0.18, 160))}px 0px` },
  )
  const register = (node) => {
    if (seen.has(node) || preference.matches || node.parentElement?.closest(targets)) return
    seen.add(node)
    if (node.contains(document.activeElement)) return
    pending.add(node)
    node.setAttribute('data-motion-pending', 'true')
    observer.observe(node)
  }
  const scan = (node) => {
    if (!(node instanceof Element)) return
    if (
      !preference.matches &&
      document.documentElement.dataset.siteReady !== 'true' &&
      document.querySelector('.site-loader')
    )
      return
    if (node.matches(targets)) register(node)
    node.querySelectorAll(targets).forEach(register)
  }
  scan(root)
  // Lazy routes and API results can arrive after the shell mounts.
  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') scan(root)
      else record.addedNodes.forEach(scan)
    }
    pending.forEach((node) => {
      if (!root.contains(node)) show(node)
    })
    active.forEach((animation, node) => {
      if (!root.contains(node)) {
        animation.cancel()
        active.delete(node)
      }
    })
  })
  mutations.observe(root, { childList: true, subtree: true })
  mutations.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-site-ready'],
  })
  root.addEventListener('focusin', onInteraction)
  root.addEventListener('pointerdown', onInteraction, true)
  preference.addEventListener('change', onPreference)
  return () => {
    observer.disconnect()
    mutations.disconnect()
    cancel()
    pending.forEach(show)
    root.removeEventListener('focusin', onInteraction)
    root.removeEventListener('pointerdown', onInteraction, true)
    preference.removeEventListener('change', onPreference)
  }
}
