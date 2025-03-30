import { cleanupTestDatabase, dbState, setupTestDatabase } from './db-utils'
import { afterAll, beforeAll, beforeEach } from 'bun:test'

beforeAll(async () => {
	await setupTestDatabase()
})

afterAll(() => {
	cleanupTestDatabase()
})

beforeEach(() => {
	// dbState.restore();
})
