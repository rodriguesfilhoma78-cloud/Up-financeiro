# Up-financeiro — Lista de Compras 🛒

App simples de **lista de compras** com controle de itens, valores e quantidades,
soma do total da compra e **histórico de 90 dias** para comparar preços.

## Funcionalidades

- ➕ **Adicionar itens** com nome, quantidade e valor unitário.
- 🧮 **Total automático** — soma de `quantidade × valor` de todos os itens.
- ✅ **Finalizar compra** — guarda a lista no histórico com a data.
- 🕓 **Histórico de 90 dias** — compras antigas saem automaticamente.
- 📈 **Comparação de preços** — ao adicionar um item já comprado antes, o app
  mostra se o preço **subiu ▲** ou **caiu ▼** em relação à última vez, e na aba
  Histórico você vê a evolução (menor, médio e maior preço) de cada item.
- 💾 **Funciona offline** — os dados ficam salvos no próprio aparelho
  (`localStorage`), sem necessidade de internet, login ou servidor.

## Como usar

Abra o arquivo **`index.html`** em qualquer navegador (celular ou computador).

No celular, você pode "Adicionar à tela de início" pelo navegador para usar como
um aplicativo.

## Estrutura

| Arquivo       | Descrição                                  |
|---------------|--------------------------------------------|
| `index.html`  | Estrutura da página e abas                 |
| `styles.css`  | Aparência (visual verde, responsivo)       |
| `app.js`      | Lógica: itens, totais, histórico e preços  |

## Observações

- Os dados são armazenados **somente neste aparelho/navegador**. Limpar os dados
  do navegador apaga as compras.
- Valores em Real (R$), formato brasileiro.
