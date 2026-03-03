/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                arena: {
                    bg: '#0a0a0a',
                    panel: '#141414',
                    border: '#222222',
                    accent: '#ffffff',
                    bull: '#22c55e',
                    bear: '#ef4444',
                    judge: '#a78bfa',
                }
            },
            fontFamily: {
                display: ['Space Grotesk', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
