/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#37c5d7",
                "background-light": "#f6f8f8",
                "background-dark": "#121e20",
                // Custom palette
                "brand-blue": "#2B378A",
                "brand-red": "#D92323",
                "brand-teal": "#43BBCA",
                "brand-accent": "#23468C",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
        },
    },
    plugins: [],
}
