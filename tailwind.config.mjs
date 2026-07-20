/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'media',
	theme: {
		extend: {
			fontFamily: {
				sans: ["-apple-system", "BlinkMacSystemFont", "'Inter'", 'system-ui', 'sans-serif'],
			},
			typography: {
				DEFAULT: {
					css: {
						// prose draws literal backticks around inline code by default
						'code::before': { content: 'none' },
						'code::after': { content: 'none' },
					},
				},
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
};
