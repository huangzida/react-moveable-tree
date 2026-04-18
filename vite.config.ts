import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ReactMoveableTree',
      fileName: 'react-moveable-tree'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-moveable']
    }
  }
});