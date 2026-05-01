// ============================================
// PORTFOLIO PAGE - YOUTH STYLE
// ============================================

const PortfolioPage = {
  activeCategory: 'all',
  items: [],

  async render(params = {}) {
    const categories = Object.keys(Config.CATEGORIES);
    return `
      <div class="page page-enter" id="portfolio-page">
        <div style="text-align: center; padding: var(--space-lg) var(--space-md) var(--space-md);">
          <div style="font-size: 48px; margin-bottom: 8px; animation: float 3s ease-in-out infinite;">📸</div>
          <div style="font-size: var(--font-size-xl); font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            Портфолио
          </div>
        </div>
        <div style="margin:0 calc(-1 * var(--space-md))">
          ${CategoryTabs.render(categories, this.activeCategory, 'PortfolioPage.filterCategory')}
        </div>
        <div id="portfolio-grid-container" style="padding:var(--space-md)">
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
    const tabsContainer = document.querySelector('#portfolio-page .category-tabs');
    if (tabsContainer) {
      tabsContainer.outerHTML = CategoryTabs.render(Object.keys(Config.CATEGORIES), category, 'PortfolioPage.filterCategory');
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

    if (filtered.length === 0) {
      container.innerHTML = EmptyState.render('📸', 'Нет работ', 'Портфолио пока пусто 🎨');
      return;
    }

    container.innerHTML = `
      <div class="portfolio-grid">
        ${filtered.map((item, index) => `
          <div class="portfolio-item stagger-item" 
               onclick="PortfolioPage.openItem(${index})"
               style="animation-delay: ${index * 50}ms; cursor: pointer;">
            <img src="${item.image_url}" alt="${item.title || item.category}"
                 loading="lazy"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="img-placeholder" style="display:none;aspect-ratio:1;font-size:48px;">🎨</div>
            ${item.title ? `
              <div class="portfolio-item-overlay">
                <div style="font-weight: 600; font-size: var(--font-size-sm);">${item.title}</div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  openItem(index) {
    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    const item = filtered[index];
    if (!item) return;

    Utils.haptic('light');

    Modal.open(`
      <div>
        <img src="${item.image_url}" alt="${item.title || ''}"
             style="width:100%; max-height:60vh; object-fit:contain; border-radius:var(--radius-lg); margin-bottom:var(--space-md);">
        ${item.title ? `<div style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 8px;">${item.title}</div>` : ''}
        ${item.description ? `<div style="color: var(--color-text-secondary); line-height: 1.6; margin-bottom: var(--space-md);">${item.description}</div>` : ''}
        <div class="tags" style="margin-bottom: var(--space-md);">
          <div class="tag">${Utils.getCategoryInfo(item.category).emoji} ${Utils.getCategoryInfo(item.category).label}</div>
          ${item.master_name ? `<div class="tag">👤 ${item.master_name}</div>` : ''}
        </div>
        ${index > 0 || index < filtered.length - 1 ? `
          <div style="display:flex; gap:var(--space-sm);">
            ${index > 0 ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.close(); PortfolioPage.openItem(${index-1})">← Пред.</button>` : ''}
            ${index < filtered.length - 1 ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.close(); PortfolioPage.openItem(${index+1})">След. →</button>` : ''}
          </div>
        ` : ''}
      </div>
    `, '📸 Работа');
  }
};
