import test from 'node:test'
import assert from 'node:assert/strict'
import { createApi } from '../lib/api.js'
import { createSession } from '../lib/session.js'
import { createInquiryApi } from '../../B2B-Website/src/features/inquiry/api.js'
import {
  createReviewInquiry,
  reviewDefinitions,
  reviewOffers,
} from '../../B2B-Website/src/features/inquiry/fixtures.js'
import {
  assertOriginalOwner,
  compositionRows,
  mergeReceipt,
  reconcileUpload,
  submissionPayload,
  validateDetails,
  validateSelections,
} from '../../B2B-Website/src/features/inquiry/model.js'

const id = (value) => value.toString(16).padStart(24, '0')
const validContact = () => ({
  name: '  Pat Example  ',
  phone: '+20 (100) 123-4567',
  email: '',
  governorate: '  Cairo ',
  district: ' Nasr City ',
})
const validAnswers = () => ({
  description: '  A short project brief  ',
  'has-design': false,
  quantity: 0,
})
const spinningForm = () => reviewDefinitions().find((item) => item.type === 'spinning')
const validState = (type = 'spinning') => ({
  type,
  form: reviewDefinitions().find((item) => item.type === type),
  contact: validContact(),
  answers: validAnswers(),
  draft: { draftId: id(1), draftToken: 'A'.repeat(43) },
  images: [{ id: id(2) }, { id: id(3), selected: false }],
  selections: [],
})

test('details allow an omitted optional email, numeric zero, and boolean false', () => {
  const form = spinningForm()
  assert.deepEqual(validateDetails(form, validContact(), validAnswers()), {})
  assert.deepEqual(
    validateDetails(form, { ...validContact(), email: undefined }, validAnswers()),
    {},
  )
})

test('details reject invalid types, choices, and field limits', () => {
  const form = spinningForm()
  const errors = validateDetails(
    form,
    { ...validContact(), email: 12 },
    {
      ...validAnswers(),
      quantity: '0',
      'has-design': 'false',
      'material-source': 'unsupported',
      support: ['samples', 'samples'],
      'project-name': 'x'.repeat(501),
    },
  )
  assert.equal(errors['contact.email'], 'email')
  assert.equal(errors['answers.quantity'], 'number')
  assert.equal(errors['answers.has-design'], 'choice')
  assert.equal(errors['answers.material-source'], 'choice')
  assert.equal(errors['answers.support'], 'choice')
  assert.equal(errors['answers.project-name'], 'length')
  assert.equal(
    validateDetails(form, validContact(), { ...validAnswers(), description: 'x'.repeat(5001) })[
      'answers.description'
    ],
    'length',
  )
})

test('submission payload trims values, normalizes contact fields, and contains only stable keys', () => {
  const state = validState()
  state.contact.extra = 'must not be sent'
  state.answers.extra = 'must not be sent'
  state.answers['project-name'] = '  Spring line  '
  state.answers['material-source'] = 'discuss'
  state.answers.support = []

  const payload = submissionPayload(state)
  assert.deepEqual(Object.keys(payload), [
    'draftId',
    'formVersion',
    'contact',
    'answers',
    'imageIds',
    'wholesaleRequests',
  ])
  assert.deepEqual(payload.contact, {
    name: 'Pat Example',
    phone: '+201001234567',
    email: null,
    governorate: 'Cairo',
    district: 'Nasr City',
  })
  assert.deepEqual(payload.answers, {
    description: 'A short project brief',
    'has-design': false,
    quantity: 0,
    'project-name': 'Spring line',
    'material-source': 'discuss',
  })
  assert.deepEqual(payload.imageIds, [id(2)])
  assert.deepEqual(payload.wholesaleRequests, [])
  assert.deepEqual(
    Object.keys(payload.contact),
    state.form.fixedFields.map((field) => field.key),
  )
})

test('wholesale payload includes only each offer id, version, and requested pouch quantity', () => {
  const offer = reviewOffers()[0]
  const state = validState('wholesale')
  state.selections = [{ offer, quantity: 2 }]
  const payload = submissionPayload(state)
  assert.deepEqual(payload.wholesaleRequests, [
    { offerId: offer.id, version: offer.version, quantity: 2 },
  ])
})

test('whole-pouch quantities accept 1 through 10000 and reject invalid counts, duplicates, and more than ten offers', () => {
  const offers = reviewOffers()
  const entry = (offer, quantity) => ({ offer, quantity })
  assert.equal(validateSelections([entry(offers[0], 1)]), true)
  assert.equal(validateSelections([entry(offers[0], 10000)]), true)
  assert.equal(
    validateSelections(
      offers.map((offer, index) => entry({ ...offer, id: id(100 + index) }, 1)).slice(0, 10),
    ),
    true,
  )
  assert.equal(validateSelections([]), false)
  assert.equal(validateSelections([entry(offers[0], 0)]), false)
  assert.equal(validateSelections([entry(offers[0], 10001)]), false)
  assert.equal(validateSelections([entry(offers[0], 1.5)]), false)
  assert.equal(validateSelections([entry(offers[0], 1), entry(offers[0], 2)]), false)
  assert.equal(
    validateSelections(
      Array.from({ length: 11 }, (_, index) => entry({ ...offers[0], id: id(700 + index) }, 1)),
    ),
    false,
  )
  assert.equal(validateSelections([entry({ ...offers[0], isAvailable: false }, 1)]), false)
})

test('variant composition labels use the requested language and real option values', () => {
  const offer = reviewOffers()[2]
  assert.deepEqual(
    compositionRows(offer, 'en').map((row) => row.selection),
    [
      'Color: Navy · Size: S',
      'Color: Navy · Size: M',
      'Color: Navy · Size: L',
      'Color: Navy · Size: XL',
    ],
  )
  assert.deepEqual(
    compositionRows(offer, 'ar').map((row) => row.selection),
    [
      'اللون: كحلي · المقاس: S',
      'اللون: كحلي · المقاس: M',
      'اللون: كحلي · المقاس: L',
      'اللون: كحلي · المقاس: XL',
    ],
  )
})

test('receipt replay keeps original guest tracking credentials only for the same lead', () => {
  const previous = {
    lead: { id: id(20) },
    trackingToken: 'private-token',
    trackingExpiresAt: '2030-01-01T00:00:00.000Z',
  }
  const replay = mergeReceipt(previous, {
    lead: { id: id(20) },
    trackingToken: null,
    trackingExpiresAt: null,
  })
  assert.equal(replay.trackingToken, previous.trackingToken)
  assert.equal(replay.trackingExpiresAt, previous.trackingExpiresAt)
  const different = mergeReceipt(previous, {
    lead: { id: id(21) },
    trackingToken: null,
    trackingExpiresAt: null,
  })
  assert.equal(different.trackingToken, null)
  assert.equal(different.trackingExpiresAt, null)
})

test('inquiry upload sends a raw Blob with draft and auth headers, while guest uploads stay unauthenticated', async () => {
  const session = createSession('b2b')
  session.accept({
    user: { id: 'owner-a', store: 'b2b', role: 'user', name: 'Owner A' },
    accessToken: 'access-a',
    expiresIn: 900,
  })
  const calls = []
  const api = createApi(
    { store: 'b2b', mode: 'live', apiOrigin: 'https://api.example.test' },
    {
      getToken: () => session.getSnapshot().accessToken,
      fetcher: async (url, options) => {
        calls.push({ url, options })
        return Response.json({
          success: true,
          code: 'OK',
          message: 'OK',
          data: { id: id(30), width: 1200, height: 800 },
          requestId: 'test-id',
        })
      },
    },
  )
  const inquiry = createInquiryApi({ api, session, config: { mode: 'live' } }, () => 'ar')
  const draft = { draftId: id(31), draftToken: 'B'.repeat(43) }
  const image = new Blob(['image bytes'], { type: 'image/png' })

  await inquiry.upload(draft, image, 'owner-a')
  const ownerCall = calls.at(-1)
  assert.equal(
    ownerCall.url,
    `https://api.example.test/api/v1/b2b/leads/drafts/${draft.draftId}/images`,
  )
  assert.equal(ownerCall.options.method, 'POST')
  assert.equal(ownerCall.options.body, image)
  assert.ok(ownerCall.options.body instanceof Blob)
  assert.equal(ownerCall.options.headers.get('Content-Type'), 'image/png')
  assert.equal(ownerCall.options.headers.get('X-Lead-Draft-Token'), draft.draftToken)
  assert.equal(ownerCall.options.headers.get('Authorization'), 'Bearer access-a')
  assert.equal(ownerCall.options.headers.get('X-Language'), 'ar')

  await inquiry.upload({ draftId: id(32), draftToken: 'C'.repeat(43) }, image, null)
  const guestCall = calls.at(-1)
  assert.equal(guestCall.options.headers.get('Authorization'), null)
  assert.equal(guestCall.options.headers.get('X-Lead-Draft-Token'), 'C'.repeat(43))
})

test('inquiry API rejects draft access from an account other than the original owner', async () => {
  const session = createSession('b2b')
  session.accept({
    user: { id: 'owner-a', store: 'b2b', role: 'user', name: 'Owner A' },
    accessToken: 'access-a',
    expiresIn: 900,
  })
  let calls = 0
  const inquiry = createInquiryApi(
    {
      api: {
        request: async () => {
          calls++
        },
      },
      session,
      config: { mode: 'live' },
    },
    () => 'en',
  )
  assert.throws(
    () => inquiry.readDraft({ draftId: id(40), draftToken: 'D'.repeat(43) }, 'owner-b'),
    { code: 'ORIGINAL_SESSION_REQUIRED', status: 401 },
  )
  assert.equal(calls, 0)
  assert.throws(() => assertOriginalOwner('owner-b', session.getSnapshot().user), {
    code: 'ORIGINAL_SESSION_REQUIRED',
    status: 401,
  })
})

test('wholesale guides use public B2C detail without forwarding the B2B token or reading native products', async (t) => {
  const calls = [],
    chart = {
      id: id(88),
      name: 'دليل المقاسات',
      measurements: { unit: 'cm', rows: [{ size: 'S', chest: 50, length: 66, sleeve: 60 }] },
      image: null,
    }
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options })
    return Response.json({ success: true, code: 'OK', data: { sizeChart: chart } })
  })
  const session = createSession('b2b')
  session.accept({
    user: { id: 'owner-a', store: 'b2b', role: 'user', name: 'Owner A' },
    accessToken: 'b2b-token',
    expiresIn: 900,
  })
  const inquiry = createInquiryApi(
    {
      api: {
        request: () => {
          throw new Error('Wrong store API')
        },
      },
      session,
      config: { mode: 'live', apiOrigin: 'https://api.example.test' },
    },
    () => 'ar',
  )
  assert.equal(await inquiry.sizeChart({ sourceStore: 'b2b', productId: id(4) }), null)
  assert.equal(calls.length, 0)
  const controller = new AbortController()
  assert.deepEqual(
    await inquiry.sizeChart({ sourceStore: 'b2c', productId: id(4) }, controller.signal),
    chart,
  )
  assert.equal(calls[0].url, `https://api.example.test/api/v1/b2c/products/${id(4)}`)
  assert.equal(calls[0].options.headers.get('Authorization'), null)
  assert.equal(calls[0].options.headers.get('X-Language'), 'ar')
  assert.equal(calls[0].options.signal, controller.signal)
  await assert.rejects(inquiry.sizeChart({ sourceStore: 'b2c', productId: '../invalid' }), {
    code: 'VALIDATION_ERROR',
  })
})

test('review fixtures preserve exact replay ownership and guest tracking expiry', async () => {
  let now = Date.UTC(2026, 0, 1)
  const review = createReviewInquiry({ now: () => now })
  const form = await review.form('spinning', 'en')
  const draft = await review.prepare('spinning', null)
  const body = submissionPayload({ ...validState(), form, draft, images: [] })
  const first = await review.submit(draft, body, null, 'en')
  const replay = await review.submit(draft, body, null, 'ar')
  assert.equal(replay.lead.id, first.lead.id)
  assert.equal(replay.trackingToken, first.trackingToken)
  assert.equal(replay.trackingExpiresAt, new Date(now + 90 * 86400000).toISOString())
  assert.equal((await review.track(first.lead.id, first.trackingToken, 'ar')).form.title, 'الغزل')
  await assert.rejects(
    review.submit(
      draft,
      { ...body, answers: { ...body.answers, description: 'Changed' } },
      null,
      'en',
    ),
    { code: 'LEAD_REQUEST_CONFLICT' },
  )
  now += 2 * 86400000
  assert.equal((await review.submit(draft, body, null, 'en')).lead.id, first.lead.id)
  now += 88 * 86400000
  await assert.rejects(review.track(first.lead.id, first.trackingToken, 'en'), {
    code: 'LEAD_NOT_FOUND',
    status: 404,
  })
  await assert.rejects(review.submit(draft, body, null, 'en'), {
    code: 'LEAD_NOT_FOUND',
    status: 404,
  })
})

test('review fixture history and detail remain scoped to the original account', async () => {
  const review = createReviewInquiry()
  const makeLead = async (owner) => {
    const form = await review.form('spinning', 'en')
    const draft = await review.prepare('spinning', owner)
    const body = submissionPayload({ ...validState(), form, draft, images: [] })
    return { draft, body, receipt: await review.submit(draft, body, owner, 'en') }
  }
  const first = await makeLead('owner-a')
  const replay = await review.submit(first.draft, first.body, 'owner-a', 'ar')
  assert.equal(replay.lead.id, first.receipt.lead.id)
  assert.equal(replay.trackingToken, null)
  await assert.rejects(review.readDraft(first.draft, 'owner-b'), {
    code: 'LEAD_DRAFT_UNAVAILABLE',
    status: 409,
  })
  const second = await makeLead('owner-b')
  assert.equal(first.receipt.trackingToken, null)
  assert.equal(first.receipt.trackingExpiresAt, null)
  assert.deepEqual(
    (await review.history({}, 'owner-a', 'en')).items.map((item) => item.id),
    [first.receipt.lead.id],
  )
  await assert.rejects(review.detail(first.receipt.lead.id, 'owner-b', 'en'), {
    code: 'LEAD_NOT_FOUND',
    status: 404,
  })
  assert.equal(
    (await review.detail(first.receipt.lead.id, 'owner-a', 'en')).id,
    first.receipt.lead.id,
  )
  assert.deepEqual(
    (await review.history({}, 'owner-b', 'en')).items.map((item) => item.id),
    [second.receipt.lead.id],
  )
})

test('upload reconciliation stops once an upload appears and never starts another upload', async () => {
  const before = [id(50)],
    image = { id: id(51) }
  let reads = 0,
    waits = 0,
    uploads = 0
  const api = {
    async readDraft() {
      reads++
      return { images: reads === 1 ? [] : [image], uploadingCount: 1 }
    },
    async upload() {
      uploads++
    },
  }
  const result = await reconcileUpload(api, { draftId: id(52) }, null, before, {
    attempts: 4,
    wait: async () => {
      waits++
    },
  })
  assert.deepEqual(result.added, [image])
  assert.equal(reads, 2)
  assert.equal(waits, 1)
  assert.equal(uploads, 0)
})

test('upload reconciliation returns when ready and stays bounded while the draft remains busy', async () => {
  let reads = 0,
    waits = 0,
    uploads = 0
  const api = {
    async readDraft() {
      reads++
      return { images: [], uploadingCount: 0 }
    },
    async upload() {
      uploads++
    },
  }
  const ready = await reconcileUpload(api, {}, null, [], {
    attempts: 4,
    wait: async () => {
      waits++
    },
  })
  assert.equal(ready.uploadingCount, 0)
  assert.equal(reads, 1)
  assert.equal(waits, 0)

  reads = 0
  const pendingApi = {
    ...api,
    async readDraft() {
      reads++
      return { images: [], uploadingCount: 1 }
    },
  }
  const pending = await reconcileUpload(pendingApi, {}, null, [], {
    attempts: 2,
    wait: async () => {
      waits++
    },
  })
  assert.equal(pending.uploadingCount, 1)
  assert.deepEqual(pending.added, [])
  assert.equal(reads, 2)
  assert.equal(waits, 1)
  assert.equal(uploads, 0)
})
