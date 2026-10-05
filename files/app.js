// app.js — lógica da tela principal (painel, registro de ações, ranking)

let confirmReset = false;
let feedCategoryFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('user-name').textContent = user.name;

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  renderCategoryButtons();
  criarFiltroFeed();
  renderAll();

  const form = document.getElementById('form-log-action');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document
      .getElementById('description')
      .value
      .trim();

    if (!description) return;

    const categoryId =
      document.querySelector('.eco-cat-btn.active')?.dataset.id ||
      CATEGORIES[0].id;

    const submitBtn = form.querySelector(
      'button[type="submit"]'
    );

    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando…';

    addAction({
      userName: user.name,
      categoryId,
      description
    });

    document.getElementById('description').value = '';

    renderAll();

    submitBtn.disabled = false;
    updateSubmitLabel();
  });

  document
    .getElementById('description')
    .addEventListener('input', updateSubmitLabel);

  document
    .getElementById('reset-btn')
    .addEventListener('click', () => {
      const btn = document.getElementById('reset-btn');

      if (!confirmReset) {
        confirmReset = true;
        btn.classList.add('confirm');

        btn.querySelector('.reset-label').textContent =
          'Clique de novo para confirmar — apaga os dados de todo o grupo';

        return;
      }

      resetActions();

      confirmReset = false;
      feedCategoryFilter = 'all';

      btn.classList.remove('confirm');

      btn.querySelector('.reset-label').textContent =
        'Reiniciar dados do grupo';

      atualizarFiltroFeed();
      renderAll();
    });
});

function renderCategoryButtons() {
  const wrap = document.getElementById('category-buttons');

  wrap.innerHTML = '';

  CATEGORIES.forEach((c, i) => {
    const btn = document.createElement('button');

    btn.type = 'button';
    btn.className =
      'eco-cat-btn' + (i === 0 ? ' active' : '');

    btn.dataset.id = c.id;

    btn.style.borderColor =
      i === 0 ? c.color : 'transparent';

    btn.style.color =
      i === 0 ? c.color : 'var(--ink)';

    btn.innerHTML = `
      <i
        data-lucide="${c.icon}"
        class="eco-cat-icon"
      ></i>
      ${c.label}
    `;

    btn.addEventListener('click', () => {
      wrap
        .querySelectorAll('.eco-cat-btn')
        .forEach((b) => {
          b.classList.remove('active');
          b.style.borderColor = 'transparent';
          b.style.color = 'var(--ink)';
        });

      btn.classList.add('active');
      btn.style.borderColor = c.color;
      btn.style.color = c.color;

      updateSubmitLabel();
    });

    wrap.appendChild(btn);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

function updateSubmitLabel() {
  const submitBtn = document.querySelector(
    '#form-log-action button[type="submit"]'
  );

  const description = document
    .getElementById('description')
    .value
    .trim();

  const categoryId =
    document.querySelector('.eco-cat-btn.active')?.dataset.id ||
    CATEGORIES[0].id;

  const cat = catInfo(categoryId);

  submitBtn.disabled = !description;

  submitBtn.textContent =
    `Registrar (+${cat.points} pts)`;
}

// --------------------------------------------------
// Filtro do histórico por categoria
// --------------------------------------------------
function criarFiltroFeed() {
  const feedList = document.getElementById('feed-list');

  if (!feedList) return;

  const filtroExistente =
    document.getElementById('feed-category-filter');

  if (filtroExistente) return;

  const filtro = document.createElement('div');

  filtro.id = 'feed-category-filter';

  filtro.style.display = 'flex';
  filtro.style.flexWrap = 'wrap';
  filtro.style.gap = '8px';
  filtro.style.marginBottom = '14px';

  feedList.parentNode.insertBefore(filtro, feedList);

  atualizarFiltroFeed();
}

function atualizarFiltroFeed() {
  const filtro =
    document.getElementById('feed-category-filter');

  if (!filtro) return;

  filtro.innerHTML = '';

  const opcoes = [
    {
      id: 'all',
      label: 'Todas',
      color: 'var(--ink)'
    },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      color: c.color
    }))
  ];

  opcoes.forEach((opcao) => {
    const btn = document.createElement('button');

    btn.type = 'button';
    btn.textContent = opcao.label;

    btn.style.padding = '6px 10px';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.style.border = '1px solid var(--border)';
    btn.style.background =
      feedCategoryFilter === opcao.id
        ? 'var(--surface)'
        : 'transparent';

    btn.style.color =
      feedCategoryFilter === opcao.id
        ? opcao.color
        : 'var(--muted)';

    btn.style.fontWeight =
      feedCategoryFilter === opcao.id
        ? '700'
        : '500';

    btn.addEventListener('click', () => {
      feedCategoryFilter = opcao.id;

      atualizarFiltroFeed();

      const actions = getActions();

      renderFeed(actions);
    });

    filtro.appendChild(btn);
  });
}

function renderAll() {
  const actions = getActions();

  const totalPoints = actions.reduce(
    (s, a) => s + a.points,
    0
  );

  const participants =
    new Set(actions.map((a) => a.name)).size;

  document.getElementById(
    'stat-points'
  ).textContent = totalPoints;

  document.getElementById(
    'stat-actions'
  ).textContent = actions.length;

  document.getElementById(
    'stat-participants'
  ).textContent = participants;

  renderByCategory(actions);
  renderFeed(actions);
  renderLeaderboard(actions);

  updateSubmitLabel();
}

function renderByCategory(actions) {
  const map = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, 0])
  );

  actions.forEach((a) => {
    map[a.category] =
      (map[a.category] || 0) + a.points;
  });

  const max = Math.max(
    1,
    ...Object.values(map)
  );

  const wrap = document.getElementById(
    'category-breakdown'
  );

  wrap.innerHTML = '';

  CATEGORIES.forEach((c) => {
    const value = map[c.id];

    const pct = Math.round(
      (value / max) * 100
    );

    const row =
      document.createElement('div');

    row.innerHTML = `
      <div
        style="
          display:flex;
          justify-content:space-between;
          font-size:12.5px;
          margin-bottom:4px;
        "
      >
        <span
          style="
            display:flex;
            align-items:center;
            gap:5px;
          "
        >
          <i
            data-lucide="${c.icon}"
            style="
              width:13px;
              height:13px;
              color:${c.color};
            "
          ></i>
          ${c.label}
        </span>

        <span style="color:var(--muted);">
          ${value} pts
        </span>
      </div>

      <div class="eco-bar-track">
        <div
          class="eco-bar-fill"
          style="
            width:${pct}%;
            background:${c.color};
          "
        ></div>
      </div>
    `;

    wrap.appendChild(row);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

function renderFeed(actions) {
  const wrap =
    document.getElementById('feed-list');

  const filteredActions =
    feedCategoryFilter === 'all'
      ? actions
      : actions.filter(
          (a) =>
            a.category === feedCategoryFilter
        );

  if (filteredActions.length === 0) {
    if (feedCategoryFilter === 'all') {
      wrap.innerHTML = `
        <div class="eco-empty">
          Nenhuma ação registrada ainda.
          Seja a primeira pessoa do grupo a contar o que fez.
        </div>
      `;
    } else {
      const categoria =
        catInfo(feedCategoryFilter);

      wrap.innerHTML = `
        <div class="eco-empty">
          Nenhuma ação registrada na categoria
          "${categoria.label}".
        </div>
      `;
    }

    return;
  }

  wrap.innerHTML = '';

  filteredActions.forEach((a) => {
    const c = catInfo(a.category);

    const item =
      document.createElement('div');

    item.className = 'eco-feed-item';

    item.style.borderLeftColor =
      c.color;

    const date =
      new Date(a.date).toLocaleDateString(
        'pt-BR',
        {
          day: '2-digit',
          month: 'short'
        }
      );

    item.innerHTML = `
      <div class="eco-feed-head">

        <span class="eco-feed-name">
          ${escapeHTML(a.name)}
        </span>

        <span class="eco-feed-date">
          ${date}
        </span>

      </div>

      <div class="eco-feed-desc">
        ${escapeHTML(a.description)}
      </div>

      <div
        class="eco-feed-meta"
        style="color:${c.color};"
      >
        ${c.label} · +${a.points} pts
      </div>
    `;

    wrap.appendChild(item);
  });
}

function renderLeaderboard(actions) {
  const map = {};

  actions.forEach((a) => {
    map[a.name] =
      (map[a.name] || 0) + a.points;
  });

  const leaderboard =
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

  const wrap =
    document.getElementById(
      'leaderboard-list'
    );

  if (leaderboard.length === 0) {
    wrap.innerHTML = `
      <div class="eco-empty">
        O ranking aparece assim que houver
        ações registradas.
      </div>
    `;

    return;
  }

  wrap.innerHTML = '';

  leaderboard.forEach(
    ([person, pts], i) => {
      const row =
        document.createElement('div');

      row.className = 'eco-rank-row';

      row.innerHTML = `
        <span
          class="eco-display eco-rank-pos"
          style="
            color:${
              i === 0
                ? '#E3B23C'
                : 'var(--muted)'
            };
          "
        >
          ${i + 1}º
        </span>

        <span class="eco-rank-name">
          ${escapeHTML(person)}
        </span>

        <span class="eco-rank-pts">
          ${pts} pts
        </span>
      `;

      wrap.appendChild(row);
    }
  );
}

function escapeHTML(str) {
  const div =
    document.createElement('div');

  div.textContent = str;

  return div.innerHTML;
}
