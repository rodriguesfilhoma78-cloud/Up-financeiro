/* ===========================================================
   Lista de Compras — armazenamento local (localStorage)
   - Lista atual: itens com nome, quantidade e valor unitário
   - Total: soma de (quantidade × valor) de todos os itens
   - Histórico: compras finalizadas, mantidas por 90 dias
   - Comparação de preços com base no histórico
   =========================================================== */

const DIAS_HISTORICO = 90;
const CHAVE_LISTA = 'lc_lista_atual';
const CHAVE_HISTORICO = 'lc_historico';
const CHAVE_CATALOGO = 'lc_catalogo';

// Listas prontas iniciais (o usuário pode alterar tudo depois)
const CATALOGO_PADRAO = {
  'Higiene': [
    'Sabonete', 'Shampoo', 'Condicionador', 'Creme dental', 'Escova de dente',
    'Papel higiênico', 'Desodorante', 'Sabonete líquido', 'Absorvente',
    'Cotonete', 'Lâmina de barbear', 'Fralda',
  ],
  'Produtos de limpeza': [
    'Detergente', 'Sabão em pó', 'Amaciante', 'Água sanitária', 'Desinfetante',
    'Esponja de aço', 'Saco de lixo', 'Limpa-vidros', 'Multiuso',
    'Lustra-móveis', 'Pano de chão', 'Papel toalha', 'Alvejante',
  ],
  'Perecíveis': [
    'Leite', 'Pão', 'Ovos', 'Queijo', 'Presunto', 'Frutas', 'Verduras',
    'Legumes', 'Carne', 'Frango', 'Iogurte', 'Manteiga', 'Tomate',
  ],
};

/* ---------- Utilidades ---------- */
const moeda = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const numeroBonito = (n) =>
  Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

const normalizar = (s) => s.trim().toLowerCase();

const formatarData = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function lerJSON(chave, padrao) {
  try {
    const dado = localStorage.getItem(chave);
    return dado ? JSON.parse(dado) : padrao;
  } catch (e) {
    return padrao;
  }
}

function salvarJSON(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

/* ---------- Estado ---------- */
let lista = lerJSON(CHAVE_LISTA, []); // [{ id, nome, qtd, valor }]

function historicoValido() {
  // Remove compras com mais de 90 dias e devolve o histórico limpo
  const limite = Date.now() - DIAS_HISTORICO * 24 * 60 * 60 * 1000;
  const hist = lerJSON(CHAVE_HISTORICO, []).filter(
    (c) => new Date(c.data).getTime() >= limite
  );
  salvarJSON(CHAVE_HISTORICO, hist);
  return hist;
}

/* ---------- Histórico de preços por item ---------- */
// Devolve todos os registros de preço de um item, do mais antigo ao mais novo
function precosDoItem(nome) {
  const alvo = normalizar(nome);
  const registros = [];
  historicoValido().forEach((compra) => {
    compra.itens.forEach((it) => {
      if (normalizar(it.nome) === alvo) {
        registros.push({ data: compra.data, valor: it.valor });
      }
    });
  });
  return registros.sort((a, b) => new Date(a.data) - new Date(b.data));
}

// Último preço pago por um item (mais recente do histórico), ou null
function ultimoPreco(nome) {
  const regs = precosDoItem(nome);
  return regs.length ? regs[regs.length - 1].valor : null;
}

/* ===========================================================
   ABA: LISTA ATUAL
   =========================================================== */
const formItem = document.getElementById('form-item');
const inputNome = document.getElementById('nome');
const inputQtd = document.getElementById('qtd');
const inputValor = document.getElementById('valor');

formItem.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = inputNome.value.trim();
  const qtd = parseFloat(inputQtd.value);
  const valor = parseFloat(inputValor.value);

  if (!nome || isNaN(qtd) || isNaN(valor)) return;

  lista.push({ id: Date.now() + Math.random(), nome, qtd, valor });
  salvarJSON(CHAVE_LISTA, lista);

  formItem.reset();
  inputQtd.value = '1';
  inputNome.focus();
  renderLista();
});

// Adiciona um item à lista pelo nome (usado pelos modelos prontos).
// Se já existir um item com o mesmo nome, soma 1 na quantidade.
function adicionarNaLista(nome) {
  const existente = lista.find((it) => normalizar(it.nome) === normalizar(nome));
  if (existente) {
    existente.qtd += 1;
  } else {
    // Já preenche o último preço pago, se houver no histórico
    const valor = ultimoPreco(nome) ?? 0;
    lista.push({ id: Date.now() + Math.random(), nome, qtd: 1, valor });
  }
  salvarJSON(CHAVE_LISTA, lista);
}

function removerItem(id) {
  lista = lista.filter((it) => it.id !== id);
  salvarJSON(CHAVE_LISTA, lista);
  renderLista();
}

function renderLista() {
  const ul = document.getElementById('lista-itens');
  const vazia = document.getElementById('lista-vazia');
  ul.innerHTML = '';

  let totalGeral = 0;
  let totalQtd = 0;

  lista.forEach((it) => {
    const subtotal = it.qtd * it.valor;
    totalGeral += subtotal;
    totalQtd += it.qtd;

    // Comparação com o último preço pago
    const anterior = ultimoPreco(it.nome);
    let badge = '';
    if (anterior !== null && anterior > 0) {
      const dif = it.valor - anterior;
      if (Math.abs(dif) >= 0.005) {
        const pct = Math.round((dif / anterior) * 100);
        if (dif > 0) {
          badge = `<span class="badge badge-sobe" title="Antes: ${moeda(anterior)}">▲ ${pct}%</span>`;
        } else {
          badge = `<span class="badge badge-desce" title="Antes: ${moeda(anterior)}">▼ ${Math.abs(pct)}%</span>`;
        }
      }
    }

    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="item-info">
        <div class="item-nome">${escapeHtml(it.nome)}${badge}</div>
        <div class="item-detalhe">${numeroBonito(it.qtd)} × ${moeda(it.valor)}</div>
      </div>
      <div class="item-subtotal">${moeda(subtotal)}</div>
      <button class="btn-remover" aria-label="Remover">&times;</button>
    `;
    li.querySelector('.btn-remover').addEventListener('click', () => removerItem(it.id));
    ul.appendChild(li);
  });

  vazia.style.display = lista.length ? 'none' : 'block';
  document.getElementById('total-qtd').textContent = numeroBonito(totalQtd);
  document.getElementById('total-geral').textContent = moeda(totalGeral);

  // Comparativo do total da lista com a última compra finalizada
  renderComparativoTotal(totalGeral);
  atualizarSugestoes();
}

function renderComparativoTotal(totalAtual) {
  const el = document.getElementById('comparativo-preco');
  const hist = historicoValido();
  if (!hist.length || totalAtual === 0) {
    el.textContent = '';
    return;
  }
  const ultima = hist.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
  const dif = totalAtual - ultima.total;
  if (Math.abs(dif) < 0.005) {
    el.textContent = '= última compra';
    el.style.color = 'var(--texto-suave)';
  } else if (dif > 0) {
    el.textContent = `▲ ${moeda(dif)} vs. última`;
    el.style.color = 'var(--vermelho)';
  } else {
    el.textContent = `▼ ${moeda(Math.abs(dif))} vs. última`;
    el.style.color = 'var(--verde)';
  }
}

// Sugestões de itens já comprados (datalist)
function atualizarSugestoes() {
  const dl = document.getElementById('sugestoes');
  const nomes = new Set();
  historicoValido().forEach((c) => c.itens.forEach((it) => nomes.add(it.nome)));
  // Inclui também os itens das listas prontas (modelos)
  const cat = lerCatalogo();
  Object.values(cat).forEach((itens) => itens.forEach((n) => nomes.add(n)));
  dl.innerHTML = '';
  [...nomes].sort().forEach((nome) => {
    const opt = document.createElement('option');
    opt.value = nome;
    dl.appendChild(opt);
  });
}

/* ---------- Finalizar / Limpar ---------- */
document.getElementById('btn-finalizar').addEventListener('click', () => {
  if (!lista.length) {
    alert('A lista está vazia.');
    return;
  }
  const total = lista.reduce((s, it) => s + it.qtd * it.valor, 0);
  const compra = {
    id: Date.now(),
    data: new Date().toISOString(),
    total,
    itens: lista.map((it) => ({ nome: it.nome, qtd: it.qtd, valor: it.valor })),
  };

  const hist = historicoValido();
  hist.push(compra);
  salvarJSON(CHAVE_HISTORICO, hist);

  lista = [];
  salvarJSON(CHAVE_LISTA, lista);
  renderLista();

  alert(`Compra finalizada: ${moeda(total)}\nSalva no histórico.`);
});

document.getElementById('btn-limpar').addEventListener('click', () => {
  if (!lista.length) return;
  if (confirm('Limpar todos os itens da lista atual? (Não afeta o histórico.)')) {
    lista = [];
    salvarJSON(CHAVE_LISTA, lista);
    renderLista();
  }
});

/* ===========================================================
   ABA: HISTÓRICO
   =========================================================== */
function renderHistorico() {
  const ul = document.getElementById('lista-historico');
  const vazia = document.getElementById('historico-vazio');
  const hist = historicoValido().sort((a, b) => new Date(b.data) - new Date(a.data));
  ul.innerHTML = '';
  vazia.style.display = hist.length ? 'none' : 'block';

  hist.forEach((compra) => {
    const li = document.createElement('li');
    li.className = 'compra';
    const qtdItens = compra.itens.length;
    const detalhes = compra.itens
      .map(
        (it) =>
          `<div>${escapeHtml(it.nome)} — ${numeroBonito(it.qtd)} × ${moeda(it.valor)} = ${moeda(it.qtd * it.valor)}</div>`
      )
      .join('');

    li.innerHTML = `
      <div class="compra-topo">
        <span class="compra-data">${formatarData(compra.data)} · ${qtdItens} ${qtdItens === 1 ? 'item' : 'itens'}</span>
        <span class="compra-total">${moeda(compra.total)}</span>
      </div>
      <div class="compra-detalhes">${detalhes}</div>
    `;
    li.querySelector('.compra-topo').addEventListener('click', () => {
      li.querySelector('.compra-detalhes').classList.toggle('aberto');
    });
    ul.appendChild(li);
  });

  preencherSeletorItens();
}

/* ---------- Comparação de preços por item ---------- */
function preencherSeletorItens() {
  const select = document.getElementById('busca-item');
  const anterior = select.value;
  const nomes = new Set();
  historicoValido().forEach((c) => c.itens.forEach((it) => nomes.add(it.nome)));
  const ordenados = [...nomes].sort();

  select.innerHTML = '<option value="">— escolha um item —</option>';
  ordenados.forEach((nome) => {
    const opt = document.createElement('option');
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });
  if (ordenados.includes(anterior)) select.value = anterior;
  renderEvolucao(select.value);
}

document.getElementById('busca-item').addEventListener('change', (e) => {
  renderEvolucao(e.target.value);
});

function renderEvolucao(nome) {
  const cont = document.getElementById('evolucao-preco');
  if (!nome) {
    cont.innerHTML = '<p class="vazia">Selecione um item para ver a evolução do preço.</p>';
    return;
  }

  const regs = precosDoItem(nome).sort((a, b) => new Date(b.data) - new Date(a.data));
  if (!regs.length) {
    cont.innerHTML = '<p class="vazia">Sem registros para este item.</p>';
    return;
  }

  const valores = regs.map((r) => r.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;

  const linhas = regs
    .map((r) => {
      let marca = '';
      if (r.valor === min && min !== max) marca = ' 🟢';
      else if (r.valor === max && min !== max) marca = ' 🔴';
      return `<div class="evo-linha"><span class="evo-data">${formatarData(r.data)}</span><span>${moeda(r.valor)}${marca}</span></div>`;
    })
    .join('');

  cont.innerHTML = `
    <div class="evo-resumo">
      <div><span>Menor</span><strong class="min">${moeda(min)}</strong></div>
      <div><span>Médio</span><strong>${moeda(media)}</strong></div>
      <div><span>Maior</span><strong class="max">${moeda(max)}</strong></div>
    </div>
    ${linhas}
  `;
}

/* ===========================================================
   ABA: MODELOS — listas prontas e editáveis
   =========================================================== */
function lerCatalogo() {
  const cat = lerJSON(CHAVE_CATALOGO, null);
  if (cat && typeof cat === 'object') return cat;
  // Primeira vez: semeia com as listas padrão
  salvarJSON(CHAVE_CATALOGO, CATALOGO_PADRAO);
  return JSON.parse(JSON.stringify(CATALOGO_PADRAO));
}

function salvarCatalogo(cat) {
  salvarJSON(CHAVE_CATALOGO, cat);
}

function renderModelos() {
  const cont = document.getElementById('categorias');
  const cat = lerCatalogo();
  cont.innerHTML = '';

  const categorias = Object.keys(cat);
  if (!categorias.length) {
    cont.innerHTML = '<div class="card"><p class="vazia">Nenhuma categoria. Crie uma abaixo. 👇</p></div>';
    return;
  }

  categorias.forEach((nomeCat) => {
    const itens = cat[nomeCat] || [];
    const card = document.createElement('div');
    card.className = 'card categoria';

    const itensHtml = itens.length
      ? itens
          .map(
            (item, i) => `
        <li class="cat-item">
          <label class="cat-check">
            <input type="checkbox" data-item="${escapeHtml(item)}" />
            <span>${escapeHtml(item)}</span>
          </label>
          <button class="btn-remover" data-remover="${i}" aria-label="Remover item">&times;</button>
        </li>`
          )
          .join('')
      : '<li class="vazia" style="text-align:left">Sem itens. Adicione abaixo.</li>';

    card.innerHTML = `
      <div class="cat-header">
        <h2>${escapeHtml(nomeCat)}</h2>
        <button class="btn-excluir-cat" data-cat="${escapeHtml(nomeCat)}" title="Excluir categoria">🗑️</button>
      </div>
      <ul class="cat-lista">${itensHtml}</ul>
      <form class="form-inline form-add-item" data-cat="${escapeHtml(nomeCat)}" autocomplete="off">
        <input type="text" placeholder="Novo item nesta categoria…" required />
        <button type="submit" class="btn-add-inline">＋ item</button>
      </form>
      <button class="btn-primary btn-add-selecionados" data-cat="${escapeHtml(nomeCat)}">
        Adicionar selecionados à lista
      </button>
    `;
    cont.appendChild(card);

    // Remover item individual
    card.querySelectorAll('[data-remover]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.remover, 10);
        const atual = lerCatalogo();
        atual[nomeCat].splice(idx, 1);
        salvarCatalogo(atual);
        renderModelos();
      });
    });

    // Adicionar novo item à categoria
    card.querySelector('.form-add-item').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.querySelector('input');
      const novo = input.value.trim();
      if (!novo) return;
      const atual = lerCatalogo();
      const jaTem = atual[nomeCat].some((x) => normalizar(x) === normalizar(novo));
      if (!jaTem) atual[nomeCat].push(novo);
      salvarCatalogo(atual);
      renderModelos();
    });

    // Excluir a categoria inteira
    card.querySelector('.btn-excluir-cat').addEventListener('click', () => {
      if (confirm(`Excluir a categoria "${nomeCat}" e todos os seus itens?`)) {
        const atual = lerCatalogo();
        delete atual[nomeCat];
        salvarCatalogo(atual);
        renderModelos();
      }
    });

    // Adicionar itens marcados à lista de compras
    card.querySelector('.btn-add-selecionados').addEventListener('click', () => {
      const marcados = [...card.querySelectorAll('input[type=checkbox]:checked')];
      if (!marcados.length) {
        alert('Marque ao menos um item para adicionar.');
        return;
      }
      marcados.forEach((chk) => {
        adicionarNaLista(chk.dataset.item);
        chk.checked = false;
      });
      renderLista();
      const n = marcados.length;
      alert(`${n} ${n === 1 ? 'item adicionado' : 'itens adicionados'} à sua lista.`);
    });
  });
}

// Criar nova categoria
document.getElementById('form-categoria').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('nova-categoria');
  const nome = input.value.trim();
  if (!nome) return;
  const cat = lerCatalogo();
  if (Object.keys(cat).some((c) => normalizar(c) === normalizar(nome))) {
    alert('Já existe uma categoria com esse nome.');
    return;
  }
  cat[nome] = [];
  salvarCatalogo(cat);
  input.value = '';
  renderModelos();
});

/* ===========================================================
   Navegação por abas
   =========================================================== */
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const alvo = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `tab-${alvo}`);
    });
    if (alvo === 'historico') renderHistorico();
    if (alvo === 'lista') renderLista();
    if (alvo === 'modelos') renderModelos();
  });
});

/* ---------- Segurança básica ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ---------- Inicialização ---------- */
historicoValido(); // limpa registros > 90 dias ao abrir
renderLista();

/* ---------- Service worker (instalação como app + offline) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
