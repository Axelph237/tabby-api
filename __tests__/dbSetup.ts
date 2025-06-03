import * as child_process from 'node:child_process'

export async function setupTestDatabase() {
	console.log('---- [Test Setup] ----')

	// Docker container
	try {
		child_process.execSync(
			'docker run --name pg-container --rm -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5432:5432 -d pg-image'
		)
		console.log('Running new Docker container...')
	} catch {
		// Try starting container
		child_process.execSync('docker start pg-container')
		console.log('Starting Docker container...')
	}

	// child_process.execSync(
	// 	'psql -U postgres -h localhost -p 5432 -d test_db -c "SELECT * FROM ITEMS"'
	// )
}

/*
    TEST DATA INSERTION
 */