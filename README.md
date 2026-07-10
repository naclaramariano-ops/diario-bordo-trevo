# Diário de Bordo Trevo — V6.7 UX Prática

Evolução direta da base V6.5.1 validada.

## Principal melhoria

A aba **Novo** foi redesenhada para reduzir burocracia no celular:

- uma máquina por vez;
- todos os blocos essenciais na mesma tela;
- campos condicionais somente quando necessários;
- botões grandes Sim/Não;
- lista de máquinas com progresso;
- botão **Salvar e próxima**;
- atalhos **Sem avisos** e **Sem observações**;
- validação direcionando ao primeiro campo pendente;
- SKU pesquisável por máquina;
- CIP automático em 72 horas;
- regra de parada contínua ≥ 4h;
- mantém Hoje, Histórico, Admin, PWA, offline e sincronização.

## Cloudflare Pages

- Framework: React (Vite)
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: vazio

## Build verificado

O pacote inclui `package-lock.json` gerado com Node 22.16.0 e npm 10.9.2, a mesma versão exibida no log do Cloudflare.
