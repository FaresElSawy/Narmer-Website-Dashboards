import { useEffect, useRef, useState } from 'react'
import { useLocale } from './Locale.jsx'
import { Icon } from './Brand.jsx'

function ProductImage({ image, alt, lazy = false }) {
  const [failed, setFailed] = useState(null),
    ar = useLocale() === 'ar'
  if (!image?.url || failed === image.url)
    return <span>{ar ? 'الصورة غير متاحة' : 'Image unavailable'}</span>
  return (
    <img
      src={image.url}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      onError={() => setFailed(image.url)}
    />
  )
}

export function ProductGallery({ images, name }) {
  const ar = useLocale() === 'ar',
    [selection, setSelection] = useState({ index: 0, previous: null, direction: 1, version: 0 }),
    gallery = useRef(null),
    requested = useRef(0),
    generation = useRef(0)
  const index = Math.min(selection.index, Math.max(0, images.length - 1))
  useEffect(
    () => () => {
      generation.current++
    },
    [],
  )
  useEffect(() => {
    if (images.length < 2) return
    for (const position of new Set([
      (index + 1) % images.length,
      (index - 1 + images.length) % images.length,
    ])) {
      const image = new Image()
      image.src = images[position].url
      image.decode().catch(() => {})
    }
  }, [images, index])
  async function select(next, direction = next > requested.current ? 1 : -1, animate = true) {
    requested.current = next
    const request = ++generation.current
    if (images[next]?.url) {
      const image = new Image()
      image.src = images[next].url
      try {
        await image.decode()
      } catch {
        /* ProductImage renders the unavailable state. */
      }
    }
    if (request !== generation.current) return
    setSelection((current) =>
      next === current.index
        ? current
        : {
            index: next,
            previous: animate ? current.index : null,
            direction,
            version: current.version + 1,
          },
    )
    const strip = gallery.current,
      thumbnail = strip?.children[next]
    if (thumbnail) {
      const target = thumbnail.getBoundingClientRect(),
        bounds = strip.getBoundingClientRect()
      const left =
        target.left < bounds.left
          ? target.left - bounds.left
          : target.right > bounds.right
            ? target.right - bounds.right
            : 0
      strip.scrollBy({
        left,
        behavior:
          !animate || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      })
    }
  }
  const direction = selection.direction * (ar ? -1 : 1)
  return (
    <div className="offer-images">
      <div
        className="offer-main-image"
        style={{ '--gallery-from': `${direction * 100}%`, '--gallery-to': `${direction * -100}%` }}
      >
        {selection.previous !== null && (
          <div
            key={`previous-${selection.version}`}
            className="offer-slide offer-slide--outgoing"
            aria-hidden="true"
          >
            <ProductImage image={images[selection.previous]} alt="" />
          </div>
        )}
        <div
          key={`current-${selection.version}`}
          className={`offer-slide${selection.previous !== null ? ' offer-slide--incoming' : ''}`}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget)
              setSelection((current) =>
                current.version === selection.version ? { ...current, previous: null } : current,
              )
          }}
        >
          <ProductImage image={images[index]} alt={name} />
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-arrow--previous"
              aria-label={ar ? 'الصورة السابقة' : 'Previous image'}
              onClick={(event) =>
                select(
                  (requested.current - 1 + images.length) % images.length,
                  -1,
                  event.detail !== 0,
                )
              }
            >
              <Icon name="chevron" />
            </button>
            <button
              type="button"
              className="gallery-arrow gallery-arrow--next"
              aria-label={ar ? 'الصورة التالية' : 'Next image'}
              onClick={(event) =>
                select((requested.current + 1) % images.length, 1, event.detail !== 0)
              }
            >
              <Icon name="chevron" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div
          ref={gallery}
          className="offer-gallery"
          aria-label={ar ? 'صور المنتج' : 'Product images'}
        >
          {images.map((image, position) => (
            <button
              type="button"
              key={image.id}
              aria-label={`${ar ? 'الصورة' : 'Image'} ${position + 1}`}
              aria-pressed={index === position}
              onClick={(event) => select(position, undefined, event.detail !== 0)}
            >
              <ProductImage image={image} alt="" lazy />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
