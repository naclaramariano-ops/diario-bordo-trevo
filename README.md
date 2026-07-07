# Diário de Bordo Trevo — V6.1.1 Build Fix

Correção do build Cloudflare.

## O que mudou
- Removido `package-lock.json` gerado em ambiente interno.
- Dependências fixadas em versões estáveis.
- Adicionado `.npmrc` apontando para o registry público do npm.
- Mantida a V6.1 Envase: motivos PCP, CIP 72h, parada >= 4h, validação e histórico/hoje.

## Atualização
1. Substitua os arquivos no repositório.
2. Apague `package-lock.json` do repositório se ele aparecer.
3. Apague `node_modules` se existir.
4. Commit > Push origin.
5. Cloudflare: React/Vite, build `npm run build`, output `dist`.

Não precisa rodar SQL novo.
