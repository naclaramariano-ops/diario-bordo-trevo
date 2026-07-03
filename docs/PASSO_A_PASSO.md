# Passo a passo rápido

1. Extraia o ZIP.
2. Suba os arquivos para o repositório GitHub `diario-bordo-trevo`.
3. No Supabase, execute `supabase/schema.sql`.
4. No Cloudflare Pages, configure:
   - Build command: npm run build
   - Output directory: dist
5. Em Settings > Environment Variables, crie:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
6. Faça novo deploy.
7. Acesse o app.
8. Login: ana.peliteiro / admin123
