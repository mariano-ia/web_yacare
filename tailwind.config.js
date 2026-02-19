/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./services.html",
        "./about.html",
        "./contact.html",
        "./blog.html",
        "./work.html",
        "./services/**/*.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--bg-primary)',
                foreground: 'var(--text-primary)',
                accent: {
                    DEFAULT: 'var(--accent-primary)',
                    light: 'var(--accent-light)',
                    dark: 'var(--accent-dark)',
                },
            },
        },
    },
    plugins: [],
}
