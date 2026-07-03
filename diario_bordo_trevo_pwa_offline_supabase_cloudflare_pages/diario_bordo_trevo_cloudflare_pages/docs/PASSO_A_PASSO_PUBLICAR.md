# Diário de Bordo Trevo — Passo a passo Cloudflare Pages + Supabase

## 1. Criar banco no Supabase
1. Abra seu projeto no Supabase.
2. Vá em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo `sql/schema_supabase.sql` deste projeto.
5. Copie tudo, cole no Supabase e clique em **Run query**.
6. Confirme se foram criadas as tabelas: `usuarios`, `setores`, `maquinas`, `diarios`, `diario_maquinas`.

## 2. Configurar o app
Abra o arquivo:

```text
assets/js/config.js
```

Substitua:

```js
SUPABASE_URL: "COLE_AQUI_SUA_PROJECT_URL"
SUPABASE_ANON_KEY: "COLE_AQUI_SUA_CHAVE_PUBLICAVEL"
```

Use a URL do projeto sem `/rest/v1`:

```text
https://SEU-PROJETO.supabase.co
```

## 3. Subir no GitHub pelo navegador
1. Crie o repositório `diario-bordo-trevo`.
2. Clique em **Add file > Upload files**.
3. Extraia este ZIP.
4. Envie todos os arquivos e pastas de dentro da pasta extraída.
5. Clique em **Commit changes**.

A raiz do GitHub precisa conter:

```text
index.html
manifest.webmanifest
service-worker.js
assets/
sql/
docs/
```

## 4. Conectar ao Cloudflare Pages
1. Cloudflare > Workers & Pages.
2. Create > Pages > Connect to Git.
3. Escolha o repositório `diario-bordo-trevo`.
4. Framework preset: **None**.
5. Build command: deixe vazio.
6. Build output directory: `/`.
7. Clique em **Save and Deploy**.

## 5. Primeiro acesso
Login inicial:

```text
admin@trevolacteos.com.br
admin123
```

Líderes iniciais também usam senha `admin123`.

## 6. Instalar no telefone
No Android: Chrome > três pontos > Adicionar à tela inicial.
No iPhone: Safari > compartilhar > Adicionar à Tela de Início.

## 7. Como testar offline
1. Abra o app online pelo menos uma vez.
2. Desligue a internet.
3. Preencha um diário.
4. O registro fica salvo no celular e pendente de sincronização.
5. Ligue a internet novamente e clique em **Sincronizar agora**.

