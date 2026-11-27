import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const localHttps = process.env.VIMIS_LOCAL_HTTPS === 'true'
  ? {
      key: readFileSync(resolve(process.cwd(), '.local-https/server.key')),
      cert: readFileSync(resolve(process.cwd(), '.local-https/server.pem')),
    }
  : undefined;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
  server: {
    host: true,
    ...(localHttps ? { https: localHttps } : {}),
  },
});
