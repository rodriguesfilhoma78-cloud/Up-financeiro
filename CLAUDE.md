# Up-financeiro — Lista de Compras

App web de **lista de compras** com controle de itens, valores e quantidades, total
automático e histórico de 90 dias para comparar preços. Feito em **HTML + CSS +
JavaScript puro** (sem build, sem dependências), funciona offline e é instalável
como app (PWA).

## Como rodar / publicar
- **Local:** abrir `index.html` no navegador (duplo clique).
- **Online:** publicado via **GitHub Pages no modo "Deploy from a branch"** (serve
  direto da branch `main`). URL: https://rodriguesfilhoma78-cloud.github.io/Up-financeiro/
- ⚠️ Pages NÃO usa GitHub Actions aqui — o workflow de deploy foi removido de propósito
  (o token não tem permissão para ativar o Pages; quem ativa é o dono em Settings → Pages).

## Estrutura dos arquivos
| Arquivo | Função |
|---|---|
| `index.html` | Estrutura e 4 abas: Lista, Modelos, Histórico, Backup |
| `styles.css` | Visual (verde, responsivo, mobile-first) |
| `app.js` | Toda a lógica |
| `sw.js` | Service worker (offline + instalação) |
| `manifest.webmanifest` | Manifesto PWA |
| `icon.svg` + `icons/` | Ícone (carrinho verde) e PNGs gerados dele |

## Funcionalidades
- **Lista atual:** adicionar itens (nome, quantidade, valor); **quantidade só inteira**,
  preço com centavos; **qtd e preço editáveis direto na lista** (total atualiza ao vivo).
- **Total** automático = soma de (quantidade × valor).
- **Mercado (opcional)** por compra, com sugestão dos mercados já usados.
- **Modelos:** listas prontas e editáveis por categoria (Higiene, Produtos de limpeza,
  Perecíveis); marcar e adicionar vários de uma vez; incluir/remover itens, criar/excluir
  categorias.
- **Histórico de 90 dias:** compras finalizadas (some o que passa de 90 dias); mostra o
  mercado; comparação de preço por item (alta ▲ / queda ▼ vs. último, evolução menor/médio/maior).
- **Backup:** exportar tudo num `.json` e importar/restaurar.

## Dados (localStorage)
Tudo é salvo **só no aparelho** via `localStorage`. Chaves:
- `lc_lista_atual` — itens da lista atual `[{id, nome, qtd, valor}]`
- `lc_historico` — compras `[{id, data, mercado, total, itens:[{nome,qtd,valor}]}]`
- `lc_catalogo` — modelos `{ "Categoria": ["item", ...] }`

## Service worker — IMPORTANTE
- Estratégia **rede-primeiro** (network-first): com internet sempre busca a versão nova
  e atualiza o cache; sem internet usa a cópia salva.
- **Ao mudar HTML/CSS/JS, SEMPRE incrementar a constante `CACHE`** em `sw.js`
  (ex.: `lista-compras-v6` → `v7`) para invalidar o cache antigo.
- Se um usuário ficar preso numa versão antiga: F12 → Application → Service Workers →
  Unregister → Ctrl+Shift+R (NÃO usar "Clear site data", pois apaga lista/histórico).

## Fluxo de trabalho (git)
- Desenvolver na branch `claude/shopping-list-app-mf3vyv`; publicar via PR para `main`
  (squash merge). O site atualiza ao mesclar na `main`.
- Antes de editar, sincronizar a branch com a `main`: `git fetch origin main && git reset
  --hard origin/main` — e **commitar antes** de qualquer reset para não perder trabalho.
- Backup do código entregue ao usuário como `.zip` (ele guarda numa pasta "cerebelo").

## Verificação
Há scripts de teste com Playwright/Chromium no scratchpad da sessão. Para validar
mudanças: `node --check app.js` e abrir `index.html` no Chromium em
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
