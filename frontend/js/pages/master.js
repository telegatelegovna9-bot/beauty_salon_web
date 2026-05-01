// ============================================
// MASTER DETAIL PAGE (public view) - YOUTH STYLE
// ============================================

const MasterDetailPage = {
  master: null,
  activeTab: 'services',

  async render(params = {}) {
    return `<div class="page page-enter" id="master-detail-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(3)}</div>
    </div>`;
  },

  async afterRender(params = {}) {
    if (!params.masterId) { App.navigate('home'); return; }
    await this.loadMaster(params.masterId);
  },

  async loadMaster(masterId) {
    const container = document.getElementById('master-detail-page');
    if (!container) return;

    try {
      const { master, services, portfolio, reviews } = await API.masters.get(masterId);
      this.master = master;
      const name = master.display_name || Utils.getMasterName(master);
      const specs = Array.isArray(master.specializations) ? master.specializations : [];

      container.innerHTML = `
        <!-- Master Header with Gradient -->
        <div class="hero" style="padding: var(--space-xl) var(--space-md); position: relative;">
          <div style="font-size: 64px; margin-bottom: 12px; animation: float 3s ease-in-out infinite;">💇‍♀️</div>
          ${Utils.renderAvatar(name, master.avatar_url, 80)}
          <div style="font-size: var(--font-size-2xl); font-weight: 800; margin: 12px 0 8px; position: relative; z-index: 1;">${name}</div>
          ${specs.length > 0 ? `<div style="font-size: var(--font-size-sm); opacity: 0.9; margin-bottom: 8px; position: relative; z-index: 1;">${specs.map(s => `✨ ${s}`).join(' • ')}</div>` : ''}
          ${master.rating ? `
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:8px; position: relative; z-index: 1;">
              <span style="color: #FFD740; font-size: 18px;">★</span>
              <span style="font-weight:600; font-size: var(--font-size-lg);">${master.rating.toFixed(1)}</span>
              <span style="opacity:0.7; font-size: var(--font-size-sm)">(${master.reviews_count} отзывов)</span>
            </div>
          ` : ''}
          ${master.bio ? `<div style="opacity:0.8; font-size: var(--font-size-sm); margin-top: var(--space-md); line-height: 1.6; position: relative; z-index: 1;">${master.bio}</div>` : ''}
          <button class="btn btn-primary btn-lg" style="margin-top: var(--space-lg); position: relative; z-index: 1;" onclick="App.navigate('book', { masterId: ${master.id} })">
            💅 Записаться к мастеру
          </button>
        </div>

        <!-- Tabs -->
        <div style="display:flex; gap:0; padding: 0 var(--space-md); background: var(--gradient-glass); backdrop-filter: blur(10px);">
          <button class="category-tab ${this.activeTab === 'services' ? 'active' : ''}" onclick="MasterDetailPage.switchTab('services')">💅 Услуги</button>
          <button class="category-tab ${this.activeTab === 'portfolio' ? 'active' : ''}" onclick="MasterDetailPage.switchTab('portfolio')">📸 Портфолио</button>
          <button class="category-tab ${this.activeTab === 'reviews' ? 'active' : ''}" onclick="MasterDetailPage.switchTab('reviews')">⭐ Отзывы</button>
        </div>

        <!-- Tab Content -->
        <div id="master-tab-content" style="padding: var(--space-md);">
          ${this.renderServicesTab(services)}
        </div>
      `;

      this._services = services;
      this._portfolio = portfolio;
      this._reviews = reviews;

    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('#master-detail-page .category-tab').forEach(t => {
      t.classList.toggle('active', t.textContent.includes(
        { services: 'Услуги', portfolio: 'Портфолио', reviews: 'Отзывы' }[tab]
      ));
    });
    const content = document.getElementById('master-tab-content');
    if (!content) return;

    switch (tab) {
      case 'services': content.innerHTML = this.renderServicesTab(this._services); break;
      case 'portfolio': content.innerHTML = this.renderPortfolioTab(this._portfolio); break;
      case 'reviews': content.innerHTML = this.renderReviewsTab(this._reviews); break;
    }
  },

  renderServicesTab(services) {
    if (!services || services.length === 0) {
      return EmptyState.render('💅', 'Нет услуг', 'Мастер пока не добавил услуги');
    }
    return `<div style="display: flex; flex-direction: column; gap: var(--space-md);">
      ${services.map(s => ServiceCard.render(s, {
        onClick: `App.navigate('book', { serviceId: ${s.id}, masterId: ${this.master?.id} })`
      })).join('')}
    </div>`;
  },

  renderPortfolioTab(portfolio) {
    if (!portfolio || portfolio.length === 0) {
      return EmptyState.render('📸', 'Нет работ', 'Портфолио пока пусто 🎨');
    }
    return `<div class="portfolio-grid">
      ${portfolio.map((item, i) => `
        <div class="portfolio-item stagger-item" onclick="MasterDetailPage.openPortfolioItem(${i})" style="animation-delay: ${i * 50}ms; cursor: pointer;">
          <img src="${item.image_url}" alt="${item.title || ''}" loading="lazy" onerror="this.style.display='none'">
        </div>
      `).join('')}
    </div>`;
  },

  renderReviewsTab(reviews) {
    if (!reviews || reviews.length === 0) {
      return EmptyState.render('⭐', 'Нет отзывов', 'Будьте первым, кто оставит отзыв');
    }
    return `<div style="display: flex; flex-direction: column; gap: var(--space-md);">
      ${reviews.map(r => `
        <div class="card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="font-weight: 600;">${r.first_name || r.username || 'Клиент'}</div>
            <div style="color: #FFD740; font-size: var(--font-size-lg);">${Utils.renderStars(r.rating)}</div>
          </div>
          ${r.comment ? `<div style="color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.6;">${r.comment}</div>` : ''}
          <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); margin-top: 8px;">${Utils.formatDate(r.created_at?.split('T')[0], 'short')}</div>
        </div>
      `).join('')}
    </div>`;
  },

  openPortfolioItem(index) {
    const item = this._portfolio[index];
    if (!item) return;
    Utils.haptic('light');
    Modal.open(`
      <div>
        <img src="${item.image_url}" style="width:100%; max-height:60vh; object-fit:contain; border-radius:var(--radius-lg); margin-bottom:var(--space-md);">
        ${item.title ? `<div style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 8px;">${item.title}</div>` : ''}
      </div>
    `, '📸 Работа');
  }
};

// ============================================
// MASTER PROFILE PAGE (own profile management) - YOUTH STYLE
// ============================================

const MasterProfilePage = {
  profile: null,

  async render(params = {}) {
    return `<div class="page page-enter" id="master-profile-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(3)}</div>
    </div>`;
  },

  async afterRender() {
    await this.loadProfile();
  },

  async loadProfile() {
    const container = document.getElementById('master-profile-page');
    if (!container) return;

    try {
      const { profile, services, schedule } = await API.masters.me();
      this.profile = profile;
      const specs = Array.isArray(profile.specializations) ? profile.specializations : [];

      container.innerHTML = `
        <div style="padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-lg);">
          <!-- Profile Card -->
          <div class="card">
            <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md);">
              ${Utils.renderAvatar(profile.display_name, profile.avatar_url, 60)}
              <div>
                <div style="font-size: var(--font-size-xl); font-weight: 700;">${profile.display_name}</div>
                <div style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">${specs.join(', ') || 'Нет специализаций'}</div>
              </div>
            </div>
            ${profile.bio ? `<div style="color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.6; margin-bottom: var(--space-md);">${profile.bio}</div>` : ''}
            <button class="btn btn-secondary btn-full" onclick="MasterProfilePage.showEditModal()">
              ✏️ Редактировать профиль
            </button>
          </div>

          <!-- Services -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
              <div class="section-title" style="margin-bottom: 0;">💅 Мои услуги</div>
              <button class="btn btn-ghost btn-sm" onclick="MasterProfilePage.showAddServiceModal()">+ Добавить</button>
            </div>
            <div id="services-list" style="display: flex; flex-direction: column; gap: var(--space-sm);">
              ${services.length === 0
                ? `<div style="text-align: center; padding: var(--space-lg); color: var(--color-text-secondary);">Нет услуг. Добавьте услуги, которые вы оказываете.</div>`
                : services.map(s => `
                  <div class="service-card" onclick="MasterProfilePage.editService(${s.id})">
                    <div style="font-size: 24px; margin-bottom: 8px;">${Utils.getCategoryInfo(s.category).emoji}</div>
                    <div style="font-weight: 600; margin-bottom: 4px;">${s.name}</div>
                    <div style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">${Utils.formatPrice(s.price)} • ${Utils.formatDuration(s.duration_minutes)}</div>
                  </div>
                `).join('')}
            </div>
          </div>

          <!-- Schedule -->
          <div>
            <div class="section-title" style="margin-bottom: var(--space-md);">📅 График работы</div>
            <div id="schedule-list" style="display: flex; flex-direction: column; gap: var(--space-sm);">
              ${schedule.length === 0
                ? `<div style="text-align: center; padding: var(--space-lg); color: var(--color-text-secondary);">График не настроен</div>`
                : schedule.map(s => `
                  <div class="card" style="padding: var(--space-md);">
                    <div style="font-weight: 600; margin-bottom: 4px;">${Config.DAYS_FULL[s.day_of_week]}</div>
                    <div style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                      ${s.is_working ? `${s.start_time} — ${s.end_time}` : 'Выходной'}
                    </div>
                  </div>
                `).join('')}
            </div>
            <button class="btn btn-secondary btn-full" style="margin-top: var(--space-md);" onclick="App.navigate('master-schedule')">
              ⚙️ Редактировать график
            </button>
          </div>
        </div>
      `;

    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  showEditModal() {
    const profile = this.profile;
    Modal.open(`
      <div>
        <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md); background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          ✏️ Редактировать профиль
        </div>
        <div class="form-group">
          <label class="form-label">👤 Отображаемое имя</label>
          <input class="form-input" id="edit-display-name" value="${profile.display_name || ''}" placeholder="Ваше имя">
        </div>
        <div class="form-group">
          <label class="form-label">📝 О себе (bio)</label>
          <textarea class="form-input" id="edit-bio" style="min-height: 100px;">${profile.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">✨ Специализации (через запятую)</label>
          <input class="form-input" id="edit-specs" value="${Array.isArray(profile.specializations) ? profile.specializations.join(', ') : ''}" placeholder="Маникюр, Педикюр">
        </div>
        <button class="btn btn-primary btn-full" onclick="MasterProfilePage.saveProfile()">
          💾 Сохранить
        </button>
      </div>
    `, 'Редактирование');
  },

  async saveProfile() {
    const displayName = document.getElementById('edit-display-name')?.value;
    const bio = document.getElementById('edit-bio')?.value;
    const specs = document.getElementById('edit-specs')?.value.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await API.masters.updateProfile({ display_name: displayName, bio, specializations: specs });
      Modal.close();
      Utils.haptic('success');
      Toast.success('Профиль обновлён! ✨');
      await this.loadProfile();
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка сохранения');
    }
  },

  showAddServiceModal() {
    Modal.open(`
      <div>
        <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md); background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          💅 Добавить услугу
        </div>
        <div class="form-group">
          <label class="form-label">📋 Название</label>
          <input class="form-input" id="service-name" placeholder="Название услуги">
        </div>
        <div class="form-group">
          <label class="form-label">📝 Описание</label>
          <textarea class="form-input" id="service-desc" style="min-height: 80px;" placeholder="Описание услуги"></textarea>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
          <div class="form-group">
            <label class="form-label">💰 Цена (₽)</label>
            <input class="form-input" id="service-price" type="number" placeholder="1000">
          </div>
          <div class="form-group">
            <label class="form-label">⏱ Длительность (мин)</label>
            <input class="form-input" id="service-duration" type="number" placeholder="60">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">📂 Категория</label>
          <select class="form-input" id="service-category">
            ${Object.entries(Config.CATEGORIES).map(([key, val]) => `<option value="${key}">${val.emoji} ${val.label}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary btn-full" onclick="MasterProfilePage.saveService()">
          💾 Сохранить услугу
        </button>
      </div>
    `, 'Новая услуга');
  },

  async saveService() {
    const name = document.getElementById('service-name')?.value;
    const desc = document.getElementById('service-desc')?.value;
    const price = parseInt(document.getElementById('service-price')?.value);
    const duration = parseInt(document.getElementById('service-duration')?.value);
    const category = document.getElementById('service-category')?.value;

    if (!name || !price || !duration) {
      Toast.warning('Заполните обязательные поля');
      return;
    }

    try {
      await API.services.create({ name, description: desc, price, duration_minutes: duration, category });
      Modal.close();
      Utils.haptic('success');
      Toast.success('Услуга добавлена! 🎉');
      await this.loadProfile();
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка создания услуги');
    }
  }
};
