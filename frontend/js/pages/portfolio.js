// ============================================
// PORTFOLIO PAGE
// ============================================

const PortfolioPage = {
  activeCategory: 'all',
  items: [],

  async render(params = {}) {
    const categories = Object.keys(Config.CATEGORIES);
    return `
      <div class="page page-enter" id="portfolio-page">
        <div style="margin:0 calc(-1 * var(--space-md))">
          ${CategoryTabs.render(categories, this.activeCategory, 'PortfolioPage.filterCategory')}
        </div>
        <div class="filter-section">
          <span class="filter-count" id="portfolio-count"></span>
        </div>
        <div id="portfolio-grid-container" style="padding:var(--space-sm)">
          <div style="padding:var(--space-md)">${Utils.skeletonCard(6)}</div>
        </div>
      </div>
    `;
  },

  async afterRender(params = {}) {
    await this.loadPortfolio();
  },

  filterCategory(category) {
    this.activeCategory = category;
    const tabsContainer = document.querySelector('#portfolio-page .category-tab')?.parentElement;
    if (tabsContainer) {
      const categories = Object.keys(Config.CATEGORIES);
      tabsContainer.outerHTML = CategoryTabs.render(categories, category, 'PortfolioPage.filterCategory');
    }
    this.renderGrid();
  },

  async loadPortfolio() {
    try {
      const params = {};
      if (this.activeCategory !== 'all') params.category = this.activeCategory;
      const { items } = await API.portfolio.list(params);
      this.items = items;
      this.renderGrid();
    } catch (e) {
      const container = document.getElementById('portfolio-grid-container');
      if (container) container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  renderGrid() {
    const container = document.getElementById('portfolio-grid-container');
    if (!container) return;

    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    // Update count
    const countEl = document.getElementById('portfolio-count');
    if (countEl) {
      countEl.textContent = filtered.length > 0
        ? `${filtered.length} ${Utils.pluralize(filtered.length, 'работа', 'работы', 'работ')}`
        : '';
    }

    if (filtered.length === 0) {
      container.innerHTML = EmptyState.render('📸', 'Нет работ', 'Портфолио пока пусто');
      return;
    }

    container.innerHTML = `
      <div class="portfolio-grid">
        ${filtered.map((item, index) => `
          <div class="portfolio-item ${item.is_featured ? 'featured' : ''} stagger-item"
               onclick="PortfolioPage.openItem(${index})"
               style="animation-delay:${index * 30}ms">
            <img src="${item.image_url}" alt="${item.title || item.category}"
                 loading="lazy"
                 onerror="this.parentElement.style.background='var(--color-bg-secondary)'">
            <div class="portfolio-item-overlay"></div>
            ${item.title ? `
              <div style="position:absolute;bottom:0;left:0;right:0;padding:8px;
                          background:linear-gradient(transparent,rgba(0,0,0,0.4));
                          color:white;font-size:var(--font-size-xs);font-weight:500;
                          pointer-events:none;
                          opacity:0;transition:opacity var(--transition-fast)">
                ${item.title}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    // Add hover effect for title overlay
    container.querySelectorAll('.portfolio-item').forEach(el => {
      const title = el.querySelector('div:last-child');
      if (title) {
        el.addEventListener('mouseenter', () => title.style.opacity = '1');
        el.addEventListener('mouseleave', () => title.style.opacity = '0');
        el.addEventListener('touchstart', () => title.style.opacity = '1');
        el.addEventListener('touchend', () => setTimeout(() => title.style.opacity = '0', 1500));
      }
    });
  },

  openItem(index) {
    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    const item = filtered[index];
    if (!item) return;

    Utils.haptic('light');

    const catInfo = Utils.getCategoryInfo(item.category);
    const totalItems = filtered.length;
    const position = index + 1;

    Modal.open(`
      <div style="margin:calc(-1 * var(--space-lg));margin-bottom:0">
        <div style="position:relative;background:var(--color-bg-secondary);min-height:300px;display:flex;align-items:center;justify-content:center">
          <img src="${item.image_url}" alt="${item.title || ''}"
               style="width:100%;max-height:70vh;object-fit:contain;border-radius:0"
               onerror="this.parentElement.innerHTML='<span style=color:var(--color-text-tertiary)>Не удалось загрузить изображение</span>'">
          ${totalItems > 1 ? `
            <div style="position:absolute;top:var(--space-md);right:var(--space-md);background:rgba(0,0,0,0.5);color:white;padding:2px 10px;border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:600;backdrop-filter:blur(4px)">
              ${position} / ${totalItems}
            </div>
          ` : ''}
        </div>
      </div>
      <div style="margin-top:var(--space-md)">
        ${item.title ? `<div style="font-weight:700;font-size:var(--font-size-xl);color:var(--color-text-primary);margin-bottom:4px">${item.title}</div>` : ''}
        ${item.description ? `<div style="color:var(--color-text-secondary);font-size:var(--font-size-base);line-height:1.6;margin-bottom:var(--space-md)">${item.description}</div>` : ''}
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="chip chip-primary">${catInfo.emoji} ${catInfo.label}</span>
          ${item.master_name ? `<span class="chip">👤 ${item.master_name}</span>` : ''}
          ${item.price ? `<span class="price-tag">${Utils.formatPrice(item.price)}</span>` : ''}
        </div>

        ${totalItems > 1 ? `
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg);padding-top:var(--space-md);border-top:1px solid var(--color-border-lighter)">
            ${index > 0 ? `
              <button class="btn btn-secondary" style="flex:1" onclick="Modal.close();PortfolioPage.openItem(${index-1})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
                </svg>
                Предыдущая
              </button>
            ` : '<div style="flex:1"></div>'}
            ${index < totalItems - 1 ? `
              <button class="btn btn-secondary" style="flex:1" onclick="Modal.close();PortfolioPage.openItem(${index+1})">
                Следующая
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
              </button>
            ` : '<div style="flex:1"></div>'}
          </div>
        ` : ''}
      </div>
    `);
  }
};
