const requiredTestEnvironment = (name: string): string => {
	const value = process.env[name]
	if (!value) {
		throw new Error(`Missing required E2E environment variable: ${name}`)
	}
	return value
}

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
export const TEST_MEMBER_EMAIL = requiredTestEnvironment('E2E_TEST_EMAIL')
export const TEST_MEMBER_PASSWORD = requiredTestEnvironment('E2E_TEST_PASSWORD')
export const TEST_ADMIN_EMAIL = requiredTestEnvironment('E2E_ADMIN_EMAIL')
export const TEST_ADMIN_PASSWORD = requiredTestEnvironment('E2E_ADMIN_PASSWORD')
