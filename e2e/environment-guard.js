function assertE2eEnvironmentAllowed(environment = process.env) {
  if (environment.E2E_PROFILE !== 'development') {
    throw new Error('E2E tests require E2E_PROFILE=development.')
  }

  if (environment.SQUARE_ENVIRONMENT !== 'sandbox') {
    throw new Error('E2E tests require SQUARE_ENVIRONMENT=sandbox.')
  }
}

module.exports = { assertE2eEnvironmentAllowed }