/// <reference types="vitest" />
import { IncomingMessage } from 'http';
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const API_ROUTES = [
  '/auth',
  '/roles',
  '/permissions',
  '/tickets',
  '/users',
  '/categories',
  '/subcategorias',
  '/departments',
  '/priorities',
  '/companies',
  '/documents',
  '/workflows',
  '/regions',
  '/zones',
  '/positions',
  '/profiles',
  '/organigrama',
  '/error-types',
  '/templates',
  '/reglas-mapeo',
  '/dashboard',
  '/reports',
  '/tags',
  '/price-lists',
  '/viaticos',
];

const proxyTarget = 'http://localhost:3000';

const proxyConfig = Object.fromEntries(
  API_ROUTES.map((path) => [
    path,
    {
      target: proxyTarget,
      changeOrigin: true,
      bypass: (req: IncomingMessage) => {
        if (req.headers.accept?.includes('text/html')) {
          return req.url;
        }
      },
    },
  ]),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  server: {
    proxy: proxyConfig,
  },
})
