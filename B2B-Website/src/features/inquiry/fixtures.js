import { ApiError } from '../../../../shared/lib/api.js'
import { formTypes, localText, validateDetails, validateSelections } from './model.js'

const pair = (en, ar) => ({ en, ar })
const id = (value) => value.toString(16).padStart(24, '0')
const names = {
  spinning: pair('Spinning', 'الغزل'),
  weaving: pair('Weaving', 'النسيج'),
  fabric: pair('Fabric & manufacturing', 'الأقمشة والتصنيع'),
  'school-uniforms': pair('School uniforms', 'الزي المدرسي'),
  wholesale: pair('Wholesale', 'الجملة'),
}
export function reviewDefinitions() {
  const field = (key, type, label, required, constraints = {}, choices = []) => ({
    key,
    type,
    label,
    required,
    constraints,
    choices,
  })
  const choice = (key, en, ar) => ({ key, label: pair(en, ar) })
  const fixedFields = [
    field('name', 'text', pair('Name', 'الاسم'), true, { minLength: 1, maxLength: 100 }),
    field('phone', 'phone', pair('Phone', 'رقم الهاتف'), true, { maxLength: 32 }),
    field('email', 'email', pair('Email', 'البريد الإلكتروني'), false, { maxLength: 254 }),
    field('governorate', 'text', pair('Governorate', 'المحافظة'), true, {
      minLength: 1,
      maxLength: 150,
    }),
    field('district', 'text', pair('District / area', 'المنطقة / الحي'), true, {
      minLength: 1,
      maxLength: 150,
    }),
  ]
  return formTypes.map((type, index) => ({
    id: id(100 + index),
    type,
    title: names[type],
    helpText: pair(
      'Tell us what you have in mind. Questions shown in this preview are examples for client review.',
      'أخبرنا بما تحتاجه. الأسئلة في هذه المعاينة أمثلة لمراجعة العميل.',
    ),
    isActive: true,
    version: 3,
    fixedFields,
    fields: [
      field('project-name', 'text', pair('Project name', 'اسم المشروع'), false, {
        minLength: 1,
        maxLength: 500,
      }),
      field('quantity', 'number', pair('Requested quantity', 'الكمية المطلوبة'), false, {
        min: -1000000000,
        max: 1000000000,
      }),
      field('description', 'textarea', pair('Project details', 'تفاصيل المشروع'), true, {
        minLength: 1,
        maxLength: 5000,
      }),
      field('material-source', 'select', pair('Material preference', 'تفضيل الخامة'), false, {}, [
        choice('own', 'I have material', 'لديّ خامة'),
        choice('discuss', 'Discuss with the team', 'أناقشها مع الفريق'),
      ]),
      field(
        'support',
        'multiselect',
        pair('What would you like to discuss?', 'ما الذي ترغب في مناقشته؟'),
        false,
        { minItems: 1, maxItems: 50, uniqueItems: true },
        [
          choice('samples', 'Samples', 'عينات'),
          choice('finishing', 'Finishing', 'التشطيب'),
          choice('timing', 'Timing', 'الموعد'),
        ],
      ),
      field(
        'has-design',
        'boolean',
        pair('Do you have a design reference?', 'هل لديك مرجع للتصميم؟'),
        true,
      ),
    ],
  }))
}

export function localizedForm(form, language) {
  const fields = (values) =>
    values.map((field) => ({
      ...field,
      label: localText(field.label, language),
      choices: field.choices.map((choice) => ({
        ...choice,
        label: localText(choice.label, language),
      })),
    }))
  return {
    ...structuredClone(form),
    title: localText(form.title, language),
    helpText: localText(form.helpText, language),
    fixedFields: fields(form.fixedFields),
    fields: fields(form.fields),
  }
}

export function reviewOffers(images = {}) {
  return [
    ['Logo hoodie', 'هودي بشعار', images.logo],
    ['Everyday sweatshirt', 'سويت شيرت يومي', images.men],
    ['Quarter-zip sweatshirt', 'سويت شيرت بسحاب قصير', images.quarter],
    ['Sport hoodie', 'هودي رياضي', images.women],
  ].map(([en, ar, url], index) => {
    const productId = id(200 + index),
      image = { id: id(300 + index), url: url || '', width: 1200, height: 1200 },
      mixed = index === 2
    const variants = mixed
      ? ['s', 'm', 'l', 'xl', 'xxl', 'xxxl'].map((size, i) => ({
          id: id(400 + i),
          values: { color: 'navy', size },
          images: [image],
        }))
      : []
    return {
      id: id(500 + index),
      slug: ['logo-hoodie', 'everyday-sweatshirt', 'quarter-zip-sweatshirt', 'sport-hoodie'][index],
      slugAliases: index === 0 ? ['classic-logo-hoodie'] : [],
      name: pair(en, ar),
      description: pair(
        'A fixed wholesale pouch. The team will discuss your requirements after you send an inquiry.',
        'عبوة جملة بتكوين ثابت. يناقش الفريق متطلباتك بعد إرسال الاستفسار.',
      ),
      sourceStore: mixed ? 'b2c' : 'b2b',
      productId,
      composition: mixed
        ? variants
            .slice(0, 4)
            .map((variant, i) => ({ variantId: variant.id, quantity: [6, 9, 9, 6][i] }))
        : [{ variantId: null, quantity: 30 }],
      piecesPerPouch: 30,
      isActive: true,
      isAvailable: true,
      version: 2,
      product: {
        id: productId,
        type: mixed ? 'variant' : 'simple',
        name: pair(en, ar),
        description: pair('Demonstration collection for review.', 'مجموعة تجريبية للمراجعة.'),
        images: mixed
          ? [
              image,
              { ...image, id: id(604), url: images.logo || image.url },
              { ...image, id: id(605), url: images.women || image.url },
            ]
          : [image],
        options: mixed
          ? [
              {
                key: 'color',
                name: pair('Color', 'اللون'),
                values: [{ key: 'navy', name: pair('Navy', 'كحلي') }],
              },
              {
                key: 'size',
                name: pair('Size', 'المقاس'),
                values: ['s', 'm', 'l', 'xl', 'xxl', 'xxxl'].map((size) => ({
                  key: size,
                  name: pair(size.toUpperCase(), size.toUpperCase()),
                })),
              },
            ]
          : [],
        variants,
      },
    }
  })
}

export function localizedOffer(offer, language) {
  const product = offer.product && {
    ...offer.product,
    name: localText(offer.product.name, language),
    description: localText(offer.product.description, language),
    options: offer.product.options.map((option) => ({
      ...option,
      name: localText(option.name, language),
      values: option.values.map((value) => ({ ...value, name: localText(value.name, language) })),
    })),
  }
  return structuredClone({
    ...offer,
    name: localText(offer.name, language),
    description: localText(offer.description, language),
    product,
  })
}

export function createReviewInquiry({ images, now = Date.now } = {}) {
  const definitions = reviewDefinitions(),
    offers = reviewOffers(images),
    drafts = new Map(),
    leads = new Map()
  let sequence = 1000
  const fail = (code, status = 409) => {
    throw new ApiError(code, { status })
  }
  const form = (type) =>
    definitions.find((item) => item.type === type && item.isActive) || fail('FORM_NOT_FOUND', 404)
  const offer = (offerId) =>
    offers.find((item) => item.id === offerId && item.isActive && item.isAvailable) ||
    fail('WHOLESALE_OFFER_NOT_FOUND', 404)
  const draft = (value, owner, replay = false) => {
    const found = drafts.get(value.draftId)
    if (
      !found ||
      found.token !== value.draftToken ||
      found.owner !== owner ||
      (!(replay && found.result) && Date.parse(found.expiresAt) <= now())
    )
      fail('LEAD_DRAFT_UNAVAILABLE')
    return found
  }
  const leadDto = (lead, language) => ({
    ...structuredClone(lead.snapshot),
    form: localizedForm(lead.snapshot.form, language),
    wholesaleRequests: lead.snapshot.wholesaleRequests.map((item) => ({
      ...localizedOffer(item, language),
      quantity: item.quantity,
    })),
  })
  return {
    // Only the isolated review backend shares these records with the staff demo.
    staffData: { definitions, offers, leads },
    forms: async (language) => ({
      items: definitions
        .filter((item) => item.isActive)
        .map((item) => localizedForm(item, language)),
      supportedFieldTypes: ['text', 'textarea', 'number', 'select', 'multiselect', 'boolean'],
    }),
    form: async (type, language) => localizedForm(form(type), language),
    offers: async (query, language) => {
      const page = Number(query.page || 1),
        limit = Number(query.limit || 8),
        items = offers.filter(
          (item) =>
            item.isActive &&
            item.isAvailable &&
            (!query.q ||
              `${item.name.en} ${item.name.ar}`.toLowerCase().includes(query.q.toLowerCase())),
        )
      return {
        items: items
          .slice((page - 1) * limit, page * limit)
          .map((item) => localizedOffer(item, language)),
        pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) },
      }
    },
    offer: async (offerId, language) => localizedOffer(offer(offerId), language),
    resolveOffer: async (key, language) => {
      const item = offers.find((item) =>
        [item.id, item.slug, ...item.slugAliases].includes(key.toLowerCase()),
      )
      return localizedOffer(offer(item?.id), language)
    },
    sizeChart: async (productId, language) =>
      offers.some((item) => item.productId === productId && item.sourceStore === 'b2c')
        ? {
            id: id(900),
            name: language === 'ar' ? 'دليل مقاسات تجريبي' : 'Sample size guide',
            image: null,
            alt: '',
            measurements: {
              unit: 'cm',
              rows: [
                { size: 'S', chest: 50, length: 66, sleeve: 60 },
                { size: 'M', chest: 53, length: 69, sleeve: 62 },
                { size: 'L', chest: 56, length: 72, sleeve: 64 },
              ],
            },
          }
        : null,
    async prepare(type, owner) {
      form(type)
      const draftId = id(++sequence),
        draftToken = crypto.randomUUID().replaceAll('-', '') + 'ReviewToken'
      const expiresAt = new Date(now() + 86400000).toISOString()
      drafts.set(draftId, { type, owner, token: draftToken, expiresAt, images: [], result: null })
      return { draftId, draftToken, formType: type, expiresAt }
    },
    async readDraft(value, owner) {
      const found = draft(value, owner)
      if (found.result) fail('LEAD_DRAFT_UNAVAILABLE')
      return {
        draftId: value.draftId,
        formType: found.type,
        expiresAt: found.expiresAt,
        images: structuredClone(found.images),
        uploadingCount: 0,
      }
    },
    async upload(value, owner) {
      const found = draft(value, owner)
      if (found.images.length >= 5) fail('LEAD_IMAGE_LIMIT')
      const image = { id: id(++sequence), width: 1200, height: 800 }
      found.images.push(image)
      return image
    },
    async submit(value, body, owner, language) {
      const found = draft(value, owner, true),
        fingerprint = JSON.stringify(body)
      if (found.result) {
        if (!owner && Date.parse(found.result.trackingExpiresAt) <= now())
          fail('LEAD_NOT_FOUND', 404)
        if (fingerprint !== found.fingerprint) fail('LEAD_REQUEST_CONFLICT')
        return { ...found.result, lead: leadDto(leads.get(found.result.lead.id), language) }
      }
      const definition = form(found.type)
      if (body.formVersion !== definition.version) fail('FORM_CONFLICT')
      if (Object.keys(validateDetails(definition, body.contact, body.answers)).length)
        fail('INVALID_LEAD', 422)
      const selected = body.wholesaleRequests.map((row) => ({
        offer: offer(row.offerId),
        quantity: row.quantity,
        version: row.version,
      }))
      if (found.type === 'wholesale' && !validateSelections(selected)) fail('INVALID_LEAD', 422)
      if (selected.some((row) => row.version !== row.offer.version)) fail('WHOLESALE_CONFLICT')
      if (body.imageIds.some((imageId) => !found.images.some((image) => image.id === imageId)))
        fail('LEAD_IMAGE_CONFLICT')
      const leadId = id(++sequence),
        createdAt = new Date(now()).toISOString(),
        trackingToken = owner ? null : crypto.randomUUID().replaceAll('-', '') + 'ReviewToken',
        trackingExpiresAt = owner ? null : new Date(now() + 90 * 86400000).toISOString()
      const record = {
        owner,
        imageIds: [...body.imageIds],
        token: trackingToken,
        expiresAt: trackingExpiresAt,
        snapshot: {
          id: leadId,
          formType: found.type,
          status: 'submitted',
          contact: body.contact,
          form: structuredClone(definition),
          answers: body.answers,
          wholesaleRequests: selected.map((row) => {
            const { slug: _slug, slugAliases: _aliases, ...snapshot } = structuredClone(row.offer)
            return { ...snapshot, quantity: row.quantity }
          }),
          imageCount: body.imageIds.length,
          createdAt,
          contactedAt: null,
        },
      }
      leads.set(leadId, record)
      found.fingerprint = fingerprint
      found.result = { lead: leadDto(record, language), trackingToken, trackingExpiresAt }
      return structuredClone(found.result)
    },
    async track(leadId, token, language) {
      const lead = leads.get(leadId)
      if (!lead || lead.owner || lead.token !== token || Date.parse(lead.expiresAt) <= now())
        fail('LEAD_NOT_FOUND', 404)
      return leadDto(lead, language)
    },
    async detail(leadId, owner, language) {
      const lead = leads.get(leadId)
      if (!owner || !lead || lead.owner !== owner) fail('LEAD_NOT_FOUND', 404)
      return leadDto(lead, language)
    },
    async history(query, owner, language) {
      if (!owner) fail('FORBIDDEN', 403)
      const page = Number(query.page || 1),
        limit = Number(query.limit || 20),
        items = [...leads.values()]
          .reverse()
          .filter(
            (item) =>
              item.owner === owner &&
              (!query.status || item.snapshot.status === query.status) &&
              (!query.formType || item.snapshot.formType === query.formType),
          )
      return {
        items: items.slice((page - 1) * limit, page * limit).map((item) => leadDto(item, language)),
        pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) },
      }
    },
  }
}
