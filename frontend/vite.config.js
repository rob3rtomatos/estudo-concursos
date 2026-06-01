import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable']
  },
  build: {
    commonjsOptions: {
      include: [/jspdf/, /jspdf-autotable/, /node_modules/]
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: { usePolling: true },
    historyApiFallback: true
  }
});
