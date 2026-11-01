export function productFieldErrors(draft, language = 'en') {
  const errors = {},
    ar = language === 'ar'
  const add = (path, en, arabic) => {
    errors[path] = ar ? arabic : en
  }
  const required = (path, value) => {
    if (!String(value ?? '').trim()) add(path, 'This field is required.', 'هذا الحقل مطلوب.')
  }
  const text = (path, value, max, needed = false) => {
    if (needed) required(path, value)
    if ([...String(value ?? '').trim()].length > max)
      add(path, `Use no more than ${max} characters.`, `استخدم ${max} حرفًا كحد أقصى.`)
  }
  const bilingual = (path, value, max = 200, needed = true) => {
    for (const locale of ['en', 'ar']) text(`${path}.${locale}`, value?.[locale], max, needed)
  }
  const amount = (path, value, price) => {
    if (price !== undefined && (value === '' || value == null)) return
    if (value === '' || value == null) {
      required(path, value)
      return
    }
    const number = Number(value)
    if (!Number.isSafeInteger(number) || number < 0 || number > 1000000000)
      add(
        path,
        'Enter a valid amount from EGP 0 to EGP 10,000,000, with up to two decimal places.',
        'أدخل مبلغًا صالحًا من 0 إلى 10,000,000 جنيه، بمنزلتين عشريتين كحد أقصى.',
      )
    else if (price !== undefined && number >= Number(price))
      add(
        path,
        'The discounted price must be lower than the regular price.',
        'يجب أن يكون السعر بعد الخصم أقل من السعر الأصلي.',
      )
  }
  const stock = (path, value) => {
    if (value === '' || value == null) {
      required(path, value)
      return
    }
    if (!Number.isSafeInteger(Number(value)) || Number(value) < 0 || Number(value) > 1000000000)
      add(
        path,
        'Enter a whole stock quantity from 0 to 1,000,000,000.',
        'أدخل كمية مخزون صحيحة من 0 إلى 1,000,000,000.',
      )
  }
  bilingual('name', draft.name)
  bilingual('description', draft.description, 10000, false)
  required('slug', draft.slug)
  if (draft.slug && (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug) || draft.slug.length > 150))
    add(
      'slug',
      'Use lowercase English letters, numbers and single hyphens, up to 150 characters.',
      'استخدم حروفًا إنجليزية صغيرة وأرقامًا وشرطات مفردة، بحد أقصى 150 حرفًا.',
    )
  required('categoryId', draft.categoryId)
  if (draft.type === 'simple') {
    amount('price', draft.price)
    amount('discountedPrice', draft.discountedPrice, draft.price ?? NaN)
    stock('stock', draft.stock)
    text('sku', draft.sku, 100)
    return errors
  }
  if (!draft.options.length || draft.options.length > 5)
    add(
      'options',
      'Add between 1 and 5 options, such as Color or Size.',
      'أضف من خيار واحد إلى 5 خيارات، مثل اللون أو المقاس.',
    )
  draft.options.forEach((option, i) => {
    bilingual(`options.${i}.name`, option.name)
    if (!option.values.length || option.values.length > 50)
      add(
        `options.${i}.values`,
        'Add between 1 and 50 values for this option.',
        'أضف من قيمة واحدة إلى 50 قيمة لهذا الخيار.',
      )
    option.values.forEach((value, j) => bilingual(`options.${i}.values.${j}.name`, value.name))
  })
  if (!draft.variants.length || draft.variants.length > 100)
    add(
      'variants',
      'Add between 1 and 100 sellable variants, then enter their prices and stock.',
      'أضف من تركيبة واحدة إلى 100 تركيبة للبيع، ثم أدخل أسعارها ومخزونها.',
    )
  const combinations = new Map()
  draft.variants.forEach((variant, i) => {
    const base = `variants.${i}`
    draft.options.forEach((option) => {
      if (!option.values.some((value) => value.key === variant.values[option.key]))
        add(
          `${base}.values.${option.key}`,
          'Choose a value for this option.',
          'اختر قيمة لهذا الخيار.',
        )
    })
    const combination = JSON.stringify(draft.options.map((option) => variant.values[option.key]))
    if (combinations.has(combination)) {
      for (const index of [combinations.get(combination), i])
        add(
          `variants.${index}.values`,
          'This combination is repeated. Choose a different combination or remove the duplicate variant.',
          'هذه التركيبة مكررة. اختر تركيبة مختلفة أو أزل التركيبة المكررة.',
        )
    } else combinations.set(combination, i)
    amount(`${base}.price`, variant.price)
    amount(`${base}.discountedPrice`, variant.discountedPrice, variant.price ?? NaN)
    stock(`${base}.stock`, variant.stock)
    text(`${base}.sku`, variant.sku, 100)
  })
  return errors
}
