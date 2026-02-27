/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: '#FDF6ED',
                teal: '#2D8B7E',
                amber: '#E8873A',
                lavender: '#7B6FA8',
                dustyRose: '#D4607A',
                skyBlue: '#4A90C4',
            },
            fontFamily: {
                lexend: ['Lexend', 'sans-serif'],
                opendyslexic: ['OpenDyslexic', 'sans-serif'],
            },
        },
    },
    plugins: [],
}