import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [tailwindcss(), react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (!id.includes('node_modules')) return;
              if (id.includes('@google/genai')) return 'vendor-ai';
              if (id.includes('@dfinity')) return 'vendor-ic';
              if (id.includes('recharts') || id.includes('d3-scale') || id.includes('d3-shape') || id.includes('d3-color') || id.includes('victory')) return 'vendor-charts';
              if (id.includes('date-fns')) return 'vendor-dates';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
              return 'vendor-misc';
            },
          },
        },
      },
    };
});
