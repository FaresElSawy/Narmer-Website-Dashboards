import test from 'node:test'
import assert from 'node:assert/strict'
import { createStaffContentFixture } from '../../B2C-Website/src/features/dashboard/staff-fixtures.js'
import {
  createAccountPayload,
  homepagePayload,
} from '../../B2C-Website/src/features/dashboard/staff-model.js'
import { unknownWrite } from '../../B2C-Website/src/features/dashboard/model.js'
import { createdAccount } from '../lib/staff-account.js'

const user = { id: 'review-superAdmin', role: 'superAdmin', store: 'b2c', name: 'Review staff' }
test('Kids homepage images save independently in the seven-slot editor and can be cleared', async () => {
  const request = createStaffContentFixture()
  const initial = await request('/homepage', { user })
  assert.equal(initial.allowedSlots.length, 7)
  assert.equal(
    initial.allowedSlots.find((slot) => slot.key === 'collection-kids').supportsMobileImage,
    true,
  )
  const draft = structuredClone(initial)
  const kids = draft.slots.find((slot) => slot.key === 'collection-kids')
  const uploaded = []
  try {
    for (const device of ['desktop', 'mobile']) {
      const image = await request(`/homepage/media/collection-kids/${device}`, {
        method: 'POST',
        body: new Blob(['local']),
        user,
      })
      uploaded.push(image)
      kids[`${device}Image`] = image
    }
    kids.alt = { en: 'Kids collection', ar: 'مجموعة الأطفال' }
    const body = homepagePayload(draft)
    assert.equal(body.slots.length, 7)
    const saved = await request('/homepage', { method: 'PATCH', body, user })
    const savedKids = saved.slots.find((slot) => slot.key === 'collection-kids')
    assert.deepEqual(savedKids, kids)
    assert.deepEqual(
      saved.slots.filter((slot) => slot.key !== 'collection-kids'),
      initial.slots.filter((slot) => slot.key !== 'collection-kids'),
    )
    const cleared = await request('/homepage', {
      method: 'PATCH',
      user,
      body: {
        version: saved.version,
        slots: [{ key: 'collection-kids', desktopImageId: null, mobileImageId: null }],
      },
    })
    assert.deepEqual(
      cleared.slots.find((slot) => slot.key === 'collection-kids'),
      {
        ...savedKids,
        desktopImage: null,
        mobileImage: null,
      },
    )
  } finally {
    for (const image of uploaded) URL.revokeObjectURL(image.url)
  }
})
test('staff creation validates UTF8 passwords and never exposes password in DTO', async () => {
  const request = createStaffContentFixture(),
    body = {
      name: 'Test moderator',
      email: 'staff@example.test',
      phone: '+201001234567',
      password: 'Temporary123',
      role: 'moderator',
    }
  assert.throws(() => createAccountPayload({ ...body, password: 'ع'.repeat(40) }))
  const created = await request('/users', {
    method: 'POST',
    body: { ...body, email: 'new@example.test' },
    user,
  })
  assert.equal(created.emailVerified, true)
  assert.equal(createdAccount(created, 'b2c', { ...body, email: 'new@example.test' }), created)
  for (const changed of [
    null,
    { ...created, store: 'b2b' },
    { ...created, role: 'admin' },
    { ...created, emailVerified: false },
    { ...created, createdAt: null },
  ])
    assert.throws(() => createdAccount(changed, 'b2c', { ...body, email: 'new@example.test' }), {
      code: 'INVALID_RESPONSE',
    })
  assert.equal(Object.hasOwn(created, 'password'), false)
  await assert.rejects(
    request('/users', { method: 'POST', body, user: { ...user, role: 'admin' } }),
    { code: 'FORBIDDEN' },
  )
  assert.equal(unknownWrite({ code: 'INVALID_RESPONSE', status: 201 }), true)
})
test('B2C notification receipts are per staff and idempotent', async () => {
  const request = createStaffContentFixture(),
    list = await request('/notifications', { user }),
    item = list.items[0],
    path = `/notifications/${item.id}/read`
  assert.equal(list.unreadCount, 3)
  const marked = await request(path, { method: 'PATCH', user }),
    repeat = await request(path, { method: 'PATCH', user })
  assert.equal(marked.readAt, repeat.readAt)
  assert.equal((await request('/notifications/unread-count', { user })).unreadCount, 2)
  assert.equal(
    (await request('/notifications/unread-count', { user: { ...user, id: 'other' } })).unreadCount,
    3,
  )
})
test('homepage versions and image target binding preserve saved state on conflict', async () => {
  const request = createStaffContentFixture(),
    home = await request('/homepage', { user })
  const image = await request('/homepage/media/hero-left/desktop', {
    method: 'POST',
    body: new Blob(['local']),
    user,
  })
  await assert.rejects(
    request('/homepage', {
      method: 'PATCH',
      body: { version: 0, slots: [{ key: 'hero-right', desktopImageId: image.id }] },
      user,
    }),
    { code: 'MEDIA_CONFLICT' },
  )
  const saved = await request('/homepage', {
    method: 'PATCH',
    body: { version: 0, slots: [{ key: 'hero-left', desktopImageId: image.id }] },
    user,
  })
  assert.equal(saved.version, 1)
  assert.equal(saved.slots[0].desktopImage.id, image.id)
  await assert.rejects(
    request('/homepage', {
      method: 'PATCH',
      body: { version: home.version, slots: [{ key: 'hero-left', desktopImageId: null }] },
      user,
    }),
    { code: 'HOMEPAGE_CONFLICT' },
  )
  URL.revokeObjectURL(image.url)
})
