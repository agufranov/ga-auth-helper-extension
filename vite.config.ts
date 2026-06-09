import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isContentBuild = mode === 'content';

  return {
    plugins: [vue()],
    publicDir: isContentBuild ? false : 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: !isContentBuild,
      ...(isContentBuild
        ? {
            lib: {
              entry: 'src/content/main.ts',
              name: 'GaAuthHelperContent',
              formats: ['iife' as const],
              fileName: () => 'assets/content.js'
            }
          }
        : {}),
      rollupOptions: {
        input: isContentBuild ? undefined : 'popup.html',
        output: {
          entryFileNames: isContentBuild ? 'assets/content.js' : 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name][extname]'
        }
      }
    }
  };
});
