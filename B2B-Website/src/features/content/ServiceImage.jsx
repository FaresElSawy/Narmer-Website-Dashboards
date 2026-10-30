import {
  serviceContent,
  serviceImages,
  serviceImageKeys,
  imageDimensions,
} from '../../content/services.js'

export function ResponsiveImage({
  slot,
  fallback,
  alt,
  width,
  height,
  pictureClassName = '',
  ...props
}) {
  const desktop = slot?.desktopImage?.url || fallback
  const mobile = slot?.mobileImage?.url || slot?.desktopImage?.url || fallback
  return (
    <picture className={pictureClassName}>
      <source media="(max-width: 639px)" srcSet={mobile} />
      <img
        src={desktop}
        alt={slot?.alt || alt}
        width={slot?.desktopImage?.width || width}
        height={slot?.desktopImage?.height || height}
        {...props}
      />
    </picture>
  )
}

// eslint-disable-next-line react/only-export-components
export function serviceImage(type, home, language) {
  const slot = home?.slots?.find((item) => item.key === serviceImageKeys[type])
  const [width, height] = imageDimensions[type]
  return {
    slot,
    fallback: serviceImages[type],
    alt: serviceContent[type][language].imageAlt,
    width,
    height,
  }
}
