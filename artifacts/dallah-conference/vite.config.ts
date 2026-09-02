import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];

  // Replit-only dev plugins
  if (!isProduction && process.env.REPL_ID !== undefined) {
    const { default: runtimeErrorOverlay } = await import(
      '@replit/vite-plugin-runtime-error-modal'
    );
    plugins.push(runtimeErrorOverlay());

    const { cartographer } = await import('@replit/vite-plugin-cartographer');
    plugins.push(
      cartographer({ root: path.resolve(import.meta.dirname, '..') }),
    );

    const { devBanner } = await import('@replit/vite-plugin-dev-banner');
    plugins.push(devBanner());
  }

  return {
    base: process.env.BASE_PATH ?? '/',
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
        // Resolve the workspace lib directly so pnpm workspace is not required
        '@workspace/api-client-react': path.resolve(
          import.meta.dirname,
          '../../lib/api-client-react/src',
        ),
      },
      // Tell Rollup where to look for node_modules when traversing files
      // outside the frontend root (i.e. the aliased lib/ directory)
      modules: [
        path.resolve(import.meta.dirname, 'node_modules'),
        'node_modules',
      ],
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      strictPort: false,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: false,
        allow: [
          path.resolve(import.meta.dirname),
          path.resolve(import.meta.dirname, '../../lib'),
          path.resolve(import.meta.dirname, '../../attached_assets'),
        ],
      },
    },
    preview: {
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
