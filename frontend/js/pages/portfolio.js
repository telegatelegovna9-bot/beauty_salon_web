// ============================================
// PORTFOLIO PAGE - Premium Redesign
// ============================================

const PortfolioPage = {
  activeCategory: 'all',
  items: [],

  async render(params = {}) {
    const categories = Object.keys(Config.CATEGORIES);
    
    return `
      <div class="page page-enter fade-in" id="portfolio-page">
        <!-- Hero section -->
        <div class="hero-section" style="padding-bottom: var(--space-lg);">
          <h1 class="hero-title">Наше портфолио</h1>
          <p class="hero-subtitle">Результаты работы наших мастеров</p>
        </div>

        <!-- Category filters -->
        <div class="px-md mb-lg">
          <div class="chips-container">
            <div class="chip ${this.activeCategory === 'all' ? 'active' : ''}" 
                 onclick="PortfolioPage.filterCategory('all')">
              Все работы
            </div>
            ${categories.map(cat => {
              const catInfo = Utils.getCategoryInfo(cat);
              return `
                <div class="chip ${this.activeCategory === cat ? 'active' : ''}" 
                     onclick="PortfolioPage.filterCategory('${cat}')">
                  ${catInfo.emoji} ${catInfo.label}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Portfolio grid -->
        <div id="portfolio-grid-container" class="px-md">
          <div class="portfolio-grid">
            ${Array(6).fill(`
              <div class="portfolio-item skeleton" style="aspect-ratio: 1;"></div>
            `).join('')}
          </div>
        </div>

        <!-- Stats -->
        <div class="card mx-md mt-xl">
          <div class="flex items-center justify-between">
            <div>
              <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-xs);">Более 1000 довольных клиентов</h3>
              <p class="text-secondary">Мы создаем красоту с 2018 года</p>
            </div>
            <div style="font-size: 32px; color: var(--color-accent);">
              ✨
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender(params = {}) {
    await this.loadPortfolio();
  },

  filterCategory(category) {
    this.activeCategory = category;
    
    // Update active state of chips
    document.querySelectorAll('#portfolio-page .chip').forEach(chip => {
      chip.classList.remove('active');
    });
    
    const activeChip = document.querySelector(`#portfolio-page .chip[onclick*="${category}"]`);
    if (activeChip) {
      activeChip.classList.add('active');
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
      if (container) {
        container.innerHTML = `
          <div class="card text-center py-xl">
            <div style="font-size: 48px; margin-bottom: var(--space-md);">⚠️</div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Ошибка загрузки</h3>
            <p class="text-secondary">Попробуйте обновить страницу</p>
          </div>
        `;
      }
    }
  },

  renderGrid() {
    const container = document.getElementById('portfolio-grid-container');
    if (!container) return;

    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card text-center py-xl">
          <div style="font-size: 48px; margin-bottom: var(--space-md);">📸</div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Нет работ</h3>
          <p class="text-secondary mb-lg">В этой категории пока нет работ</p>
          <button class="btn btn-secondary" onclick="PortfolioPage.filterCategory('all')">
            Показать все работы
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="portfolio-grid">
        ${filtered.map((item, index) => `
          <div class="portfolio-item press-effect" 
               onclick="PortfolioPage.openItem(${index})"
               style="animation-delay: ${index * 30}ms;">
            <div class="portfolio-image-container">
              <img src="${item.image_url}" 
                   alt="${item.title || item.category}" 
                   class="portfolio-image"
                   loading="lazy"
                   onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGQUY3RjciLz48cGF0aCBkPSJNODAgODBMMTIwIDEyMEwxNjAgODAiIHN0cm9rZT0iI0VBRDdENyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjIwIiBmaWxsPSIjRkY2QjlBIiBvcGFjaXR5PSIwLjIiLz48L3N2Zz4='">
              <div class="portfolio-overlay">
                <div class="portfolio-category">
                  ${Utils.getCategoryInfo(item.category).emoji}
                  ${Utils.getCategoryInfo(item.category).label}
                </div>
                ${item.title ? `<div class="portfolio-title">${item.title}</div>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${filtered.length > 12 ? `
        <div class="text-center mt-xl">
          <button class="btn btn-secondary" onclick="PortfolioPage.loadMore()">
            Показать еще
          </button>
        </div>
      ` : ''}
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
      <div class="portfolio-modal">
        <div class="portfolio-modal-image">
          <img src="${item.image_url}" 
               alt="${item.title || ''}" 
               style="width: 100%; max-height: 60vh; object-fit: contain; border-radius: var(--radius-lg);">
        </div>
        
        <div class="portfolio-modal-content">
          ${item.title ? `<h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: var(--space-sm);">${item.title}</h2>` : ''}
          
          <div class="flex items-center gap-sm mb-md">
            <span class="chip active" style="font-size: var(--font-size-sm);">
              ${Utils.getCategoryInfo(item.category).emoji}
              ${Utils.getCategoryInfo(item.category).label}
            </span>
            ${item.master_name ? `
              <span class="chip" style="font-size: var(--font-size-sm);">
                👤 ${item.master_name}
              </span>
            ` : ''}
          </div>
          
          ${item.description ? `
            <div style="color: var(--color-text-secondary); line-height: 1.6; margin-bottom: var(--space-lg);">
              ${item.description}
            </div>
          ` : ''}
          
          <div class="flex items-center justify-between">
            <div>
              <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">Дата публикации</div>
              <div style="font-weight: 600;">${Utils.formatDate(item.created_at, true)}</div>
            </div>
            
            ${Store.isAdmin() ? `
              <div class="flex gap-sm">
                <button class="btn btn-outline btn-sm" onclick="PortfolioPage.editItem(${item.id})">
                  ✏️ Редактировать
                </button>
                <button class="btn btn-outline btn-sm" style="color: var(--color-error);" onclick="PortfolioPage.deleteItem(${item.id})">
                  🗑️ Удалить
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `, { closeButton: true });
  },

  async deleteItem(itemId) {
    // Получаем название работы для отображения в модалке
    const item = this.items.find(i => i.id === itemId);
    const itemName = item ? item.title : 'эту работу';
    
    Modal.open(`
      <div class="modal-content">
        <h3 class="modal-title">Удалить работу</h3>
        <p class="modal-text">Вы уверены, что хотите удалить <strong>${itemName}</strong> из портфолио? Это действие нельзя отменить.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="Modal.close()">Отмена</button>
          <button class="btn btn-danger" onclick="PortfolioPage.confirmDeleteItem(${itemId})">Удалить</button>
        </div>
      </div>
    `, {
      className: 'danger-modal'
    });
  },

  async confirmDeleteItem(itemId) {
    try {
      await API.portfolio.delete(itemId);
      Toast.success('Работа успешно удалена');
      Modal.close();
      await this.loadPortfolio();
    } catch (e) {
      Toast.error(e.message || 'Ошибка при удалении работы');
    }
  },

  editItem(itemId) {
    // Implementation for editing portfolio item
    console.log('Edit item:', itemId);
    Toast.info('Редактирование в разработке');
  },

  loadMore() {
    // Implementation for loading more items
    Toast.info('Загрузка дополнительных работ...');
  }
};
