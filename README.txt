Ecosistema Digital del Líbano — Overlay de archivos

Uso:
1) Crea el proyecto base con Create Next App:
   npx create-next-app@latest ecosistema-libano --typescript --eslint
   cd ecosistema-libano

2) Instala dependencias necesarias:
   npm install @supabase/supabase-js jsPDF zod tailwindcss postcss autoprefixer

3) Ejecuta:
   npx tailwindcss init -p

4) Copia el contenido de este overlay dentro del proyecto, respetando carpetas.
   (Sobrescribe archivos si te lo pide).

5) Crea .env.local a partir de .env.example y coloca las claves de Supabase.

6) En Supabase -> SQL Editor -> pega y ejecuta supabase_schema.sql

7) Arranca el servidor:
   npm run dev
   Abre http://localhost:3000  (PIN por defecto en .env.local)
