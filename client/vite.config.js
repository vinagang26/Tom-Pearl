import {defineConfig} from 'vite';
export default defineConfig({root:'client',server:{host:'127.0.0.1',proxy:{'/api':'http://127.0.0.1:8173'}},build:{outDir:'../dist',emptyOutDir:true}});
