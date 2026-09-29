import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import test from 'node:test'
import { findAdminByEmail, normalizeAdminEmail, seedInitialAdmin, verifyAdminCredentials } from '../adminAuthentication.js'

const makeAdmin = (email, password) => ({
  id: 'test-admin',
  email,
  role: 'admin',
  passwordHash: bcrypt.hashSync(password, 10)
})

test('login email lookup trims whitespace and ignores email casing', () => {
  const admin = makeAdmin('Admin@Example.test', 'correct-horse')
  assert.equal(normalizeAdminEmail('  ADMIN@example.test  '), 'admin@example.test')
  assert.equal(findAdminByEmail([admin], '  ADMIN@example.test  '), admin)
})

test('login verifies the unchanged password against existing bcrypt hashes', () => {
  const admin = makeAdmin('Admin@Example.test', 'correct-horse')
  const original = JSON.stringify(admin)

  assert.equal(verifyAdminCredentials([admin], ' admin@example.test ', 'correct-horse'), admin)
  assert.equal(verifyAdminCredentials([admin], 'admin@example.test', 'wrong-password'), null)
  assert.equal(verifyAdminCredentials([admin], 'admin@example.test', 'CORRECT-HORSE'), null)
  assert.equal(verifyAdminCredentials([admin], 'admin@example.test', ' correct-horse '), null)
  assert.equal(verifyAdminCredentials([admin], 'unknown@example.test', 'correct-horse'), null)
  assert.equal(JSON.stringify(admin), original)
})

test('login rejects malformed account data without exposing or mutating it', () => {
  const malformed = { email: 'admin@example.test', passwordHash: 'not-a-bcrypt-hash' }
  const original = JSON.stringify(malformed)
  assert.equal(verifyAdminCredentials([malformed], 'admin@example.test', 'anything'), null)
  assert.equal(verifyAdminCredentials([{ email: 'admin@example.test', passwordHash: 123 }], 'admin@example.test', 'anything'), null)
  assert.equal(verifyAdminCredentials([malformed], 'admin@example.test', 42), null)
  assert.equal(JSON.stringify(malformed), original)
})

test('production first-admin seeding rejects missing configuration without hashing', () => {
  let hashCalls = 0
  for (const configuration of [
    { email: '', password: '' },
    { email: 'admin@example.test', password: '' },
    { email: '', password: 'test-only-password' }
  ]) {
    const result = seedInitialAdmin({
      admins: [],
      ...configuration,
      production: true,
      createHash: () => { hashCalls += 1; return 'unused-test-hash' },
      createId: () => 'unused-test-id',
      createdAt: '2026-01-01T00:00:00.000Z'
    })
    assert.deepEqual(result, { error: 'missing_configuration' })
  }
  assert.equal(hashCalls, 0)
})

test('configured environment values never overwrite existing admin records', () => {
  const existing = makeAdmin('existing@example.test', 'existing-only-password')
  const admins = [existing]
  let hashCalls = 0
  const result = seedInitialAdmin({
    admins,
    email: 'new@example.test',
    password: 'new configured password',
    production: true,
    createHash: () => { hashCalls += 1; return 'new-test-hash' },
    createId: () => 'new-test-id',
    createdAt: '2026-01-01T00:00:00.000Z'
  })

  assert.equal(result.admins, admins)
  assert.equal(result.admins[0], existing)
  assert.equal(hashCalls, 0)
})
