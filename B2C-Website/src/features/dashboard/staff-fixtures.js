import { ApiError } from '../../../../shared/lib/api.js'
import { settingsPayload, accountPayload, createAccountPayload } from './staff-model.js'
const id = (n) => n.toString(16).padStart(24, '0')
export function createStaffContentFixture(seedProducts = []) {
  const slots = [
    ['hero-left', 'Hero: left image', 'الصورة اليسرى للبنر الرئيسي'],
    ['hero-right', 'Hero: right image', 'الصورة اليمنى للبنر الرئيسي'],
    ['collection-men', 'Men collection', 'مجموعة الرجال'],
    ['collection-women', 'Women collection', 'مجموعة النساء'],
    ['collection-kids', 'Kids collection', 'مجموعة الأطفال'],
    ['sale-feature', 'Sale feature', 'صورة قسم التخفيضات'],
    ['factory-story', 'Factory story', 'صورة قصة المصنع'],
  ].map(([key, en, ar]) => ({ key, label: { en, ar }, supportsMobileImage: true }))
  const homepage = {
    store: 'b2c',
    version: 0,
    allowedSlots: slots,
    slots: slots.map(({ key }) => ({
      key,
      desktopImage: null,
      mobileImage: null,
      alt: { en: '', ar: '' },
    })),
    newArrivals: {
      productIds: seedProducts.slice(4, 8).map((item) => item.id),
      visibleProductIds: seedProducts.slice(4, 8).map((item) => item.id),
    },
    sale: {
      productIds: seedProducts
        .filter((item) => item.variants?.some((variant) => variant.discountedPrice !== null))
        .slice(0, 2)
        .map((item) => item.id),
      visibleProductIds: seedProducts
        .filter((item) => item.variants?.some((variant) => variant.discountedPrice !== null))
        .slice(0, 2)
        .map((item) => item.id),
    },
    updatedAt: null,
  }
  const settings = {
    store: 'b2c',
    version: 0,
    phone: null,
    email: null,
    address: { en: '', ar: '' },
    mapUrl: null,
    social: { instagramUrl: null, whatsappUrl: null, tiktokUrl: null, facebookUrl: null },
    seo: { title: { en: 'Narmer', ar: 'نارمر' }, description: { en: '', ar: '' }, keywords: '' },
    updatedAt: null,
  }
  const users = new Map([
    [
      id(1),
      {
        id: id(1),
        store: 'b2c',
        name: 'Example Super Admin',
        email: 'admin@example.test',
        phone: '+201000000001',
        role: 'superAdmin',
        status: 'active',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      },
    ],
    [
      id(2),
      {
        id: id(2),
        store: 'b2c',
        name: 'Example Admin',
        email: 'staff@example.test',
        phone: '+201000000002',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      },
    ],
  ])
  const reads = new Map(),
    profiles = new Map(),
    images = new Map()
  let seq = 100
  const fail = (code, status = 409) => {
    throw new ApiError(code, { status })
  }
  const page = (items, q) => {
    const p = Number(q.get('page') || 1),
      l = Number(q.get('limit') || 20)
    return {
      items: items.slice((p - 1) * l, p * l),
      pagination: { page: p, limit: l, total: items.length, pages: Math.ceil(items.length / l) },
    }
  }
  return async (path, { method = 'GET', body = {}, user, language = 'en' } = {}) => {
    const url = new URL(path, 'https://fixture.invalid'),
      parts = url.pathname.split('/').filter(Boolean)
    let result
    if (parts[0] === 'homepage') {
      if (parts[1] === 'media') {
        if (!slots.some((x) => x.key === parts[2]) || !['desktop', 'mobile'].includes(parts[3]))
          fail('VALIDATION_ERROR', 422)
        const image = {
          id: id(++seq),
          url: URL.createObjectURL(body),
          width: 1200,
          height: 800,
        }
        images.set(image.id, { image, target: `${parts[2]}:${parts[3]}` })
        return image
      }
      if (method === 'PATCH') {
        if (body.version !== homepage.version) fail('HOMEPAGE_CONFLICT')
        const next = structuredClone(homepage)
        if (body.slots)
          for (const change of body.slots) {
            const slot =
              next.slots.find((x) => x.key === change.key) || fail('VALIDATION_ERROR', 422)
            for (const device of ['desktop', 'mobile'])
              if (`${device}ImageId` in change) {
                const imageId = change[`${device}ImageId`]
                slot[`${device}Image`] =
                  imageId === null
                    ? null
                    : images.get(imageId)?.target === `${slot.key}:${device}`
                      ? images.get(imageId).image
                      : slot[`${device}Image`]?.id === imageId
                        ? slot[`${device}Image`]
                        : fail('MEDIA_CONFLICT')
              }
            if (change.alt) slot.alt = { ...slot.alt, ...change.alt }
          }
        for (const key of ['newArrivals', 'sale'])
          if (body[key]) {
            if (
              body[key].productIds.length > 20 ||
              new Set(body[key].productIds).size !== body[key].productIds.length ||
              body[key].productIds.some((x) => !seedProducts.some((p) => p.id === x))
            )
              fail('HOMEPAGE_PRODUCT_UNAVAILABLE')
            next[key].productIds = [...body[key].productIds]
            next[key].visibleProductIds = next[key].productIds.filter((x) => {
              const product = seedProducts.find((p) => p.id === x)
              return (
                product?.isActive &&
                (key !== 'sale' ||
                  product.variants?.some(
                    (v) => v.discountedPrice != null && v.discountedPrice < v.price,
                  ))
              )
            })
          }
        next.version++
        next.updatedAt = new Date().toISOString()
        Object.assign(homepage, next)
      }
      result = homepage
    } else if (parts[0] === 'site-settings') {
      if (method === 'PATCH') {
        if (body.version !== settings.version) fail('SITE_SETTINGS_CONFLICT')
        Object.assign(settings, settingsPayload({ ...settings, ...body }), {
          version: settings.version + 1,
          updatedAt: new Date().toISOString(),
        })
      }
      result = settings
    } else if (parts[0] === 'products') result = page(seedProducts, url.searchParams)
    else if (parts[0] === 'users' && parts[1] === 'me') {
      if (!profiles.has(user.id))
        profiles.set(user.id, {
          ...user,
          email: user.email || 'review@example.test',
          phone: user.phone || '+201000000000',
          emailVerified: true,
        })
      result = profiles.get(user.id)
      if (method === 'PATCH')
        Object.assign(result, accountPayload({ ...result, ...body }, result, true))
    } else if (parts[0] === 'users' && parts[1]) {
      const target = users.get(parts[1]) || fail('ACCOUNT_NOT_FOUND', 404)
      if (method === 'PATCH') {
        if (target.role === 'superAdmin') fail('SUPER_ADMIN_PROTECTED')
        Object.assign(target, accountPayload({ ...target, ...body }, target))
      }
      if (method === 'DELETE') {
        if (user.role !== 'superAdmin') fail('FORBIDDEN', 403)
        target.status = 'deleted'
        target.deletedAt = new Date().toISOString()
        result = null
      } else result = target
    } else if (parts[0] === 'users') {
      if (method === 'POST') {
        if (user.role !== 'superAdmin') fail('FORBIDDEN', 403)
        const value = createAccountPayload(body)
        if ([...users.values()].some((x) => x.email === value.email)) fail('ACCOUNT_EMAIL_EXISTS')
        result = {
          id: id(++seq),
          store: 'b2c',
          ...value,
          password: undefined,
          emailVerified: true,
          status: 'active',
          createdAt: new Date().toISOString(),
          deletedAt: null,
        }
        delete result.password
        users.set(result.id, result)
      } else
        result = page(
          [...users.values()]
            .filter((x) =>
              !url.searchParams.get('status')
                ? x.status !== 'deleted'
                : x.status === url.searchParams.get('status'),
            )
            .filter(
              (x) => !url.searchParams.get('role') || x.role === url.searchParams.get('role'),
            ),
          url.searchParams,
        )
    } else if (parts[0] === 'notifications') {
      if (!reads.has(user.id)) reads.set(user.id, new Map())
      const read = reads.get(user.id),
        items = Array.from({ length: 3 }, (_, index) => ({
          id: id(14000 + index),
          type: 'order.placed',
          title: language === 'ar' ? 'طلب جديد' : 'New order',
          resource: { type: 'order', id: id(12000 + index) },
          occurredAt: new Date(Date.now() - index * 86400000).toISOString(),
          isRead: read.has(id(14000 + index)),
          readAt: read.get(id(14000 + index)) || null,
        })),
        unreadCount = items.filter((item) => !item.isRead).length
      if (parts[1] === 'unread-count') result = { unreadCount }
      else if (method === 'PATCH') {
        if (!items.some((item) => item.id === parts[1])) fail('NOTIFICATION_NOT_FOUND', 404)
        if (!read.has(parts[1])) read.set(parts[1], new Date().toISOString())
        result = { id: parts[1], isRead: true, readAt: read.get(parts[1]) }
      } else
        result = {
          ...page(
            url.searchParams.get('unreadOnly') === 'true'
              ? items.filter((item) => !item.isRead)
              : items,
            url.searchParams,
          ),
          unreadCount,
        }
    } else if (parts[0] === 'auth' && parts[1] === 'super-admin' && parts[2] === 'handover') {
      if (user.role !== 'superAdmin') fail('FORBIDDEN', 403)
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
      result = { store: 'b2c', superAdminId: target.id }
    } else if (parts[0] === 'auth' && parts[1] === 'change-password') {
      result = null
    } else return undefined
    return structuredClone(result)
  }
}
