(async function () {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const countEl = document.getElementById('count');
  const searchInput = document.getElementById('search');
  const typeFilter = document.getElementById('typeFilter');
  const siteFilter = document.getElementById('siteFilter');
  const resetBtn = document.getElementById('resetBtn');

  let items = [];
  try {
    const res = await fetch('data.json');
    items = await res.json();
  } catch (e) {
    countEl.textContent = 'Failed to load catalog data.';
    return;
  }

  // Clean site names
  items.forEach(it => {
    let s = (it.site || '').replace(/&nbsp;|\s+/g, ' ').trim().toLowerCase();
    if (!s || s === 'unknown') {
      // try infer from link
      const m = (it.link || '').match(/join\.([a-z0-9]+)\./i);
      if (m) s = m[1];
    }
    it.siteClean = s || 'other';
  });

  // Populate site dropdown
  const siteCounts = {};
  items.forEach(it => {
    siteCounts[it.siteClean] = (siteCounts[it.siteClean] || 0) + 1;
  });
  Object.keys(siteCounts)
    .sort((a, b) => siteCounts[b] - siteCounts[a])
    .forEach(site => {
      const opt = document.createElement('option');
      opt.value = site;
      opt.textContent = `${site} (${siteCounts[site]})`;
      siteFilter.appendChild(opt);
    });

  function render(list) {
    grid.innerHTML = '';
    if (!list.length) {
      empty.hidden = false;
      countEl.textContent = '0 results';
      return;
    }
    empty.hidden = true;
    countEl.textContent = `${list.length.toLocaleString()} items`;

    const frag = document.createDocumentFragment();
    list.forEach(it => {
      const card = document.createElement('article');
      card.className = 'card';

      const typeClass = it.type === 'FHG' ? 'fhg' : it.type === 'Video' ? 'video' : 'content';
      const thumb = it.thumb
        ? `<img src="${escapeAttr(it.thumb)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=placeholder>No preview</div>'" />`
        : `<div class="placeholder">No preview</div>`;

      const primaryHref = it.gallery || it.link;

      card.innerHTML = `
        <div class="thumb-wrap">
          <span class="badge ${typeClass}">${escapeHtml(it.type)}</span>
          ${thumb}
        </div>
        <div class="card-body">
          <h3 title="${escapeAttr(it.title)}">${escapeHtml(it.title || 'Untitled')}</h3>
          <div class="meta">${escapeHtml(it.siteClean)}${it.date ? ' · ' + formatDate(it.date) : ''}</div>
          <div class="actions">
            <a class="btn-primary" href="${escapeAttr(primaryHref)}" target="_blank" rel="noopener">Open</a>
          </div>
        </div>
      `;
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function filter() {
    const q = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;
    const site = siteFilter.value;

    const filtered = items.filter(it => {
      if (type && it.type !== type) return false;
      if (site && it.siteClean !== site) return false;
      if (q) {
        const hay = `${it.title} ${it.siteClean} ${it.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    render(filtered);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }
  function formatDate(d) {
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d.slice(0, 16);
      return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  }

  searchInput.addEventListener('input', filter);
  typeFilter.addEventListener('change', filter);
  siteFilter.addEventListener('change', filter);
  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    typeFilter.value = '';
    siteFilter.value = '';
    filter();
  });

  // Initial render (limit first paint to keep it snappy; still searchable over full set)
  filter();
})();
