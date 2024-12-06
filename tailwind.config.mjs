/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	darkMode: 'media',
	theme: {
		extend: {
			fontFamily: {
				sans: ["-apple-system", "BlinkMacSystemFont", "'Inter'", 'system-ui', 'sans-serif'],
			}
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
	],
};
