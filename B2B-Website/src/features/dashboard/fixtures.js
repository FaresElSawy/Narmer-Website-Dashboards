import { ApiError } from '../../../../shared/lib/api.js'
import { createAccountPayload } from '../../../../shared/lib/staff-account.js'
import { nameSlug } from '../../../../shared/lib/offer-slugs.js'
import { formPayload, nativePayload, offerPayload, settingsPayload } from './model.js'

const id = (value) => value.toString(16).padStart(24, '0')
export function createStaffFixture(data) {
  const { definitions, leads } = data
  const reads = new Map()
  const products = new Map(
    data.offers
      .filter((offer) => offer.sourceStore === 'b2b')
      .map((offer) => [offer.productId, { ...offer.product, isActive: true, version: 0 }]),
  )
  const sources = new Map(
    data.offers
      .filter((offer) => offer.sourceStore === 'b2c')
      .map((offer) => [offer.productId, offer.product]),
  )
  const uploads = new Map()
  const users = new Map(
    ['user', 'moderator', 'admin', 'superAdmin'].map((role, index) => [
      id(3000 + index),
      {
        id: id(3000 + index),
        store: 'b2b',
        name: `Example ${role}`,
        email: `${role}@example.test`,
        phone: '+201000000000',
        role,
        emailVerified: true,
        status: 'active',
        createdAt: '2026-10-20T09:00:00.000Z',
        deletedAt: null,
      },
    ]),
  )
  const profiles = new Map()
  let sequence = 5000
  const allowedSlots = [
    ['hero', 'Main banner', 'البنر الرئيسي'],
    ['service-spinning', 'Spinning service', 'خدمة الغزل'],
    ['service-weaving', 'Weaving service', 'خدمة النسيج'],
    ['service-fabric', 'Fabric service', 'خدمة الأقمشة'],
    ['service-school-uniforms', 'School uniforms service', 'خدمة الزي المدرسي'],
    ['service-wholesale', 'Wholesale service', 'خدمة الجملة'],
    ['wholesale-overview', 'Wholesale overview', 'نظرة عامة على الجملة'],
  ].map(([key, en, ar]) => ({ key, label: { en, ar }, supportsMobileImage: true }))
  data.homepage = {
    store: 'b2b',
    version: 0,
    allowedSlots,
    slots: allowedSlots.map(({ key }) => ({
      key,
      desktopImage: null,
      mobileImage: null,
      alt: { en: '', ar: '' },
    })),
    updatedAt: null,
  }
  data.settings = {
    store: 'b2b',
    version: 0,
    phone: null,
    email: null,
    address: { en: '', ar: '' },
    mapUrl: null,
    social: { instagramUrl: null, whatsappUrl: null, tiktokUrl: null, facebookUrl: null },
    seo: { title: { en: 'Narmer', ar: 'نارمر' }, description: { en: '', ar: '' }, keywords: '' },
    updatedAt: null,
  }
  definitions.forEach((form, index) => {
    const leadId = id(2000 + index)
    leads.set(leadId, {
      owner: null,
      imageIds: index === 2 ? [id(8000)] : [],
      snapshot: {
        id: leadId,
        formType: form.type,
        status: index < 3 ? 'submitted' : 'contacted',
        contact: {
          name: `Example buyer ${index + 1}`,
          phone: '+201000000000',
          email: null,
          governorate: 'Cairo',
          district: 'Nasr City',
        },
        form: structuredClone(form),
        answers: {
          description: 'Sample manufacturing requirements for review.',
          quantity: 0,
          'has-design': false,
        },
        wholesaleRequests:
          form.type === 'wholesale' ? [{ ...structuredClone(data.offers[2]), quantity: 2 }] : [],
        imageCount: index === 2 ? 1 : 0,
        createdAt: new Date(Date.UTC(2026, 9, 24 - index, 9)).toISOString(),
        contactedAt: index < 3 ? null : '2026-10-24T12:00:00.000Z',
      },
    })
  })
  const fail = (code, status = 409) => {
    throw new ApiError(code, { status })
  }
  const page = (items, query) => {
    const current = Number(query.get('page') || 1),
      limit = Number(query.get('limit') || 20)
    return {
      items: items.slice((current - 1) * limit, current * limit),
      pagination: {
        page: current,
        limit,
        total: items.length,
        pages: Math.ceil(items.length / limit),
      },
    }
  }
  const staffLead = (record) => ({
    ...record.snapshot,
    userId: record.owner,
    imageIds: record.imageIds || [],
    contactedBy: record.contactedBy || null,
  })
  const request = async (path, { method, body, user, language, signal }) => {
    signal?.throwIfAborted()
    const url = new URL(path, 'https://fixture.invalid'),
      parts = url.pathname.split('/').filter(Boolean)
    let result
    if (parts[0] === 'leads') {
      if (!parts[1]) {
        const items = [...leads.values()]
          .map(staffLead)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .filter(
            (lead) =>
              (!url.searchParams.get('status') || lead.status === url.searchParams.get('status')) &&
              (!url.searchParams.get('formType') ||
                lead.formType === url.searchParams.get('formType')),
          )
        result = page(items, url.searchParams)
      } else {
        const record = leads.get(parts[1]) || fail('LEAD_NOT_FOUND', 404)
        if (parts[2] === 'images') {
          if (!record.imageIds?.includes(parts[3])) fail('LEAD_IMAGE_NOT_FOUND', 404)
          const sample = data.offers.find((offer) => offer.product?.images.length)?.product
            .images[0]
          return (await fetch(sample.url, { signal })).blob()
        }
        if (
          method === 'PATCH' &&
          parts[2] === 'contacted' &&
          record.snapshot.status !== 'contacted'
        ) {
          record.snapshot.status = 'contacted'
          record.snapshot.contactedAt = new Date().toISOString()
          record.contactedBy = user.id
        }
        result = staffLead(record)
      }
    } else if (parts[0] === 'forms') {
      if (!parts[1])
        result = {
          items: definitions,
          supportedFieldTypes: ['text', 'textarea', 'number', 'select', 'multiselect', 'boolean'],
        }
      else {
        const form =
          definitions.find((item) => item.type === parts[1]) || fail('FORM_NOT_FOUND', 404)
        if (method === 'PATCH') {
          if (body.version !== form.version) fail('FORM_CONFLICT')
          const clean = formPayload({ ...form, ...body })
          Object.assign(form, clean, { version: form.version + 1 })
          form.fields.forEach((field) => {
            field.constraints =
              field.type === 'text'
                ? { minLength: 1, maxLength: 500 }
                : field.type === 'textarea'
                  ? { minLength: 1, maxLength: 5000 }
                  : field.type === 'number'
                    ? { min: -1000000000, max: 1000000000 }
                    : {}
          })
        }
        result = form
      }
    } else if (parts[0] === 'wholesale') {
      const kind = parts[1],
        collection =
          kind === 'offers' ? data.offers : [...(kind === 'products' ? products : sources).values()]
      const project = (item) => {
        if (kind !== 'offers') return item
        const source = (item.sourceStore === 'b2b' ? products : sources).get(item.productId)
        item.product =
          source && source.isActive !== false
            ? Object.fromEntries(
                ['id', 'type', 'name', 'description', 'images', 'options', 'variants'].map(
                  (key) => [key, source[key]],
                ),
              )
            : null
        item.isAvailable = item.isActive && !!item.product
        return item
      }
      if (parts[2]) {
        const item =
          collection.find((item) => item.id === parts[2]) || fail('WHOLESALE_NOT_FOUND', 404)
        if (method === 'DELETE') {
          if (
            kind === 'products'
              ? data.offers.some(
                  (offer) => offer.sourceStore === 'b2b' && offer.productId === item.id,
                )
              : [...leads.values()].some((record) =>
                  record.snapshot.wholesaleRequests.some((offer) => offer.id === item.id),
                )
          )
            fail('WHOLESALE_REFERENCED')
          if (kind === 'products') products.delete(item.id)
          else data.offers.splice(data.offers.indexOf(item), 1)
          result = null
        } else {
          if (method === 'PATCH') {
            if (body.version !== item.version) fail('WHOLESALE_CONFLICT')
            if (kind === 'products') {
              nativePayload({ ...item, ...body })
              if (body.imageIds)
                item.images = body.imageIds.map(
                  (imageId) =>
                    item.images.find((image) => image.id === imageId) ||
                    (uploads.get(imageId)?.target === item.id && uploads.get(imageId).image) ||
                    fail('MEDIA_CONFLICT'),
                )
            } else offerPayload({ ...project(item), ...body })
            const changes = { ...body }
            delete changes.imageIds
            Object.assign(item, changes, { version: item.version + 1 })
            if (kind === 'offers')
              item.piecesPerPouch = item.composition.reduce((sum, row) => sum + row.quantity, 0)
          }
          result = project(item)
        }
      } else if (method === 'POST') {
        const item = { ...body, id: id(++sequence), version: 0 }
        if (kind === 'products') {
          nativePayload(item)
          Object.assign(item, { images: [], options: [], variants: [], type: 'simple' })
          products.set(item.id, item)
        } else {
          item.product =
            (item.sourceStore === 'b2b' ? products : sources).get(item.productId) ||
            fail('WHOLESALE_SOURCE_UNAVAILABLE')
          offerPayload(item)
          const used = new Set(data.offers.flatMap((offer) => [offer.slug, ...offer.slugAliases])),
            base = nameSlug(item.name.en) || 'offer'
          let slug = /^[a-f\d]{24}$/.test(base) ? `${base}-offer` : base,
            suffix = 2
          while (used.has(slug)) slug = `${base}-${suffix++}`
          Object.assign(item, { slug, slugAliases: [] })
          item.piecesPerPouch = item.composition.reduce((sum, row) => sum + row.quantity, 0)
          data.offers.unshift(item)
        }
        result = project(item)
      } else
        result = page(
          collection
            .map(project)
            .filter(
              (item) =>
                (!url.searchParams.get('q') ||
                  `${item.name.en} ${item.name.ar}`
                    .toLowerCase()
                    .includes(url.searchParams.get('q').toLowerCase())) &&
                (!url.searchParams.has('isActive') ||
                  item.isActive === (url.searchParams.get('isActive') === 'true')) &&
                (!url.searchParams.get('type') || item.type === url.searchParams.get('type')) &&
                (!url.searchParams.get('sourceStore') ||
                  item.sourceStore === url.searchParams.get('sourceStore')),
            ),
          url.searchParams,
        )
    } else if (parts[0] === 'media') {
      if (!products.has(parts[2])) fail('WHOLESALE_PRODUCT_NOT_FOUND', 404)
      const sample = data.offers.find((offer) => offer.product?.images.length)?.product.images[0]
      result = { ...sample, id: id(++sequence) }
      uploads.set(result.id, { image: result, target: parts[2] })
    } else if (parts[0] === 'homepage') {
      if (parts[1] === 'media') {
        if (
          !allowedSlots.some((slot) => slot.key === parts[2]) ||
          !['desktop', 'mobile'].includes(parts[3])
        )
          fail('VALIDATION_ERROR', 422)
        const sample = data.offers.find((offer) => offer.product?.images.length)?.product.images[0]
        result = { ...sample, id: id(++sequence) }
        uploads.set(result.id, { image: result, target: `${parts[2]}:${parts[3]}` })
      } else {
        if (method === 'PATCH') {
          if (body.version !== data.homepage.version) fail('HOMEPAGE_CONFLICT')
          for (const change of body.slots) {
            const slot =
              data.homepage.slots.find((slot) => slot.key === change.key) ||
              fail('VALIDATION_ERROR', 422)
            for (const device of ['desktop', 'mobile']) {
              const imageId = change[`${device}ImageId`]
              slot[`${device}Image`] =
                imageId === null
                  ? null
                  : slot[`${device}Image`]?.id === imageId
                    ? slot[`${device}Image`]
                    : uploads.get(imageId)?.target === `${slot.key}:${device}`
                      ? uploads.get(imageId).image
                      : fail('MEDIA_CONFLICT')
            }
            slot.alt = change.alt
          }
          data.homepage.version++
          data.homepage.updatedAt = new Date().toISOString()
        }
        result = data.homepage
      }
    } else if (parts[0] === 'site-settings') {
      if (method === 'PATCH') {
        if (body.version !== data.settings.version) fail('SITE_SETTINGS_CONFLICT')
        Object.assign(data.settings, settingsPayload({ ...data.settings, ...body }), {
          version: data.settings.version + 1,
          updatedAt: new Date().toISOString(),
        })
      }
      result = data.settings
    } else if (parts[0] === 'users') {
      if (parts[1] === 'me') {
        if (!profiles.has(user.id))
          profiles.set(user.id, {
            ...user,
            phone: '+201000000000',
            email: `${user.role}@example.test`,
            emailVerified: true,
          })
        const profile = profiles.get(user.id)
        if (method === 'PATCH') Object.assign(profile, body)
        result = profile
      } else if (parts[1]) {
        const account = users.get(parts[1]) || fail('ACCOUNT_NOT_FOUND', 404)
        if (method !== 'GET' && account.role === 'superAdmin') fail('SUPER_ADMIN_PROTECTED')
        if (method !== 'GET' && account.status === 'deleted') fail('ACCOUNT_NOT_FOUND', 404)
        if (method === 'PATCH') Object.assign(account, body)
        if (method === 'DELETE')
          Object.assign(account, { status: 'deleted', deletedAt: new Date().toISOString() })
        result = method === 'DELETE' ? null : account
      } else if (method === 'POST') {
        if (user.store !== 'b2b' || user.role !== 'superAdmin') fail('FORBIDDEN', 403)
        const value = createAccountPayload(body)
        if ([...users.values()].some((account) => account.email === value.email))
          fail('ACCOUNT_EMAIL_EXISTS')
        const { password: _password, ...account } = value
        result = {
          ...account,
          id: id(++sequence),
          store: 'b2b',
          status: 'active',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        }
        users.set(result.id, result)
      } else
        result = page(
          [...users.values()]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .filter(
              (account) =>
                (!url.searchParams.get('role') || account.role === url.searchParams.get('role')) &&
                (url.searchParams.get('status')
                  ? account.status === url.searchParams.get('status')
                  : account.status !== 'deleted'),
            ),
          url.searchParams,
        )
    } else if (parts[0] === 'auth' && parts[1] === 'change-password') {
      result = null
    } else if (parts[0] === 'auth') {
      const target = users.get(body.userId)
      if (
        !target ||
        target.status !== 'active' ||
        !target.emailVerified ||
        target.role === 'superAdmin'
      )
        fail('INVALID_SUPER_ADMIN_TARGET')
      for (const account of users.values())
        if (account.role === 'superAdmin') account.role = 'admin'
      target.role = 'superAdmin'
      result = { store: 'b2b', superAdminId: target.id }
    } else if (parts[0] === 'notifications') {
      if (!reads.has(user.id)) reads.set(user.id, new Map())
      const personal = reads.get(user.id)
      const items = [...leads.values()]
        .map((record) => ({
          id: id(900000 + parseInt(record.snapshot.id, 16)),
          type: 'lead.submitted',
          title: language === 'ar' ? 'طلب خدمة جديد' : 'New request',
          resource: { type: 'lead', id: record.snapshot.id },
          occurredAt: record.snapshot.createdAt,
          isRead: personal.has(id(900000 + parseInt(record.snapshot.id, 16))),
          readAt: personal.get(id(900000 + parseInt(record.snapshot.id, 16))) || null,
        }))
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      if (parts[1] === 'unread-count')
        result = { unreadCount: items.filter((item) => !item.isRead).length }
      else if (method === 'PATCH') {
        const item =
          items.find((value) => value.id === parts[1]) || fail('NOTIFICATION_NOT_FOUND', 404)
        if (!personal.has(item.id)) personal.set(item.id, new Date().toISOString())
        result = { ...item, isRead: true, readAt: personal.get(item.id) }
      } else
        result = {
          ...page(
            items.filter((item) => url.searchParams.get('unreadOnly') !== 'true' || !item.isRead),
            url.searchParams,
          ),
          unreadCount: items.filter((item) => !item.isRead).length,
        }
    } else fail('NOT_FOUND', 404)
    return structuredClone(result)
  }
  return request
}
