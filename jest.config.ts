export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: [
    'text',
    'lcov',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 15,
      lines: 60,
      statements: 60,
    },
  },
  preset: 'ts-jest',
};
