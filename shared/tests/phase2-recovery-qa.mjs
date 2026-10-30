import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import {
  localizedForm,
  localizedOffer,
  reviewDefinitions,
  reviewOffers,
} from '../../B2B-Website/src/features/inquiry/fixtures.js'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.NARMER_PLAYWRIGHT_PATH)
const origin = 'http://127.0.0.1:5294'
const output = resolve('output/playwright/phase-2-recovery')
await mkdir(output, { recursive: true })
const checks = [],
  failures = [],
  calls = []
const id = (n) => String(n).padStart(24, '0')
const definitions = reviewDefinitions()
const offers = reviewOffers()
let draftSeq = 700,
  leadSeq = 800,
  currentVersion = 3,
  failNextSubmit = false,
  form404 = false,
  conflictNext = false,
  uncertainUpload = false,
  resend429 = false,
  submit429 = false,
  registerOtp = '012345'
let offerVersion = 2,
  wholesaleConflict = false,
  expiredDraft = false,
  emptyOffers = false,
  missingOffer = false
let holdNextSubmit = false,
  releaseSubmit
const drafts = new Map(),
  leads = new Map(),
  submittedByDraft = new Map(),
  uploadBytes = []
const ok = (data) => ({ success: true, code: 'OK', message: 'OK', data, requestId: 'qa-request' })
const fail = (code, message = code) => ({
  success: false,
  code,
  message,
  errors: [],
  requestId: 'qa-request',
})
const formFor = (type) =>
  localizedForm(
    definitions.find((form) => form.type === type),
    'en',
  )
const offerDto = () => localizedOffer({ ...offers[0], version: offerVersion }, 'en')
const leadDto = (body, leadId) => ({
  id: leadId,
  formType: body.formType || 'fabric',
  status: 'submitted',
  contact: body.contact,
  form: formFor(body.formType || 'fabric'),
  answers: body.answers,
  wholesaleRequests: body.wholesaleRequests.map((selection) => ({
    ...offerDto(),
    quantity: selection.quantity,
  })),
  imageCount: body.imageIds.length,
  createdAt: new Date().toISOString(),
  contactedAt: null,
})
const response = (route, status, body, headers = {}) =>
  route.fulfill({
    status,
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
page.setDefaultTimeout(6000)
page.setDefaultNavigationTimeout(10000)
page.on('pageerror', (error) => failures.push({ id: 'runtime-error', error: error.message }))
await page.route('**/api/v1/**', async (route) => {
  const request = route.request(),
    url = new URL(request.url()),
    path = url.pathname.replace(/^\/api\/v1\/b2b/, '')
  calls.push({
    path,
    method: request.method(),
    headers: request.headers(),
    postData: request.postData(),
    resourceType: request.resourceType(),
  })
  if (path === '/forms' && request.method() === 'GET')
    return response(
      route,
      200,
      ok({
        items: definitions.filter((item) => item.isActive).map((item) => localizedForm(item, 'en')),
        supportedFieldTypes: ['text', 'textarea', 'number', 'select', 'multiselect', 'boolean'],
      }),
    )
  if (path.startsWith('/forms/') && request.method() === 'GET') {
    if (form404) return response(route, 404, fail('FORM_NOT_FOUND'))
    const form = formFor(decodeURIComponent(path.slice('/forms/'.length)))
    return response(route, 200, ok({ ...form, version: currentVersion }))
  }
  if (path.startsWith('/wholesale/offers/') && request.method() === 'GET')
    return missingOffer
      ? response(route, 404, fail('WHOLESALE_OFFER_NOT_FOUND'))
      : response(route, 200, ok(offerDto()))
  if (path === '/wholesale/offers' && request.method() === 'GET')
    return response(
      route,
      200,
      ok({
        items: emptyOffers ? [] : offers.map((item) => localizedOffer(item, 'en')),
        pagination: {
          page: 1,
          limit: 8,
          total: emptyOffers ? 0 : offers.length,
          pages: emptyOffers ? 0 : 1,
        },
      }),
    )
  if (path === '/leads/drafts' && request.method() === 'POST') {
    const body = request.postDataJSON(),
      draftId = id(++draftSeq),
      draftToken = 'A'.repeat(43)
    drafts.set(draftId, {
      draftId,
      draftToken,
      formType: body.formType,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      images: [],
    })
    return response(route, 201, {
      ...ok({
        draftId,
        draftToken,
        formType: body.formType,
        expiresAt: drafts.get(draftId).expiresAt,
      }),
      code: 'DRAFT_CREATED',
    })
  }
  const draftMatch = path.match(/^\/leads\/drafts\/([0-9a-f]{24})(?:\/images)?$/)
  if (draftMatch && request.method() === 'GET') {
    const draft = drafts.get(draftMatch[1])
    return draft
      ? response(
          route,
          200,
          ok({
            draftId: draft.draftId,
            formType: draft.formType,
            expiresAt: draft.expiresAt,
            images: draft.images,
            uploadingCount: 0,
          }),
        )
      : response(route, 404, fail('LEAD_DRAFT_UNAVAILABLE'))
  }
  if (draftMatch && request.method() === 'POST' && path.endsWith('/images')) {
    const draft = drafts.get(draftMatch[1])
    uploadBytes.push({
      body: request.postDataBuffer(),
      contentType: request.headers()['content-type'],
      headers: request.headers(),
    })
    const image = { id: id(900 + uploadBytes.length), width: 1, height: 1 }
    draft.images.push(image)
    if (uncertainUpload) {
      uncertainUpload = false
      return route.abort('failed')
    }
    return response(route, 201, ok(image))
  }
  if (path === '/leads' && request.method() === 'POST') {
    const body = request.postDataJSON()
    if (expiredDraft) {
      expiredDraft = false
      return response(route, 409, fail('LEAD_DRAFT_UNAVAILABLE'))
    }
    if (wholesaleConflict) {
      wholesaleConflict = false
      offerVersion++
      return response(route, 409, fail('WHOLESALE_CONFLICT'))
    }
    if (submit429) {
      submit429 = false
      return response(route, 429, fail('TOO_MANY_REQUESTS'), { 'retry-after': '2' })
    }
    if (conflictNext) {
      conflictNext = false
      currentVersion = 4
      return response(route, 409, fail('FORM_CONFLICT'))
    }
    const fingerprint = JSON.stringify(body),
      existing = submittedByDraft.get(body.draftId)
    if (existing) {
      assert.equal(fingerprint, existing.body, 'Replay changed the immutable request body')
      if (failNextSubmit) {
        failNextSubmit = false
        return route.abort('failed')
      }
      return response(route, 200, ok(existing.data))
    }
    const leadId = id(++leadSeq),
      draftId = body.draftId,
      token = 'AbCdEf0123456789AbCdEf0123456789AbCdEf01234'
    const data = {
      lead: leadDto({ ...body, formType: drafts.get(draftId)?.formType || 'fabric' }, leadId),
      trackingToken: request.headers()['authorization'] ? null : token,
      trackingExpiresAt: request.headers()['authorization']
        ? null
        : new Date(Date.now() + 90 * 86400000).toISOString(),
    }
    leads.set(leadId, { data, body: fingerprint })
    submittedByDraft.set(draftId, { data, body: fingerprint })
    if (holdNextSubmit) {
      holdNextSubmit = false
      await new Promise((done) => {
        releaseSubmit = done
      })
    }
    if (failNextSubmit) {
      failNextSubmit = false
      return route.abort('failed')
    }
    return response(route, 201, { ...ok(data), code: 'LEAD_CREATED' })
  }
  if (path.startsWith('/leads/tracking/') && request.method() === 'GET') {
    const leadId = path.slice('/leads/tracking/'.length),
      record = leads.get(leadId)
    if (record && request.headers()['x-lead-token'] === record.data.trackingToken)
      return response(route, 200, ok(record.data.lead))
    return response(route, 404, fail('LEAD_NOT_FOUND'))
  }
  if (path === '/leads' && request.method() === 'GET') {
    if (request.headers()['authorization'] !== 'Bearer opaque-qa-token')
      return response(route, 401, fail('UNAUTHORIZED'))
    return response(
      route,
      200,
      ok({
        items: [
          {
            id: id(990),
            formType: 'fabric',
            status: 'submitted',
            form: { title: 'PRIVATE-ACCOUNT-LEAD' },
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      }),
    )
  }
  if (path === '/auth/register' && request.method() === 'POST')
    return response(route, 201, {
      ...ok(null),
      code: 'OTP_REQUESTED',
      message: 'Check your email.',
    })
  if (path === '/auth/verify-email' && request.method() === 'POST') {
    const body = request.postDataJSON()
    return body.otp === registerOtp
      ? response(route, 200, { ...ok(null), code: 'EMAIL_CONFIRMED' })
      : response(route, 400, fail('INVALID_OTP'))
  }
  if (path === '/auth/login' && request.method() === 'POST')
    return response(
      route,
      200,
      ok({
        user: {
          id: '000000000000000000000001',
          store: 'b2b',
          name: 'Review Customer',
          email: 'qa@example.test',
          phone: '+201001234567',
          role: 'user',
          emailVerified: true,
        },
        accessToken: 'opaque-qa-token',
        expiresIn: 900,
      }),
      {
        'set-cookie':
          'narmer_refresh_b2b=aaaaaaaaaaaaaaaaaaaaaaaa.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; HttpOnly; SameSite=Lax; Path=/api/v1/b2b/auth',
      },
    )
  if (path === '/auth/refresh' && request.method() === 'POST') {
    if (!request.headers().cookie?.includes('narmer_refresh_b2b='))
      return response(route, 401, fail('UNAUTHORIZED'))
    return response(
      route,
      200,
      ok({
        user: {
          id: '000000000000000000000001',
          store: 'b2b',
          name: 'Review Customer',
          email: 'qa@example.test',
          phone: '+201001234567',
          role: 'user',
          emailVerified: true,
        },
        accessToken: 'opaque-qa-token',
        expiresIn: 900,
      }),
      {
        'set-cookie':
          'narmer_refresh_b2b=bbbbbbbbbbbbbbbbbbbbbbbb.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; HttpOnly; SameSite=Lax; Path=/api/v1/b2b/auth',
      },
    )
  }
  if (path === '/auth/forgot-password' && request.method() === 'POST')
    return response(route, 200, { ...ok(null), code: 'OTP_REQUESTED' })
  if (path === '/auth/reset-password' && request.method() === 'POST')
    return response(
      route,
      200,
      { ...ok(null), code: 'PASSWORD_RESET' },
      {
        'set-cookie':
          'narmer_refresh_b2b=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/api/v1/b2b/auth',
      },
    )
  if (path === '/auth/resend-otp' && request.method() === 'POST') {
    if (resend429) {
      resend429 = false
      return response(route, 429, fail('TOO_MANY_REQUESTS', 'Slow down'), { 'retry-after': '3' })
    }
    return response(route, 200, { ...ok(null), code: 'OTP_REQUESTED' })
  }
  if (path === '/auth/logout' && request.method() === 'POST')
    return response(route, 200, ok(null), {
      'set-cookie': 'narmer_refresh_b2b=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/api/v1/b2b/auth',
    })
  if (path === '/users/me/addresses' && request.method() === 'GET')
    return response(route, 200, ok([]))
  if (path === '/users/me' && request.method() === 'GET')
    return response(
      route,
      200,
      ok({
        id: '000000000000000000000001',
        store: 'b2b',
        name: 'Review Customer',
        email: 'qa@example.test',
        phone: '+201001234567',
        role: 'user',
        emailVerified: true,
      }),
    )
  return response(route, 404, fail('NOT_FOUND'))
})

async function proof(name, fn) {
  try {
    await fn()
    checks.push({ id: name, passed: true })
  } catch (error) {
    failures.push({ id: name, error: error.message })
    await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true }).catch(() => {})
  }
}
async function start(type = 'fabric') {
  await page.goto(`${origin}/en`)
  await page.evaluate(() => {
    sessionStorage.clear()
    localStorage.clear()
  })
  await page.goto(`${origin}/en/request?service=${type}`)
  await page.locator('#question-contact-name').waitFor()
}
async function fillRequired() {
  await page.locator('#question-contact-name').fill('Mariam Hassan')
  await page.locator('#question-contact-phone').fill('+201001234567')
  await page.locator('#question-contact-email').fill('mariam@example.test')
  await page.locator('#question-contact-governorate').fill('Cairo')
  await page.locator('#question-contact-district').fill('Nasr City')
  await page.locator('#question-answer-project-name').fill('School uniforms')
  await page.locator('#question-answer-description').fill('Please discuss materials and timing.')
  await page.locator('#question-answer-has-design').selectOption('no')
}
const reviewButton = () => page.getByRole('button', { name: 'Review your request', exact: true })
const sendButton = () => page.getByRole('button', { name: /Submit request|Check submission/ })
async function enterReview() {
  await fillRequired()
  await reviewButton().click()
  await page.waitForURL('**/en/request/review')
}

await proof('zero-false-and-required-values', async () => {
  await start()
  await fillRequired()
  await page.locator('#question-answer-quantity').fill('0')
  await page.locator('#question-answer-has-design').selectOption('no')
  await reviewButton().click()
  await page.waitForURL('**/en/request/review')
  assert.match(await page.locator('.request-snapshot').innerText(), /Requested quantity\s+0/)
  assert.match(await page.locator('.request-snapshot').innerText(), /No/)
  await sendButton().click()
  await page.waitForURL('**/en/request/received/**')
  const submitted = JSON.parse(leads.get(id(leadSeq)).body)
  assert.equal(submitted.answers.quantity, 0)
  assert.equal(submitted.answers['has-design'], false)
  assert.equal(submitted.formVersion, 3)
})

await proof('lost-submit-retains-exact-payload-across-navigation-and-reload', async () => {
  await start()
  await enterReview()
  const draftId = [...drafts.keys()].at(-1)
  failNextSubmit = true
  const leadCallsBefore = calls.filter(
    (call) => call.path === '/leads' && call.method === 'POST',
  ).length
  const existingLeadCount = leads.size
  await sendButton().click()
  await page.getByText('result is uncertain', { exact: false }).waitFor()
  const firstBody = calls
    .filter((call) => call.path === '/leads' && call.method === 'POST')
    .at(-1).postData
  await page.goto(`${origin}/en/request`)
  await page.getByRole('link', { name: 'Check the result' }).waitFor()
  await page.reload()
  await page.waitForURL('**/en/request')
  await page.getByRole('link', { name: 'Check the result' }).click()
  await page.waitForURL('**/en/request/review')
  const pendingButton = page.getByRole('button', { name: 'Check submission' })
  await pendingButton.click()
  await page.waitForURL('**/en/request/received/**')
  const leadCalls = calls.filter((call) => call.path === '/leads' && call.method === 'POST')
  assert.equal(leadCalls.length, leadCallsBefore + 2)
  assert.equal(leadCalls.at(-1).postData, firstBody)
  assert.equal(JSON.parse(firstBody).draftId, draftId)
  assert.equal(leads.size, existingLeadCount + 1)
})

await proof('form-conflict-requires-explicit-refresh-and-answer-review', async () => {
  currentVersion = 3
  conflictNext = true
  await start()
  await enterReview()
  const before = calls.filter((call) => call.path === '/leads' && call.method === 'POST').length
  await sendButton().click()
  await page.getByText('questions have changed', { exact: false }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Load current questions' }).count(), 1)
  await page.getByRole('button', { name: 'Load current questions' }).click()
  await page.waitForURL('**/en/request')
  await page.getByText('Review the changes', { exact: true }).waitFor()
  assert.equal(await page.locator('#question-answer-project-name').inputValue(), 'School uniforms')
  assert.equal(await page.locator('#question-answer-has-design').inputValue(), 'no')
  assert.equal(
    calls.filter((call) => call.path === '/leads' && call.method === 'POST').length,
    before + 1,
  )
  await page.getByRole('button', { name: 'I reviewed the current details' }).click()
  await reviewButton().click()
  await page.waitForURL('**/en/request/review')
  assert.equal(await sendButton().isEnabled(), true)
})

await proof('submit-429-retains-input-and-blocks-an-early-retry', async () => {
  await start()
  await enterReview()
  submit429 = true
  await sendButton().click()
  await page.getByText('Wait 2 seconds', { exact: false }).waitFor()
  assert.equal(await sendButton().isDisabled(), true)
  const before = calls.filter((call) => call.path === '/leads' && call.method === 'POST').length
  await page.waitForTimeout(250)
  assert.equal(
    calls.filter((call) => call.path === '/leads' && call.method === 'POST').length,
    before,
  )
  await page.waitForFunction(() => !document.querySelector('.inquiry-aside button')?.disabled)
  assert.match(await page.locator('.request-snapshot').innerText(), /Mariam Hassan/)
  await sendButton().click()
  await page.waitForURL('**/en/request/received/**')
})

await proof('all-five-questionnaires-and-wholesale-version-review', async () => {
  for (const type of ['spinning', 'weaving', 'fabric', 'school-uniforms', 'wholesale']) {
    await start(type)
    if (type === 'wholesale') {
      await page.goto(`${origin}/en/wholesale/offers/${offers[0].id}`)
      await page.locator('#offer-quantity').fill('2')
      await page.getByRole('button', { name: 'Add to request' }).click()
      await page.waitForURL('**/en/request')
    }
    await enterReview()
    if (type === 'wholesale') {
      wholesaleConflict = true
      await sendButton().click()
      await page.getByRole('button', { name: 'Review current offers' }).click()
      assert.equal(await sendButton().isDisabled(), true)
      await page.getByRole('button', { name: 'I reviewed the current details' }).click()
    }
    await sendButton().click()
    await page.waitForURL('**/en/request/received/**')
    const submitted = JSON.parse(leads.get(id(leadSeq)).body)
    assert.equal(leads.get(id(leadSeq)).data.lead.formType, type)
    assert.equal(submitted.wholesaleRequests.length, type === 'wholesale' ? 1 : 0)
    if (type === 'wholesale') assert.equal(submitted.wholesaleRequests[0].version, offerVersion)
  }
})

await proof('expired-draft-recovery-and-empty-unavailable-offers', async () => {
  await start()
  await enterReview()
  expiredDraft = true
  await sendButton().click()
  await page.getByRole('link', { name: 'Start a fresh draft with these details' }).click()
  await page.waitForURL('**/en/request')
  assert.equal(await page.locator('#question-contact-name').inputValue(), 'Mariam Hassan')
  emptyOffers = true
  await page.goto(`${origin}/en/wholesale`)
  await page.getByText('No offers available for these options', { exact: true }).waitFor()
  emptyOffers = false
  missingOffer = true
  await page.goto(`${origin}/en/wholesale/offers/${offers[0].id}`)
  await page.getByText('This offer is no longer available.', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Add to request' }).count(), 0)
  missingOffer = false
})

await proof('uncertain-upload-reconciles-raw-bytes-before-another-upload', async () => {
  uncertainUpload = true
  await start()
  await fillRequired()
  const bytes = Buffer.from('this is not a real image, but verifies byte-preserving transport')
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'reference.png', mimeType: 'image/png', buffer: bytes })
  await page.getByRole('button', { name: 'Check upload status' }).waitFor()
  assert.equal(uploadBytes.length > 0, true)
  assert.deepEqual(uploadBytes.at(-1).body, bytes)
  assert.equal(uploadBytes.at(-1).contentType, 'image/png')
  assert.equal(await page.getByRole('button', { name: 'Check upload status' }).isEnabled(), true)
  await page.getByRole('button', { name: 'Check upload status' }).click()
  await page.getByLabel('Include reference 1').waitFor()
  assert.equal(await page.getByLabel('Include reference 1').isChecked(), true)
  assert.equal(uploadBytes.length, 1)
})

await proof('inactive-form-has-explicit-unavailable-recovery', async () => {
  const beforeDrafts = calls.filter(
    (call) => call.path === '/leads/drafts' && call.method === 'POST',
  ).length
  form404 = true
  await page.goto(`${origin}/en`)
  await page.evaluate(() => {
    sessionStorage.clear()
    localStorage.clear()
  })
  await page.goto(`${origin}/en/request?service=weaving`)
  await page.getByText('This questionnaire is currently unavailable', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Try again' }).isEnabled(), true)
  assert.equal(
    calls.filter((call) => call.path === '/leads/drafts' && call.method === 'POST').length,
    beforeDrafts,
  )
  form404 = false
})

await proof('guest-tracking-fragment-is-stripped-and-token-is-header-only', async () => {
  await start()
  await enterReview()
  await sendButton().click()
  await page.waitForURL('**/en/request/received/**')
  const leadId = new URL(page.url()).pathname.split('/').at(-1)
  await page.goto(`${origin}/en/track/${leadId}#token=AbCdEf0123456789AbCdEf0123456789AbCdEf01234`)
  await page.locator('.request-snapshot').waitFor()
  assert.equal(new URL(page.url()).hash, '')
  const track = calls.filter((call) => call.path === `/leads/tracking/${leadId}`).at(-1)
  assert.equal(track.headers['x-lead-token'], 'AbCdEf0123456789AbCdEf0123456789AbCdEf01234')
  assert.equal(track.headers.authorization, undefined)
  assert.equal(track.postData, null)
  assert.equal(
    calls
      .filter((call) => call.path.startsWith('/leads/tracking/'))
      .some((call) => call.path.includes('token')),
    false,
  )
})

await proof('registration-verification-login-and-reset-keep-otp-as-string', async () => {
  await page.goto(`${origin}/en/account/register`)
  await page.locator('input[name=name]').fill('New Customer')
  await page.locator('input[name=email]').fill('new@example.test')
  await page.locator('input[name=phone]').fill('+201001234567')
  await page.locator('input[name=password]').fill('secure password')
  await page.locator('.auth-submit').click()
  await page.waitForURL('**/en/account/verify')
  await page.locator('input[name=otp]').fill('012345')
  await page.locator('.auth-submit').click()
  await page.waitForURL('**/en/account/login')
  const verification = calls.filter((call) => call.path === '/auth/verify-email').at(-1)
  assert.equal(JSON.parse(verification.postData).otp, '012345')
  await page.locator('input[name=email]').fill('new@example.test')
  await page.locator('input[name=password]').fill('secure password')
  await page.locator('.auth-submit').click()
  await page.waitForURL('**/en/account')
  await page.goto(`${origin}/en/account/forgot-password`)
  await page.locator('input[name=email]').fill('new@example.test')
  await page.locator('.auth-submit').click()
  await page.getByRole('link', { name: 'Enter the recovery code' }).click()
  await page.waitForURL('**/en/account/reset-password')
  await page.locator('input[name=otp]').fill('012345')
  await page.locator('input[name=password]').fill('updated secure password')
  await page.locator('.auth-submit').click()
  await page.waitForURL('**/en/account/login')
  const reset = calls.filter((call) => call.path === '/auth/reset-password').at(-1)
  assert.equal(JSON.parse(reset.postData).otp, '012345')
  assert.equal(Object.keys(JSON.parse(reset.postData)).sort().join(','), 'email,otp,password')
  await page.goto(`${origin}/en/account/profile`)
  await page.waitForURL('**/en/account/login')
})

await proof('resend-429-applies-actual-cooldown', async () => {
  resend429 = true
  await page.goto(`${origin}/en/account/register`)
  await page.locator('input[name=name]').fill('New Customer')
  await page.locator('input[name=email]').fill('cooldown@example.test')
  await page.locator('input[name=phone]').fill('+201001234567')
  await page.locator('input[name=password]').fill('secure password')
  await page.locator('.auth-submit').click()
  await page.waitForURL('**/en/account/verify')
  const resend = page.getByRole('button', { name: 'Resend code' })
  await resend.click()
  await page.getByText('Wait 3 seconds before trying again.', { exact: true }).waitFor()
  assert.equal(await resend.isDisabled(), true)
  const count = calls.filter((call) => call.path === '/auth/resend-otp').length
  await page.waitForTimeout(300)
  assert.equal(calls.filter((call) => call.path === '/auth/resend-otp').length, count)
})

await proof('account-history-uses-bearer-and-clears-on-logout', async () => {
  await page.goto(`${origin}/en/account/login`)
  await page.locator('input[name=email]').fill('qa@example.test')
  await page.locator('input[name=password]').fill('secure password')
  await page.locator('.auth-submit').click()
  await page.waitForURL('**/en/account')
  await page.goto(`${origin}/en/requests`)
  await page.getByText('PRIVATE-ACCOUNT-LEAD').waitFor()
  const history = calls.filter((call) => call.path === '/leads' && call.method === 'GET').at(-1)
  assert.equal(history.headers.authorization, 'Bearer opaque-qa-token')
  await start()
  await enterReview()
  failNextSubmit = true
  await sendButton().click()
  await page.getByText('result is uncertain', { exact: false }).waitFor()
  const firstBody = calls
    .filter((call) => call.path === '/leads' && call.method === 'POST')
    .at(-1).postData
  await page.reload()
  await page.getByRole('button', { name: 'Check submission' }).waitFor()
  await page.getByRole('button', { name: 'Check submission' }).click()
  await page.waitForURL('**/en/request/received/**')
  const replay = calls.filter((call) => call.path === '/leads' && call.method === 'POST').at(-1)
  assert.equal(replay.postData, firstBody)
  assert.equal(replay.headers.authorization, 'Bearer opaque-qa-token')
  await page.goto(`${origin}/en/account/profile`)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL('**/en')
  const countBefore = calls.filter((call) => call.path === '/leads' && call.method === 'GET').length
  await page.goto(`${origin}/en/requests`)
  await page.getByText('Sign in with a customer account to view history').waitFor()
  assert.equal(await page.getByText('PRIVATE-ACCOUNT-LEAD').count(), 0)
  assert.equal(
    calls.filter((call) => call.path === '/leads' && call.method === 'GET').length,
    countBefore,
  )
})

await proof('forgetting-a-draft-leaves-a-working-empty-questionnaire', async () => {
  await start()
  await fillRequired()
  await page.getByRole('button', { name: 'Forget draft', exact: true }).click()
  await page.locator('#question-contact-name').waitFor()
  assert.equal(await page.locator('#question-contact-name').inputValue(), '')
  await enterReview()
  assert.equal(await sendButton().isEnabled(), true)
})

await proof('a-late-submission-response-cannot-restore-private-data-after-logout', async () => {
  await page.goto(`${origin}/en/account/login`)
  await page.locator('input[name=email]').fill('qa@example.test')
  await page.locator('input[name=password]').fill('secure password')
  await page.locator('.auth-submit').click()
  await page.waitForURL('**/en/account')
  await start()
  await enterReview()
  holdNextSubmit = true
  await sendButton().click()
  await page.getByRole('button', { name: 'Checking…', exact: true }).waitFor()
  await page.evaluate(() => {
    history.pushState({}, '', '/en/account')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.waitForURL('**/en/account')
  await page.locator('.account-links a[href$="profile"]').click()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page.waitForURL('**/en')
  releaseSubmit()
  await page.locator('#question-contact-name').waitFor()
  await page.waitForTimeout(150)
  assert.equal(await page.locator('#question-contact-name').inputValue(), '')
  assert.equal(
    await page.getByText('Your request has already been sent', { exact: true }).count(),
    0,
  )
  assert.equal(await page.evaluate(() => sessionStorage.getItem('narmer:b2b:inquiry')), null)
})

await page.screenshot({ path: resolve(output, 'final.png'), fullPage: true }).catch(() => {})
await writeFile(
  resolve(output, 'results.json'),
  JSON.stringify(
    {
      checks,
      failures,
      requestCount: calls.length,
      apiIntercepted: true,
      uploadByteLength: uploadBytes[0]?.body.length || 0,
      note: 'All /api/v1/** requests were stubbed locally. No live backend or provider calls were made.',
    },
    null,
    2,
  ),
)
await context.close()
await browser.close()
console.log(JSON.stringify({ checks, failures, requestCount: calls.length }, null, 2))
assert.equal(
  failures.length,
  0,
  'Recovery QA found failures; see output/playwright/phase-2-recovery/results.json',
)
