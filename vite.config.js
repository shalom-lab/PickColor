import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, join, dirname } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';

function copyRecursiveSync(src, dest) {
  const exists = existsSync(src);
  if (!exists) return;
  
  const stats = statSync(src);
  const isDirectory = stats.isDirectory();
  if (isDirectory) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(join(src, childItemName), join(dest, childItemName));
    });
  } else {
    const destDir = dirname(dest);
    if (destDir && !existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    copyFileSync(src, dest);
  }
}

export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox';
  
  return {
    plugins: [
      react(),
      {
        name: 'copy-manifest',
        closeBundle() {
          const manifestSrc = isFirefox 
            ? 'manifest.firefox.json' 
            : 'manifest.chrome.json';
          const manifestDest = resolve(__dirname, 'dist/manifest.json');
          
          if (!existsSync('dist')) {
            mkdirSync('dist', { recursive: true });
          }
          
          copyFileSync(manifestSrc, manifestDest);
          
          // 复制图标目录
          if (existsSync('icons')) {
            copyRecursiveSync('icons', resolve(__dirname, 'dist/icons'));
          }
        }
      }
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'popup.html'),
          background: resolve(__dirname, 'src/background.js'),
          content: resolve(__dirname, 'src/content.js')
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      emptyOutDir: true
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  };
});

