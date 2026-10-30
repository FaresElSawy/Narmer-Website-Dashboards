import test from 'node:test'
import assert from 'node:assert/strict'
import { createAccountApi, normalizeEmail, normalizePhone } from '../features/account/api.js'
import { createApi } from '../lib/api.js'
import { createSession } from '../lib/session.js'

const config = { store: 'b2c', mode: 'live', apiOrigin: 'https://api.example.test' }
const success = (data) =>
  Response.json({ success: true, code: 'OK', message: 'OK', data, requestId: 'test-id' })

test('account API uses the store-relative Auth and Users contracts', async () => {
  const calls = [],
    session = createSession('b2c')
  session.accept({
    user: { id: 'u1', store: 'b2c', name: 'Demo', email: 'demo@example.test', role: 'user' },
    accessToken: 'opaque',
    expiresIn: 900,
  })
  const api = createApi(config, {
    getToken: () => session.getSnapshot().accessToken,
    fetcher: async (url, options) => {
      calls.push([url, options])
      return success(
        options.method === 'PATCH' && url.endsWith('/users/me')
          ? { ...session.getSnapshot().user, name: 'B' }
          : options.method === 'GET' && url.endsWith('/addresses')
            ? []
            : null,
      )
    },
  })
  const account = createAccountApi({ config, api, session })
  assert.equal(
    await account.register({
      name: 'A',
      email: 'a@example.test',
      phone: '+201001234567',
      password: 'correct horse',
    }),
    null,
  )
  assert.equal(await account.verifyEmail('a@example.test', '012345'), null)
  await account.profile()
  await account.updateProfile({ name: 'B' })
  await account.addresses()
  assert.equal(await account.createAddress({ label: 'Home' }), null)
  assert.equal(await account.updateAddress('aabbcc', { apartment: '12A' }), null)
  assert.equal(await account.deleteAddress('aabbcc'), null)
  assert.deepEqual(
    calls.map(([url]) => url.replace(config.apiOrigin, '')),
    [
      '/api/v1/b2c/auth/register',
      '/api/v1/b2c/auth/verify-email',
      '/api/v1/b2c/users/me',
      '/api/v1/b2c/users/me',
      '/api/v1/b2c/users/me/addresses',
      '/api/v1/b2c/users/me/addresses',
      '/api/v1/b2c/users/me/addresses/aabbcc',
      '/api/v1/b2c/users/me/addresses/aabbcc',
    ],
  )
  assert.equal(calls[0][1].credentials, 'include')
  assert.equal(calls[3][1].headers.get('Authorization'), 'Bearer opaque')
  assert.equal(calls[6][1].body, JSON.stringify({ apartment: '12A' }))
  assert.equal(session.getSnapshot().user.name, 'B')
  assert.equal(account.demo, false)
})

test('fixture account demonstrates registration, leading-zero OTP, profile and address flows in memory', async () => {
  const session = createSession('b2b'),
    account = createAccountApi({ config: { store: 'b2b', mode: 'fixtures' }, session, api: {} })
  assert.equal(
    await account.register({
      name: 'Test Buyer',
      email: 'test@example.test',
      phone: '+201001234567',
      password: 'correct horse',
    }),
    null,
  )
  await assert.rejects(account.verifyEmail('test@example.test', '12345'), {
    code: 'VALIDATION_ERROR',
  })
  await assert.rejects(account.verifyEmail('test@example.test', '1234567'), {
    code: 'VALIDATION_ERROR',
  })
  await account.verifyEmail('test@example.test', '012345')
  const login = await account.login({ email: 'test@example.test', password: 'correct horse' })
  assert.equal(login.user.store, 'b2b')
  assert.match(login.accessToken, /^memory-only-/)
  assert.equal(await account.profile().then((profile) => profile.email), 'test@example.test')
  await assert.rejects(account.updateProfile({ name: '  ' }), { code: 'VALIDATION_ERROR' })
  await assert.rejects(account.updateProfile({ phone: '+12' }), { code: 'VALIDATION_ERROR' })
  assert.equal((await account.profile()).name, 'Test Buyer')
  const address = await account.createAddress({
    label: 'Work',
    governorate: 'Giza',
    building: '12A',
    street: 'A Street',
  })
  assert.equal(address.building, '12A')
  assert.equal((await account.addresses()).length, 1)
  await account.updateAddress(address.id, { apartment: '5' })
  assert.equal((await account.addresses()).find((item) => item.id === address.id).apartment, '5')
  await account.updateAddress(address.id, { contactPhone: '   ' })
  assert.equal(
    (await account.addresses()).find((item) => item.id === address.id).contactPhone,
    null,
  )
  await assert.rejects(account.updateAddress(address.id, { apartment: 'x'.repeat(51) }), {
    code: 'VALIDATION_ERROR',
  })
  assert.equal((await account.addresses()).find((item) => item.id === address.id).apartment, '5')
  await account.deleteAddress(address.id)
  assert.equal((await account.addresses()).length, 0)
  await account.forgotPassword('test@example.test')
  await account.resetPassword({
    email: 'test@example.test',
    otp: '012345',
    password: 'a new secure password',
  })
  await assert.rejects(account.login({ email: 'test@example.test', password: 'correct horse' }), {
    code: 'INVALID_CREDENTIALS',
  })
  await account.login({ email: 'test@example.test', password: 'a new secure password' })
  assert.equal(normalizeEmail('  BUYER@Example.test '), 'buyer@example.test')
  assert.equal(normalizePhone('+20 (100) 123-4567'), '+201001234567')
  assert.equal(Object.hasOwn(session.getSnapshot(), 'otp'), false)
})

test('fixture mode never changes a staff session into a customer or grants address access', async () => {
  const session = createSession('b2c'),
    account = createAccountApi({ config: { store: 'b2c', mode: 'fixtures' }, session, api: {} })
  await account.login({ email: account.demoEmail, password: account.demoPassword })
  session.accept({
    user: { id: 'staff', store: 'b2c', name: 'Staff', email: 'staff@example.test', role: 'admin' },
    accessToken: 'memory-staff',
    expiresIn: 900,
  })
  await assert.rejects(account.addresses(), { code: 'FORBIDDEN', status: 403 })
  assert.equal(session.getSnapshot().user.role, 'admin')
})

test('fixture registrations do not replace existing profiles or share another account addresses', async () => {
  const session = createSession('b2c'),
    account = createAccountApi({ config: { store: 'b2c', mode: 'fixtures' }, session, api: {} })
  await account.register({
    name: 'Original',
    email: 'same@example.test',
    phone: '+201001234567',
    password: 'original password',
  })
  await account.register({
    name: 'Changed',
    email: 'same@example.test',
    phone: '+201009876543',
    password: 'changed password',
  })
  await account.verifyEmail('same@example.test', '012345')
  await account.login({ email: 'same@example.test', password: 'original password' })
  assert.equal((await account.profile()).name, 'Original')
  await account.createAddress({
    label: 'Home',
    governorate: 'Cairo',
    building: '1',
    street: 'Street',
  })
  await account.login({ email: account.demoEmail, password: account.demoPassword })
  assert.equal((await account.addresses()).length, 1)
  assert.equal((await account.addresses())[0].label, 'Home')
})

test('fixture state survives recreating the account service for the same session', async () => {
  const config = { store: 'b2c', mode: 'fixtures' },
    session = createSession('b2c')
  const first = createAccountApi({ config, session, api: {} })
  await first.register({
    name: 'Returning Buyer',
    email: 'returning@example.test',
    phone: '+201001234567',
    password: 'review password',
  })
  await first.verifyEmail('returning@example.test', '012345')
  await first.login({ email: 'returning@example.test', password: 'review password' })
  await first.createAddress({
    label: 'Flat',
    governorate: 'Cairo',
    building: '8',
    street: 'River Road',
  })
  first.setAuthCooldown(30)

  const second = createAccountApi({ config, session, api: {} })
  assert.equal(second, first)
  assert.equal(second.authCooldown(), 30)
  assert.equal((await second.profile()).name, 'Returning Buyer')
  assert.equal((await second.addresses()).find((address) => address.label === 'Flat').building, '8')
})

test('invalid fixture profile/address edits never change saved values', async () => {
  const session = createSession('b2b'),
    account = createAccountApi({ config: { store: 'b2b', mode: 'fixtures' }, session, api: {} })
  await account.login({ email: account.demoEmail, password: account.demoPassword })
  const before = await account.profile(),
    address = (await account.addresses())[0]
  for (const body of [
    { name: '' },
    { name: 'a'.repeat(101) },
    { phone: 'invalid' },
    { name: 'Changed', phone: '' },
  ])
    await assert.rejects(account.updateProfile(body), { code: 'VALIDATION_ERROR' })
  assert.deepEqual(await account.profile(), before)
  await assert.rejects(account.updateAddress(address.id, { label: 'Changed', street: '' }), {
    code: 'VALIDATION_ERROR',
  })
  assert.deepEqual((await account.addresses())[0], address)
  const cleared = await account.updateAddress(address.id, { contactPhone: '   ' })
  assert.equal(cleared.contactPhone, null)
  assert.equal(cleared.effectiveContactPhone, before.phone)
  await account.updateProfile({ name: 'Updated Buyer' })
  assert.equal(session.getSnapshot().user.name, 'Updated Buyer')
})

test('successful live password reset clears the current local identity', async () => {
  const session = createSession('b2b')
  session.accept({
    user: { id: 'buyer', store: 'b2b', role: 'user', name: 'Buyer' },
    accessToken: 'opaque',
    expiresIn: 900,
  })
  const account = createAccountApi({
    config: { mode: 'live' },
    api: { request: async () => null },
    session,
  })
  assert.equal(
    await account.resetPassword({
      email: 'buyer@example.test',
      otp: '012345',
      password: 'new secure password',
    }),
    null,
  )
  assert.equal(session.getSnapshot().user, null)
  assert.equal(session.getSnapshot().accessToken, null)
})
