import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY globally so the Gemini SDK can access it
      // in the browser bundle.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});