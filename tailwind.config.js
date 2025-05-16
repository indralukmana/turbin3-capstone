/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './app/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				// Vibrant but accessible colors
				primary: {
					50: '#eef9ff',
					100: '#dcf2ff',
					200: '#b3e7ff',
					300: '#66d3ff',
					400: '#1cb7ff', // Main action color (4.5:1 on black)
					500: '#0099e6',
					600: '#0077b3',
					700: '#005c8c',
					800: '#004166',
					900: '#002233',
				},
				accent: {
					50: '#fff1e5',
					100: '#ffe0cc',
					200: '#ffc299',
					300: '#ff944d',
					400: '#ff6600', // Secondary action color (4.8:1 on black)
					500: '#cc5200',
					600: '#993d00',
					700: '#662900',
					800: '#331400',
					900: '#1a0a00',
				},
				success: {
					50: '#ecfdf5',
					100: '#d1fae5',
					200: '#a7f3d0',
					300: '#6ee7b7',
					400: '#34d399', // Success indicators (5.2:1 on black)
					500: '#10b981',
					600: '#059669',
					700: '#047857',
					800: '#065f46',
					900: '#064e3b',
				},
				warning: {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24', // Warning indicators (4.5:1 on black)
					500: '#f59e0b',
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f',
				},
				surface: {
					50: '#fafafa',
					100: '#f4f4f5',
					200: '#e4e4e7',
					300: '#d4d4d8',
					400: '#a1a1aa',
					500: '#71717a',
					600: '#52525b',
					700: '#3f3f46',
					800: '#27272a', // Main background
					900: '#18181b', // Darker background
				},
			},
			fontFamily: {
				sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
			},
		},
	},
	plugins: [],
};
