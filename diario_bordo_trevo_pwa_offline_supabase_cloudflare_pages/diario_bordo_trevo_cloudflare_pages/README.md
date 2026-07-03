# Diário de Bordo Trevo — PWA Offline + Supabase + Cloudflare Pages

Aplicativo mobile-first para Diário de Bordo / Passagem de Turno da liderança.

## Arquitetura

- **Frontend/PWA:** arquivos estáticos hospedados no Cloudflare Pages.
- **Banco online:** Supabase.
- **Offline:** o app abre offline após o primeiro acesso online e salva novos diários no aparelho.
- **Sincronização:** quando a internet voltar, os registros pendentes são enviados ao Supabase.

## O que está incluído

- Tela de login.
- Tela Hoje.
- Novo diário.
- Histórico.
- Compilado semanal.
- Menu Mais.
- Cadastro de usuários.
- Cadastro de setores.
- Cadastro de máquinas.
- Cards por área: Envase 1, Envase 2 e Processo.
- Fila local de sincronização.
- `manifest.webmanifest` para instalar no celular.
- `service-worker.js` para cache/offline.
- `_headers` e `_redirects` para Cloudflare Pages.

## Configuração rápida

1. Crie o projeto no Supabase.
2. Rode o SQL em `sql/schema_supabase.sql`.
3. Copie a **Project URL**, sem `/rest/v1/`.
4. Copie a **chave publicável / anon public key**.
5. Cole as informações em `assets/app.js`:

```js
const CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICAVEL",
};
```

6. Suba a pasta no Cloudflare Pages.
7. Acesse o link no celular e adicione à tela inicial.

## Login inicial

- E-mail: `admin@trevolacteos.com.br`
- Senha: `admin123`

## Observação importante

O primeiro acesso precisa ser com internet. Depois disso, o app pode abrir offline no mesmo aparelho e manter registros pendentes até a conexão voltar.
