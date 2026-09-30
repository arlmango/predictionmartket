import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({root:'src',base:'./',build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input:{main:resolve('src/index.html'),market:resolve('src/market.html')}}},define:{'process.env':{}}});
