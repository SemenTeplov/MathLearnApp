module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    testMatch: ['**/test/**/*.test.js'],
    collectCoverageFrom: [
        'js/logic/**/*.js',
        'js/service/**/*.js'
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80
        }
    }
};
