import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formPayload,
  samePatch,
  staffAccess,
  nativePayload,
  offerPayload,
  settingsPayload,
  settingsUrl,
  homepagePayload,
} from '../../B2B-Website/src/features/dashboard/model.js'
import {
  reviewDefinitions,
  createReviewInquiry,
} from '../../B2B-Website/src/features/inquiry/fixtures.js'
import { createStaffFixture } from '../../B2B-Website/src/features/dashboard/fixtures.js'
import { startNotificationPoll } from '../../B2B-Website/src/features/dashboard/notification-poll.js'

const user = { id: 'review-admin', role: 'admin', store: 'b2b' }
test('review staff creation stays local, validates roles and prevents duplicate accounts', async () => {
  const inquiry = createReviewInquiry({ images: {} }),
    serve = createStaffFixture(inquiry.staffData),
    draft = {
      name: 'New staff',
      email: ' NEW@example.test ',
      phone: '+20 (100) 1234567',
      password: 'LocalFixture123',
      role: 'moderator',
    }
  const owner = { ...user, role: 'superAdmin' },
    create = (body = draft, actor = owner) =>
      serve('/users', { method: 'POST', body, user: actor, language: 'en' }),
    account = await create()
  assert.equal(account.email, 'new@example.test')
  assert.equal(account.phone, '+201001234567')
  assert.equal(account.emailVerified, true)
  assert.equal(Object.hasOwn(account, 'password'), false)
  assert.equal(account.store, 'b2b')
  await assert.rejects(create(), { code: 'ACCOUNT_EMAIL_EXISTS' })
  await assert.rejects(create({ ...draft, role: 'superAdmin' }), {
    code: 'VALIDATION_ERROR',
  })
  for (const role of ['admin', 'moderator', 'user'])
    await assert.rejects(create(draft, { ...user, role }), { code: 'FORBIDDEN' })
  await assert.rejects(create(draft, { ...owner, store: 'b2c' }), { code: 'FORBIDDEN' })
  await assert.rejects(create({ ...draft, password: 'ع'.repeat(40) }), { code: 'VALIDATION_ERROR' })
  const list = await serve('/users', { method: 'GET', user, language: 'en' })
  assert.equal(list.items[0].id, account.id)
})
const setup = () => {
  const inquiry = createReviewInquiry({ images: {} }),
    serve = createStaffFixture(inquiry.staffData)
  return {
    inquiry,
    read: (path, options = {}) => serve(path, { user, language: 'en', method: 'GET', ...options }),
  }
}
test('Forms writes retain stable keys, strip response-only fields and reject duplicates', () => {
  const form = reviewDefinitions()[0],
    body = formPayload(form)
  assert.equal(body.version, 3)
  assert.equal('fixedFields' in body, false)
  assert.equal('constraints' in body.fields[0], false)
  assert.equal('id' in body, false)
  assert.throws(
    () => formPayload({ ...form, fields: [form.fields[0], form.fields[0]] }),
    /INVALID_FORM/,
  )
  assert.throws(
    () => formPayload({ ...form, fields: [{ ...form.fields[0], key: '__proto__' }] }),
    /INVALID_FORM/,
  )
  assert.throws(
    () => formPayload({ ...form, fields: [{ ...form.fields[0], label: { en: 'Only one' } }] }),
    /INVALID_FORM/,
  )
})
test('Roles retain only permitted staff operations and exclude cross-section moderator writes', () => {
  for (const path of ['/leads', '/leads/123/contacted', '/notifications?limit=1', '/users/me'])
    assert.equal(staffAccess('moderator', path), true)
  for (const path of ['/forms', '/wholesale/products', '/users', '/site-settings', '/homepage'])
    assert.equal(staffAccess('moderator', path), false)
  assert.equal(staffAccess('admin', '/wholesale/products/123', 'DELETE'), false)
  assert.equal(staffAccess('superAdmin', '/wholesale/products/123', 'DELETE'), true)
  assert.equal(staffAccess('admin', '/auth/super-admin/handover', 'POST'), false)
  assert.equal(staffAccess('user', '/leads'), false)
  for (const role of ['admin', 'moderator', 'user'])
    assert.equal(staffAccess(role, '/users', 'POST'), false)
  assert.equal(staffAccess('superAdmin', '/users', 'POST'), true)
  for (const role of ['admin', 'moderator', 'superAdmin']) {
    assert.equal(staffAccess(role, '/auth/change-password', 'POST'), true)
    assert.equal(staffAccess(role, '/auth/change-password', 'GET'), false)
  }
})
test('Form versions conflict without changing the saved definition; snapshots preserve zero and false', async () => {
  const { read } = setup(),
    form = await read('/forms/fabric')
  const body = formPayload({ ...form, title: { en: 'Updated', ar: 'محدث' }, isActive: false })
  const changed = await read('/forms/fabric', { method: 'PATCH', body })
  assert.equal(changed.version, form.version + 1)
  await assert.rejects(read('/forms/fabric', { method: 'PATCH', body }), /FORM_CONFLICT/)
  const lead = (await read('/leads?formType=fabric')).items[0]
  assert.notEqual(lead.form.title.en, changed.title.en)
  assert.equal(lead.answers.quantity, 0)
  assert.equal(lead.answers['has-design'], false)
})
test('Notification acknowledgment is per staff and does not mark contacted; IDs have separate purposes', async () => {
  const { read } = setup(),
    first = await read('/notifications'),
    item = first.items[0]
  assert.notEqual(item.id, item.resource.id)
  const once = await read(`/notifications/${item.id}/read`, { method: 'PATCH' })
  const again = await read(`/notifications/${item.id}/read`, { method: 'PATCH' })
  assert.equal(once.readAt, again.readAt)
  assert.equal((await read(`/leads/${item.resource.id}`)).status, 'submitted')
  assert.equal(
    (await read('/notifications', { user: { ...user, id: 'other-admin' } })).items[0].isRead,
    false,
  )
})
test('Contacted action is repeatable and preserves original attribution/time', async () => {
  const { read } = setup(),
    lead = (await read('/leads?status=submitted')).items[0]
  const first = await read(`/leads/${lead.id}/contacted`, { method: 'PATCH' })
  const second = await read(`/leads/${lead.id}/contacted`, {
    method: 'PATCH',
    user: { ...user, id: 'another' },
  })
  assert.equal(second.contactedAt, first.contactedAt)
  assert.equal(second.contactedBy, user.id)
})
test('New Phase 2 submissions appear in the same review staff dataset', async () => {
  const { inquiry, read } = setup(),
    draft = await inquiry.prepare('fabric', null),
    form = await inquiry.form('fabric', 'en')
  const body = {
    draftId: draft.draftId,
    formVersion: form.version,
    contact: {
      name: 'New customer',
      phone: '+201001234567',
      governorate: 'Cairo',
      district: 'Nasr City',
    },
    answers: { description: 'New requirements', 'has-design': false },
    imageIds: [],
    wholesaleRequests: [],
  }
  const receipt = await inquiry.submit(draft, body, null, 'en')
  assert.equal((await read(`/leads/${receipt.lead.id}`)).contact.name, 'New customer')
  await read(`/leads/${receipt.lead.id}/contacted`, { method: 'PATCH' })
  assert.equal(
    (await inquiry.track(receipt.lead.id, receipt.trackingToken, 'en')).status,
    'contacted',
  )
})
test('Native media binds to its target and offers do not write source fields', async () => {
  const { read } = setup(),
    products = (await read('/wholesale/products')).items
  const image = await read(`/media/product/${products[0].id}`, {
    method: 'POST',
    body: new Blob(['sample']),
  })
  await assert.rejects(
    read(`/wholesale/products/${products[1].id}`, {
      method: 'PATCH',
      body: { version: products[1].version, imageIds: [image.id] },
    }),
    /MEDIA_CONFLICT/,
  )
  const changed = await read(`/wholesale/products/${products[0].id}`, {
    method: 'PATCH',
    body: { version: products[0].version, imageIds: [image.id] },
  })
  assert.equal(changed.images[0].id, image.id)
  const offer = (await read('/wholesale/offers')).items[0],
    body = offerPayload(offer)
  assert.equal('product' in body, false)
  assert.equal('piecesPerPouch' in body, false)
  assert.equal('sourceStore' in body, false)
  assert.equal('imageIds' in body, false)
  assert.equal('price' in nativePayload(products[0]), false)
})
test('Composition validates real variants and native simple counts; reference deletion stays blocked', async () => {
  const { read } = setup(),
    offer = (await read('/wholesale/offers')).items.find((item) => item.sourceStore === 'b2c')
  assert.throws(
    () => offerPayload({ ...offer, composition: [{ variantId: null, quantity: 10 }] }),
    /INVALID_WHOLESALE/,
  )
  assert.throws(
    () => offerPayload({ ...offer, composition: [offer.composition[0], offer.composition[0]] }),
    /INVALID_WHOLESALE/,
  )
  assert.throws(
    () => offerPayload({ ...offer, composition: [{ ...offer.composition[0], quantity: 10001 }] }),
    /INVALID_WHOLESALE/,
  )
  await assert.rejects(
    read(`/wholesale/offers/${offer.id}`, { method: 'DELETE' }),
    /WHOLESALE_REFERENCED/,
  )
})
test('Homepage sends slot/device image IDs and keeps B2C curation out of B2B', async () => {
  const { read } = setup(),
    home = await read('/homepage'),
    image = await read('/homepage/media/hero/mobile', { method: 'POST' })
  const draft = structuredClone(home)
  draft.slots[0].mobileImage = image
  const body = homepagePayload(draft)
  assert.equal(body.slots[0].mobileImageId, image.id)
  assert.equal('allowedSlots' in body, false)
  assert.equal('newArrivals' in body, false)
  const saved = await read('/homepage', { method: 'PATCH', body })
  assert.equal(saved.slots[0].desktopImage, null)
  assert.equal(saved.slots[0].mobileImage.id, image.id)
  assert.equal(samePatch(saved, body), true)
})
test('Settings URL policies reject wrong hosts, credentials and executable links; clear maps to null', async () => {
  assert.equal(
    settingsUrl('mapUrl', ' https://google.com/maps?q=Cairo '),
    'https://google.com/maps?q=Cairo',
  )
  assert.equal(settingsUrl('instagramUrl', ''), null)
  for (const value of [
    'javascript:alert(1)',
    'https://instagram.com.evil.test/me',
    'https://user:pass@instagram.com/',
    'http://instagram.com/',
    'https://instagram.com:444/',
  ])
    assert.throws(() => settingsUrl('instagramUrl', value))
  assert.throws(() => settingsUrl('mapUrl', 'https://google.com/maps-other'))
  const { read } = setup(),
    settings = await read('/site-settings')
  const body = settingsPayload({ ...settings, phone: '+20 (100) 123-4567', email: '' })
  assert.equal(body.phone, '+201001234567')
  assert.equal(body.email, null)
  assert.equal('store' in body, false)
  assert.equal('updatedAt' in body, false)
})
test('Uncertain save comparisons ignore object key order and server constraints', () => {
  const form = reviewDefinitions()[0],
    body = formPayload(form)
  assert.equal(samePatch({ ...form, version: 99 }, body), true)
  assert.equal(samePatch({ ...form, isActive: false }, body), false)
})
test('Notification polling pauses while hidden and stops on permission denial', async () => {
  const listeners = new Map(),
    timers = [],
    page = {
      hidden: true,
      addEventListener: (key, fn) => listeners.set(key, fn),
      removeEventListener: (key) => listeners.delete(key),
    }
  let calls = 0
  const poll = startNotificationPoll(
    async () => {
      calls++
      throw { status: 403 }
    },
    () => assert.fail('must not commit'),
    {
      document: page,
      setTimer: (fn, delay) => {
        timers.push({ fn, delay })
        return timers.length
      },
      clearTimer: () => {},
    },
  )
  assert.equal(calls, 0)
  page.hidden = false
  listeners.get('visibilitychange')()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(calls, 1)
  poll.refresh()
  assert.equal(calls, 1)
  poll.stop()
  assert.equal(listeners.size, 0)
})
