import child_process from 'node:child_process'

export function cleanupTestDatabase() {
	console.log('---- [Test Teardown] ----')
	// Now kill and remove the container
	child_process.execSync('docker kill pg-container')
	console.log('Killed Docker container')
}