import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    root: '.',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                services: resolve(__dirname, 'services.html'),
                'discovery-sprint': resolve(__dirname, 'services/discovery-sprint.html'),
                'mvp-jumpstarter': resolve(__dirname, 'services/mvp-jumpstarter.html'),
                'product-growth': resolve(__dirname, 'services/product-growth.html'),
                work: resolve(__dirname, 'work.html'),
                about: resolve(__dirname, 'about.html'),
                contact: resolve(__dirname, 'contact.html'),
                blog: resolve(__dirname, 'blog.html'),
            },
        },
    },
})
