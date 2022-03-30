export default {
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    testMatch: [
        '**/tests/unit/**/*.spec.[jt]s?(x)',
        '**/*.spec.[jt]s?(x)',
    ],
};
