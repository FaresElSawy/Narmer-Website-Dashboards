export function variantLabel(product, variant, language) {
  return product.options
    .map((option) => {
      const value = option.values.find((value) => value.key === variant.values[option.key])
      return value?.name?.[language] || value?.name?.en || variant.values[option.key] || '-'
    })
    .join(' / ')
}

export function variantImages(product, variant) {
  return variant.images?.length ? variant.images : product.images
}

export function productImages(product) {
  return [
    ...new Map(
      [
        ...product.images,
        ...(product.variants || []).flatMap((variant) => variant.images || []),
      ].map((image) => [image.id, image]),
    ).values(),
  ]
}

export function assignProductImage(product, image, { main, targets }, language = 'en') {
  const ar = language === 'ar',
    update = (images, included) => {
      const exists = images.some((item) => item.id === image.id)
      return included
        ? exists
          ? images
          : [...images, image]
        : images.filter((item) => item.id !== image.id)
    },
    images = update(product.images, main),
    variants = product.variants?.map((variant, index) => {
      const included = targets.includes(index),
        ownImages = update(variantImages(product, variant), included)
      // Empty variant galleries inherit main images; do not promise an exclusion the API cannot store.
      if (!included && !ownImages.length && images.some((item) => item.id === image.id))
        throw new Error(
          ar
            ? `أضف صورة بديلة لـ ${variantLabel(product, variant, language)} أو أزل الصورة من المعرض الرئيسي.`
            : `Add another image for ${variantLabel(product, variant, language)} or remove this photo from the main gallery.`,
        )
      return { ...variant, images: ownImages }
    })
  if (
    [images, ...(variants || []).map((variant) => variant.images)].some(
      (gallery) => gallery.length > 10,
    )
  )
    throw new Error(
      ar
        ? 'الحد الأقصى 10 صور لكل معرض. أزل صورة قبل إضافة أخرى.'
        : 'Each gallery can hold 10 images. Remove a photo before adding another.',
    )
  return { ...product, images, ...(variants ? { variants } : {}) }
}

export function removeProductImage(product, imageId) {
  const without = (images = []) => images.filter((image) => image.id !== imageId)
  return {
    ...product,
    images: without(product.images),
    ...(product.variants
      ? {
          variants: product.variants.map((variant) => ({
            ...variant,
            images: without(variant.images),
          })),
        }
      : {}),
  }
}

export function moveProductImage(product, imageId, direction, gallery = 'main') {
  if (gallery !== 'main' && !product.variants?.[Number(gallery)]) return product
  const source =
      gallery === 'main'
        ? product.images
        : variantImages(product, product.variants[Number(gallery)]),
    images = [...source],
    index = images.findIndex((image) => image.id === imageId),
    next = index + direction
  if (index < 0 || next < 0 || next >= images.length) return product
  ;[images[index], images[next]] = [images[next], images[index]]
  if (gallery === 'main') return { ...product, images }
  return {
    ...product,
    variants: product.variants.map((variant, index) =>
      index === Number(gallery) ? { ...variant, images } : variant,
    ),
  }
}
