import { useEffect, useState } from 'react'
import { Brand } from './Brand.jsx'

let introFinished = false

export function SiteLoader() {
  const [phase, setPhase] = useState(() => (introFinished ? 'done' : 'loading'))
  useEffect(() => {
    if (introFinished) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const frame = requestAnimationFrame(() => {
        introFinished = true
        setPhase('done')
      })
      return () => cancelAnimationFrame(frame)
    }
    let active = true,
      finished = false,
      exitTimer
    const finish = () => {
      if (!active || finished) return
      finished = true
      introFinished = true
      document.documentElement.dataset.siteReady = 'true'
      setPhase('leaving')
      exitTimer = setTimeout(() => {
        if (active) setPhase('done')
      }, 220)
    }
    // Fail open if an asset stalls; there is no minimum delay or artificial progress percentage.
    const deadline = setTimeout(finish, 1100)
    const images = [...document.querySelectorAll('.public-hero img, .site-loader img')]
    Promise.allSettled([document.fonts.ready, ...images.map((image) => image.decode())]).then(
      finish,
    )
    return () => {
      active = false
      clearTimeout(deadline)
      clearTimeout(exitTimer)
    }
  }, [])

  if (phase === 'done') return null
  return (
    <div className="site-loader" data-phase={phase} aria-hidden="true">
      <div className="site-loader-brand">
        <Brand />
      </div>
      <div className="site-loader-line">
        <span />
      </div>
    </div>
  )
}
