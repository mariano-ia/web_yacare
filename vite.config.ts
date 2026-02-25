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
                'work-edtech-hub': resolve(__dirname, 'work/edtech-hub.html'),
                'work-fintech-app': resolve(__dirname, 'work/fintech-app.html'),
                'work-nawaiam': resolve(__dirname, 'work/nawaiam.html'),
                'work-neurocloud': resolve(__dirname, 'work/neurocloud.html'),
                'work-pharma-lab': resolve(__dirname, 'work/pharma-lab.html'),
                'work-shopstream': resolve(__dirname, 'work/shopstream.html'),
                'work-vintage-app': resolve(__dirname, 'work/vintage-app.html'),
                about: resolve(__dirname, 'about.html'),
                contact: resolve(__dirname, 'contact.html'),
                blog: resolve(__dirname, 'blog.html'),
                'blog-why-most-user-research-is-useless': resolve(__dirname, 'blog/why-most-user-research-is-useless.html'),
                'privacy-policy': resolve(__dirname, 'privacy-policy.html'),
                'terms-and-conditions': resolve(__dirname, 'terms-and-conditions.html'),
                'elpantano': resolve(__dirname, 'elpantano/index.html'),
                'elpantano-la-ia': resolve(__dirname, 'elpantano/la-ia-no-va-a-robar-tu-trabajo.html'),
            },
        },
    },
})
