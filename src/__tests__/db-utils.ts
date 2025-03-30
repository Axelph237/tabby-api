import * as child_process from 'node:child_process'
import { PGService } from '../services/postgres.service'
import { randomUUIDv7, sql, SQL } from 'bun'

const pgUser = process.env.PG_USER ?? 'postgres'
const pgPassword = process.env.PG_PASSWORD ?? 'postgres'
const pgHost = process.env.PG_HOST ?? 'localhost:5532'
const pgDatabase = process.env.PG_DATABASE ?? 'postgres'
const connectionUri = `postgresql://${pgUser}:${pgPassword}@${pgHost}/${pgDatabase}`

export let testPgService: PGService
export namespace dbState {
	export function snapshot() {
		child_process.execSync(
			'psql -U postgres -h localhost -p 5432 postgres -c "DROP DATABASE IF EXISTS test_db_backup WITH (FORCE);"'
		)
		child_process.execSync(
			'psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE test_db_backup;"'
		)
		child_process.execSync(
			'pg_dump -U postgres -h localhost -p 5432 test_db | psql -U postgres -h localhost -p 5432 test_db_backup'
		)
	}

	export function restore() {
		child_process.execSync(
			'psql -U postgres -h localhost -p 5432 postgres -c "DROP DATABASE IF EXISTS test_db WITH (FORCE);"'
		)
		child_process.execSync(
			'psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE test_db;"'
		)
		child_process.execSync(
			'pg_dump -U postgres -h localhost -p 5432 test_db_backup | psql -U postgres -h localhost -p 5432 test_db'
		)
	}
}

export async function setupTestDatabase() {
	console.log('---- [Test Setup] ----')

	// Docker container
	try {
		child_process.execSync(
			'docker run --name pg-container -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres -e POSTGRES_DB=test_db -p 5432:5432 -d postgres'
		)
		console.log('Running new Docker container...')
	} catch {
		// Try starting container
		child_process.execSync('docker start pg-container -d')
		console.log('Starting Docker container...')
	}

	// Create test_db
	try {
		child_process.execSync(
			'psql -U postgres -h localhost -p 5432 -d postgres -c "DROP DATABASE IF EXISTS test_db WITH (FORCE);"'
		)
		child_process.execSync(
			'psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE test_db;"'
		)
	} catch (e) {
		// Try deleting database then creating
		console.log(e)
	}

	child_process.execSync(
		'psql -U postgres -h localhost -p 5432 -d test_db -c "\\i ./schema.sql"'
	)

	await insertTestData()
	dbState.snapshot()

	// Run PGService
	testPgService = PGService.getInstance()
}

export function cleanupTestDatabase() {
	console.log('---- [Test Teardown] ----')
	child_process.execSync('docker kill pg-container')
	console.log('Killed Docker container')
	child_process.execSync('docker rm pg-container')
	console.log('Removed Docker container')

	child_process.execSync(
		'psql -U postgres -h localhost -p 5432 -d postgres -c "DROP DATABASE IF EXISTS test_db WITH (FORCE)"'
	)
}

/*
    TEST DATA INSERTION
 */

export const testUsers = [
	{ id: randomUUIDv7(), username: 'User 1' },
	{ id: randomUUIDv7(), username: 'User 2' },
	{ id: randomUUIDv7(), username: 'User 3' },
]
export const testMenus = [
	{ id: randomUUIDv7(), created_by: testUsers[0].id, name: 'Menu 1' },
	{ id: randomUUIDv7(), created_by: testUsers[1].id, name: 'Menu 2' },
]
export const testItems = [
	{
		name: 'Taco',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[0].id,
	},
	{
		name: 'Burrito',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[0].id,
	},
	{
		name: 'Nachos',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[0].id,
	},
	{
		name: 'Quesadilla',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[0].id,
	},
	{
		name: 'Chips',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[0].id,
	},
	{
		name: 'Burger',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[1].id,
	},
	{
		name: 'Pizza',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[1].id,
	},
	{
		name: 'Fries',
		description: null,
		img_url: null,
		base_price: 500,
		created_by: testUsers[1].id,
	},
]

export async function insertTestData() {
	const pool = new SQL(connectionUri)
	await pool.connect()

	await pool`CREATE TABLE public.users (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        username TEXT NOT NULL
    );`

	await pool`INSERT INTO public.users ${sql(testUsers)};`
	await pool`INSERT INTO public.menus ${sql(testMenus)};`
	await pool`INSERT INTO public.items ${sql(testItems)};`

	await pool`INSERT INTO public.menus_to_items (item_id, menu_id)
        SELECT items.id as item_id, menus.id as menu_id
        FROM public.users as users
        JOIN public.menus as menus ON menus.created_by = users.id
        JOIN public.items as items ON items.created_by = users.id;`

	await pool`INSERT INTO public.carts (created_by, menu_id)
        VALUES
            (${testUsers[2].id}, ${testMenus[0].id}),
            (${testUsers[2].id}, ${testMenus[1].id});`

	await pool`INSERT INTO public.cart_items (cart_id, item_id, count, unit_price)
        SELECT carts.id as cart_id, items.id as item_id, 10 as count, 5000
        FROM public.carts as carts
        JOIN public.menus as menus ON menus.id = carts.menu_id
        JOIN public.items as items ON menus.created_by = items.created_by;`
}
