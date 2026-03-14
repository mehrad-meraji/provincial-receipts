// Global test setup — add any mocks or env vars needed across all tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test'
process.env.GITHUB_TOKEN = 'test-token'
process.env.CRON_SECRET = 'test-secret'
