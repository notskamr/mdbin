// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import markdownIntegration from '@astropub/md';


// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [tailwind(), markdownIntegration()],
  adapter: cloudflare({

  }),
  markdown: {
  },
  vite: {
    define: {
      "process.env.TURSO_DB_URL": JSON.stringify(process.env.TURSO_DB_URL),
      "process.env.TURSO_AUTH_TOKEN": JSON.stringify(process.env.TURSO_AUTH_TOKEN)
    },
    ssr: {
      noExternal: ['@astropub/md']
    }
  }
});