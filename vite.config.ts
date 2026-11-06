import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production-сборка 1.8.4: один JS + один CSS + три mp3 в dist/assets.
// base './' — работает и в корне домена, и в подпапке (GitHub Pages project page);
// в dev-режиме Vite сам приводит './' к '/'.
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        sourcemap: true,
        assetsInlineLimit: 0,
    },
});
