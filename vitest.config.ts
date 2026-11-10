import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            // Слои домена и UI — по группам; src/app/** (composition root)
            // и src/main.tsx намеренно вне include (D42/R9).
            include: [
                'src/core/**/*.ts',
                'src/data/**/*.ts',
                'src/services/**/*.ts',
                'src/components/**/*.tsx',
                'src/hooks/**/*.ts',
                'src/App.tsx'
            ],
            exclude: ['src/**/*.d.ts', 'src/main.tsx'],
            thresholds: {
                'src/core/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
                'src/data/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
                'src/services/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
                'src/components/**': { statements: 60, branches: 60, functions: 60, lines: 60 },
                'src/hooks/**': { statements: 60, branches: 60, functions: 60, lines: 60 },
                'src/App.tsx': { statements: 60, branches: 60, functions: 60, lines: 60 }
            }
        }
    }
});
