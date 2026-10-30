import { ApiError } from '../../lib/api.js'

const addressFields = [
  'label',
  'governorate',
  'district',
  'building',
  'street',
  'floor',
  'apartment',
  'details',
  'contactPhone',
]
const demoOtp = '012345'
const fixtureAccounts = new WeakMap()
const authCooldowns = new WeakMap()

export function normalizeEmail(value) {
  return value.trim().toLowerCase()
}
export function normalizePhone(value) {
  return value.trim().replace(/[ ()-]/g, '')
}

export function createAccountApi({ config, api, session }) {
  const authCooldown = () =>
    Math.max(0, Math.ceil(((authCooldowns.get(session) || 0) - Date.now()) / 1000))
  const setAuthCooldown = (seconds) => {
    if (Number.isFinite(seconds) && seconds > 0)
      authCooldowns.set(session, Date.now() + seconds * 1000)
  }
  if (config.mode !== 'fixtures')
    return {
      register: (body) => api.request('/auth/register', { method: 'POST', body }),
      resendOtp: (email) => api.request('/auth/resend-otp', { method: 'POST', body: { email } }),
      verifyEmail: (email, otp) =>
        api.request('/auth/verify-email', { method: 'POST', body: { email, otp } }),
      login: (body) => api.request('/auth/login', { method: 'POST', body }),
      forgotPassword: (email) =>
        api.request('/auth/forgot-password', { method: 'POST', body: { email } }),
      async resetPassword(body) {
        const result = await api.request('/auth/reset-password', { method: 'POST', body })
        session.clear()
        return result
      },
      profile: () => session.read(api, '/users/me'),
      async updateProfile(body) {
        const user = await api.request('/users/me', { method: 'PATCH', body, authenticated: true })
        session.updateUser(user)
        return user
      },
      addresses: () => session.read(api, '/users/me/addresses'),
      createAddress: (body) =>
        api.request('/users/me/addresses', { method: 'POST', body, authenticated: true }),
      updateAddress: (id, body) =>
        api.request(`/users/me/addresses/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body,
          authenticated: true,
        }),
      deleteAddress: (id) =>
        api.request(`/users/me/addresses/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          authenticated: true,
        }),
      authCooldown,
      setAuthCooldown,
      get demo() {
        return false
      },
    }

  const cached = fixtureAccounts.get(session)
  if (cached) return cached
  let users = [
    {
      id: 'review-customer',
      store: config.store,
      name: 'Mariam Hassan',
      email: 'mariam@example.test',
      phone: '+201001234567',
      role: 'user',
      emailVerified: true,
      password: 'NarmerDemo123',
      addresses: [
        {
          id: 'review-home',
          label: 'Home',
          governorate: 'Cairo',
          district: 'Nasr City',
          building: '12A',
          street: 'Main Street',
          floor: '2',
          apartment: '5',
          details: '',
          contactPhone: null,
        },
      ],
    },
  ]
  let addressId = 1
  const current = () => users.find((user) => user.id === session.getSnapshot().user?.id)
  const publishProfile = (user) => {
    const safe = Object.fromEntries(
      ['id', 'store', 'name', 'email', 'phone', 'role', 'emailVerified'].map((key) => [
        key,
        user[key],
      ]),
    )
    session.accept({ user: safe, accessToken: `memory-only-${user.id}`, expiresIn: 900 })
    return safe
  }
  const emailValid = (value) =>
    typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const validPassword = (value) =>
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 72 &&
    new TextEncoder().encode(value).length <= 72
  const otpValid = (value) => typeof value === 'string' && /^\d{6}$/.test(value)
  const fail = (code, status, message) => {
    throw new ApiError(code, { status, message })
  }
  const validateAddress = (body, create) => {
    const limits = {
      label: 100,
      governorate: 100,
      district: 100,
      building: 200,
      street: 200,
      floor: 50,
      apartment: 50,
      details: 1000,
    }
    for (const [field, limit] of Object.entries(limits))
      if (
        ((create && ['label', 'governorate', 'building', 'street'].includes(field)) ||
          Object.hasOwn(body, field)) &&
        (typeof body[field] !== 'string' ||
          (!body[field].trim() && ['label', 'governorate', 'building', 'street'].includes(field)) ||
          body[field].trim().length > limit)
      )
        fail('VALIDATION_ERROR', 422, 'Check the address fields.')
    if (
      Object.hasOwn(body, 'contactPhone') &&
      body.contactPhone !== null &&
      (typeof body.contactPhone !== 'string' ||
        (normalizePhone(body.contactPhone) &&
          !/^\+?\d{6,15}$/.test(normalizePhone(body.contactPhone))))
    )
      fail('VALIDATION_ERROR', 422, 'Check the address phone number.')
  }
  const account = {
    demo: true,
    demoEmail: 'mariam@example.test',
    demoPassword: 'NarmerDemo123',
    demoOtp,
    authCooldown,
    setAuthCooldown,
    async register(body) {
      const email = normalizeEmail(body.email)
      if (
        !String(body.name).trim() ||
        String(body.name).trim().length > 100 ||
        !emailValid(email) ||
        !/^\+?\d{6,15}$/.test(normalizePhone(body.phone)) ||
        !validPassword(body.password)
      )
        fail('VALIDATION_ERROR', 422, 'Check the registration fields.')
      let user = users.find((item) => item.email === email)
      if (!user) {
        user = {
          id: `review-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          store: config.store,
          name: String(body.name).trim(),
          email,
          phone: normalizePhone(body.phone),
          role: 'user',
          emailVerified: false,
          password: body.password,
          addresses: [],
        }
        users.push(user)
      }
      if (!user.emailVerified) user.verifyOtp = demoOtp
      return null
    },
    async resendOtp(email) {
      const user = users.find((item) => item.email === normalizeEmail(email))
      if (user && !user.emailVerified) user.verifyOtp = demoOtp
      return null
    },
    async verifyEmail(email, otp) {
      if (!otpValid(otp)) fail('VALIDATION_ERROR', 422, 'Enter the six-digit code.')
      const user = users.find((item) => item.email === normalizeEmail(email))
      if (!user || user.verifyOtp !== otp)
        fail('INVALID_OTP', 400, 'Use the review code shown on this page.')
      user.emailVerified = true
      delete user.verifyOtp
      return null
    },
    async login({ email, password }) {
      if (!emailValid(normalizeEmail(email)) || !validPassword(password))
        fail('VALIDATION_ERROR', 422, 'Check the email and password.')
      const user = users.find(
        (item) => item.email === normalizeEmail(email) && item.password === password,
      )
      if (!user) fail('INVALID_CREDENTIALS', 401, 'Review email or password did not match.')
      if (!user.emailVerified) fail('EMAIL_NOT_VERIFIED', 403, 'Confirm the review email first.')
      const safe = publishProfile(user)
      return { user: safe, accessToken: `memory-only-${user.id}`, expiresIn: 900 }
    },
    async forgotPassword(email) {
      const user = users.find((item) => item.email === normalizeEmail(email))
      if (user) user.resetOtp = demoOtp
      return null
    },
    async resetPassword({ email, otp, password }) {
      if (!otpValid(otp) || !validPassword(password))
        fail('VALIDATION_ERROR', 422, 'Check the code and password.')
      const user = users.find((item) => item.email === normalizeEmail(email))
      if (!user || user.resetOtp !== otp)
        fail('INVALID_OTP', 400, 'Use the review code shown on this page.')
      user.password = password
      delete user.resetOtp
      session.clear()
      return null
    },
    async profile() {
      const user = current()
      if (!user) fail('UNAUTHORIZED', 401, 'Sign in to view this review profile.')
      return Object.fromEntries(
        Object.entries(user).filter(
          ([key]) => !['password', 'verifyOtp', 'resetOtp', 'addresses'].includes(key),
        ),
      )
    },
    async updateProfile(body) {
      const user = current()
      if (!user) fail('UNAUTHORIZED', 401, 'Sign in again.')
      if (!Object.hasOwn(body, 'name') && !Object.hasOwn(body, 'phone'))
        fail('VALIDATION_ERROR', 422, 'Update a name or phone number.')
      const name =
          body.name === undefined
            ? undefined
            : typeof body.name === 'string'
              ? body.name.trim()
              : null,
        phone =
          body.phone === undefined
            ? undefined
            : typeof body.phone === 'string'
              ? normalizePhone(body.phone)
              : null
      if (
        (name !== undefined && (!name || name.length > 100)) ||
        (phone !== undefined && (!phone || !/^\+?\d{6,15}$/.test(phone)))
      )
        fail('VALIDATION_ERROR', 422, 'Check the profile fields.')
      if (name !== undefined) user.name = name
      if (phone !== undefined) user.phone = phone
      const profile = await this.profile()
      session.updateUser(profile)
      return profile
    },
    async addresses() {
      if (current()?.role !== 'user')
        fail('FORBIDDEN', 403, 'Saved addresses are for customer accounts.')
      return current().addresses.map((address) => ({
        ...address,
        effectiveContactPhone: address.contactPhone || current().phone,
      }))
    },
    async createAddress(body) {
      if (current()?.role !== 'user')
        fail('FORBIDDEN', 403, 'Saved addresses are for customer accounts.')
      validateAddress(body, true)
      const address = Object.fromEntries(
        addressFields.map((field) => [
          field,
          field === 'contactPhone'
            ? body[field] == null || !normalizePhone(body[field])
              ? null
              : normalizePhone(body[field])
            : String(body[field] ?? '').trim(),
        ]),
      )
      address.id = `review-address-${addressId++}`
      address.effectiveContactPhone = address.contactPhone || current().phone
      current().addresses.push(address)
      return { ...address }
    },
    async updateAddress(id, body) {
      if (current()?.role !== 'user')
        fail('FORBIDDEN', 403, 'Saved addresses are for customer accounts.')
      const address = current().addresses.find((item) => item.id === id)
      if (!address) fail('ADDRESS_NOT_FOUND', 404, 'Address not found.')
      const candidate = { ...address }
      validateAddress(body, false)
      for (const field of addressFields)
        if (Object.hasOwn(body, field))
          candidate[field] =
            field === 'contactPhone'
              ? body[field] == null || !normalizePhone(body[field])
                ? null
                : normalizePhone(body[field])
              : body[field].trim()
      if (['label', 'governorate', 'building', 'street'].some((key) => !candidate[key]))
        fail('VALIDATION_ERROR', 422, 'Required address fields cannot be blank.')
      candidate.effectiveContactPhone = candidate.contactPhone || current().phone
      Object.assign(address, candidate)
      return { ...address }
    },
    async deleteAddress(id) {
      if (current()?.role !== 'user')
        fail('FORBIDDEN', 403, 'Saved addresses are for customer accounts.')
      const index = current().addresses.findIndex((item) => item.id === id)
      if (index < 0) fail('ADDRESS_NOT_FOUND', 404, 'Address not found.')
      current().addresses.splice(index, 1)
      return null
    },
  }
  fixtureAccounts.set(session, account)
  return account
}
