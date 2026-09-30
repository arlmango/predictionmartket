import { defineConfig } from 'vite';
export default defineConfig({root:'src',base:'/predictionmartket/',build:{outDir:'../dist',emptyOutDir:true},define:{'process.env':{}}});
