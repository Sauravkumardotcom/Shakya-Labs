import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveInitialState } from '../durablePersistence.js'

test('existing Neon app_state is used without consulting or overwriting JSON seed data', () => {
  const existingAdmin = { id: 'existing-admin', email: 'existing@example.test', passwordHash: 'opaque-test-hash' }
  const appState = { admins: [existingAdmin], jobs: [{ id: 'existing-job' }] }
  let seedReads = 0
  let adminSeeds = 0

  const state = resolveInitialState([{ data: appState }], { admins: [] }, () => {
    seedReads += 1
    return { admins: [{ id: 'env-seed-admin' }] }
  }, () => {
    adminSeeds += 1
    return [{ id: 'env-seed-admin' }]
  })

  assert.equal(state, appState)
  assert.equal(state.admins[0], existingAdmin)
  assert.equal(seedReads, 0)
  assert.equal(adminSeeds, 0)
})

test('empty Neon app_state initializes from default plus existing JSON seed', () => {
  const state = resolveInitialState([], { admins: [], jobs: [] }, () => ({ admins: [{ id: 'seed-admin' }], jobs: [{ id: 'seed-job' }] }))

  assert.deepEqual(state, { admins: [{ id: 'seed-admin' }], jobs: [{ id: 'seed-job' }] })
})

test('new Neon app_state seeds an admin only if JSON seed has no existing admins', () => {
  let adminSeedCalls = 0
  const preserved = resolveInitialState([], { admins: [], jobs: [] }, () => ({ admins: [{ id: 'json-admin' }], jobs: [] }), () => {
    adminSeedCalls += 1
    return [{ id: 'environment-admin' }]
  })
  assert.deepEqual(preserved.admins, [{ id: 'json-admin' }])
  assert.equal(adminSeedCalls, 0)

  const initialized = resolveInitialState([], { admins: [], jobs: [] }, () => ({ admins: [], jobs: [] }), () => {
    adminSeedCalls += 1
    return [{ id: 'environment-admin' }]
  })
  assert.deepEqual(initialized.admins, [{ id: 'environment-admin' }])
  assert.equal(adminSeedCalls, 1)
})