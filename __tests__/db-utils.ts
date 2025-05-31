import * as child_process from 'node:child_process'

export async function setupTestDatabase() {
	console.log('---- [Test Setup] ----')

	// Docker container
	try {
		child_process.execSync(
			'docker run --name pg-container --rm -d pg-image'
		)
		console.log('Running new Docker container...')
	} catch {
		// Try starting container
		child_process.execSync('docker start pg-container -d')
		console.log('Starting Docker container...')
	}

	// child_process.execSync(
	// 	'psql -U postgres -h localhost -p 5432 -d test_db -c "\\i ./public.schema.sql"'
	// )
}

export function cleanupTestDatabase() {
	console.log('---- [Test Teardown] ----')
	// Now kill and remove the container
	child_process.execSync('docker kill pg-container')
	console.log('Killed Docker container')
}

/*
    TEST DATA INSERTION
 */