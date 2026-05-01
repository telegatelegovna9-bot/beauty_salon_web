// ============================================
// ADMIN PAGE - YOUTH STYLE
// ============================================

const AdminPage = {
  activeTab: 'dashboard',

  async render(params = {}) {
    return `
      <div class="page page-enter" id="admin-page">
        <!-- Admin Tabs -->
        <div style="display:flex;overflow-x:auto;background:var(--gradient-glass);backdrop-filter:blur(10px);scrollbar-width:none;-webkit-overflow-scrolling:touch;">
          ${[
            { key: 'dashboard', label: '📊 Дашборд' },
            { key: 'bookings', label: '📅 Записи' },
            { key: 'masters', label: '💅 Мастера' },
            { key: 'crm', label: '👥 CRM' },
            { key: 'codes', label: '🔑 Коды' },
            { key: 'services', label: '🛠 Услуги' }
          ].map(tab => `
            <button class="category-tab ${this.activeTab === tab.key ? 'active' : ''}"
                    onclick="AdminPage.switchTab('${tab.key}')">
              ${tab.label}
            </button>
          `).join('')}
        </div>
        <div id="admin-tab-content"></div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadTab(this.activeTab);
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('#admin-page .category-tab').forEach(t => {
      t.classList.toggle('active', t.textContent.includes(
        { dashboard: 'Дашборд', bookings: 'Записи', masters: 'Мастера', crm: 'CRM', codes: 'Коды', services: 'Услуги' }[tab]
      ));
    });
    this.loadTab(tab);
  },

  async loadTab(tab) {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;
    container.innerHTML = `<div style="padding:var(--space-md)">${Utils.skeletonCard(4)}</div>`;

    switch (tab) {
      case 'dashboard': await this.loadDashboard(container); break;
      case 'bookings': await this.loadBookings(container); break;
      case 'masters': await this.loadMasters(container); break;
      case 'crm': await this.loadCRM(container); break;
      case 'codes': await this.loadCodes(container); break;
      case 'services': await this.loadServices(container); break;
    }
  },

  // ============================================
  // DASHBOARD
  // ============================================

  async loadDashboard(container) {
    try {
      const { stats, recent_bookings, top_masters } = await API.admin.dashboard();

      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-lg)">
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">📅</div>
              <div class="stat-card-value">${stats.bookings_today}</div>
              <div class="stat-card-label">Записей сегодня</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">💰</div>
              <div class="stat-card-value" style="background:var(--gradient-warm);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${Math.round(stats.revenue_today || 0).toLocaleString('ru-RU')}</div>
              <div class="stat-card-label">Выручка сегодня ₽</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">⏳</div>
              <div class="stat-card-value">${stats.bookings_pending}</div>
              <div class="stat-card-label">Ожидают</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">📊</div>
              <div class="stat-card-value" style="background:var(--gradient-cool);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${Math.round(stats.revenue_month || 0).toLocaleString('ru-RU')}</div>
              <div class="stat-card-label">Выручка за месяц ₽</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">👥</div>
              <div class="stat-card-value">${stats.total_clients}</div>
              <div class="stat-card-label">Клиентов</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">💅</div>
              <div class="stat-card-value">${stats.total_masters}</div>
              <div class="stat-card-label">Мастеров</div>
            </div>
          </div>

          <!-- Recent Bookings -->
          <div>
            <div class="section-title">📋 Последние записи</div>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
              ${recent_bookings.slice(0, 5).map(b => `
                <div class="booking-card stagger-item" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })" style="cursor:pointer">
                  <div class="booking-card-header">
                    <div>
                      <div style="font-size:20px;margin-bottom:4px;">${Utils.getStatusEmoji(b.status)}</div>
                      <div class="booking-card-service">${b.service_name}</div>
                    </div>
                    <span class="booking-card-status status-${b.status}">${Utils.getStatusInfo(b.status).label}</span>
                  </div>
                  <div class="booking-card-details">
                    <div class="booking-card-detail">📅 ${Utils.formatDate(b.booking_date, 'short')}</div>
                    <div class="booking-card-detail">⏰ ${Utils.formatTime(b.start_time)}</div>
                    <div class="booking-card-detail">👤 ${b.client_first_name || b.client_username || 'Клиент'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Top Masters -->
          ${top_masters.length > 0 ? `
            <div>
              <div class="section-title">🏆 Топ мастеров</div>
              <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
                ${top_masters.map((m, i) => `
                  <div class="menu-item stagger-item">
                    <div class="menu-item-icon" style="background:${i === 0 ? 'var(--gradient-warm)' : i === 1 ? 'var(--gradient-cool)' : 'var(--gradient-primary)'};">${i+1}</div>
                    <div class="menu-item-content">
                      <div class="menu-item-title">${m.display_name}</div>
                      <div class="menu-item-subtitle">${m.total_bookings} записей</div>
                    </div>
                    <div style="font-weight:800;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:var(--font-size-lg);">${Math.round(m.total_revenue).toLocaleString('ru-RU')} ₽</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  // ============================================
  // BOOKINGS
  // ============================================

  async loadBookings(container) {
    try {
      const { bookings } = await API.bookings.adminAll({ limit: 50 });
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${bookings.length === 0
            ? EmptyState.render('📅', 'Нет записей', '')
            : bookings.map(b => `
              <div class="booking-card stagger-item" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })" style="cursor:pointer">
                <div class="booking-card-header">
                  <div>
                    <div style="font-size:20px;margin-bottom:4px;">${Utils.getStatusEmoji(b.status)}</div>
                    <div class="booking-card-service">${b.service_name}</div>
                  </div>
                  <span class="booking-card-status status-${b.status}">${Utils.getStatusInfo(b.status).label}</span>
                </div>
                <div class="booking-card-details">
                  <div class="booking-card-detail">📅 ${Utils.formatDate(b.booking_date, 'short')}</div>
                  <div class="booking-card-detail">⏰ ${Utils.formatTime(b.start_time)}</div>
                  <div class="booking-card-detail">👤 ${b.client_first_name || b.client_username || 'Клиент'} → ${b.master_name}</div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка', e.message);
    }
  },

  // ============================================
  // MASTERS
  // ============================================

  async loadMasters(container) {
    try {
      const { users } = await API.admin.users({ role: 'master' });
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${users.length === 0
            ? EmptyState.render('💅', 'Нет мастеров', 'Создайте код доступа для мастера')
            : users.map(u => `
              <div class="card stagger-item">
                <div style="display:flex;align-items:center;gap:var(--space-md);">
                  ${Utils.renderAvatar(Utils.getUserName(u), u.avatar_url, 44)}
                  <div style="flex:1;">
                    <div style="font-weight:700;font-size:var(--font-size-lg);">${u.master_display_name || Utils.getUserName(u)}</div>
                    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">@${u.username || u.telegram_id} • ${u.master_specializations?.join(', ') || 'Нет специализаций'}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-weight:700;color:var(--color-primary);">${u.master_rating ? '★ ' + u.master_rating.toFixed(1) : 'Нет оценок'}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary)">${u.master_reviews_count || 0} отзывов</div>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка', e.message);
    }
  },

  // ============================================
  // CRM
  // ============================================

  async loadCRM(container) {
    try {
      const { clients } = await API.admin.crm();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${clients.length === 0
            ? EmptyState.render('👥', 'Нет клиентов', '')
            : clients.map(c => `
              <div class="card stagger-item">
                <div style="display:flex;align-items:center;gap:var(--space-md);">
                  ${Utils.renderAvatar(Utils.getUserName(c), c.avatar_url, 44)}
                  <div style="flex:1;">
                    <div style="font-weight:700;font-size:var(--font-size-lg);">${Utils.getUserName(c)}</div>
                    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">@${c.username || c.telegram_id} • ${c.total_visits || 0} визитов</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-weight:700;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:var(--font-size-lg);">${c.total_spent ? Utils.formatPrice(c.total_spent) : '0 ₽'}</div>
                    <span class="badge ${c.crm_status === 'vip' ? 'badge-primary' : c.crm_status === 'blocked' ? 'badge-error' : 'badge-success'}">${Config.CRM_STATUS[c.crm_status]?.label || c.crm_status}</span>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка', e.message);
    }
  },

  // ============================================
  // CODES
  // ============================================

  async loadCodes(container) {
    try {
      const { codes } = await API.admin.codes();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <button class="btn btn-primary btn-full" onclick="AdminPage.showGenerateModal()">
            🔑 Сгенерировать коды
          </button>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${codes.length === 0
              ? EmptyState.render('🔑', 'Нет кодов', 'Сгенерируйте коды для доступа мастеров')
              : codes.map(c => `
                <div class="card stagger-item">
                  <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div>
                      <div style="font-family:monospace;font-size:var(--font-size-lg);font-weight:700;letter-spacing:0.1em;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${c.code}</div>
                      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${c.role} • ${c.used_by_name || 'Не использован'}</div>
                    </div>
                    <span class="badge ${c.is_used ? 'badge-success' : 'badge-warning'}">${c.is_used ? 'Использован' : 'Активен'}</span>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка', e.message);
    }
  },

  showGenerateModal() {
    Modal.open(`
      <div>
        <div style="font-size:var(--font-size-lg);font-weight:700;margin-bottom:var(--space-md);background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          🔑 Генерация кодов
        </div>
        <div class="form-group">
          <label class="form-label">📂 Роль</label>
          <select class="form-input" id="code-role">
            <option value="master">💅 Мастер</option>
            <option value="admin">👑 Администратор</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">🔢 Количество</label>
          <input class="form-input" id="code-count" type="number" value="1" min="1" max="10">
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminPage.generateCodes()">
          🚀 Сгенерировать
        </button>
      </div>
    `, 'Генерация кодов');
  },

  async generateCodes() {
    const role = document.getElementById('code-role')?.value || 'master';
    const count = parseInt(document.getElementById('code-count')?.value) || 1;
    try {
      await API.admin.generateCodes(role, count);
      Modal.close();
      Utils.haptic('success');
      Toast.success('Коды сгенерированы! 🎉');
      await this.loadCodes(document.getElementById('admin-tab-content'));
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка генерации');
    }
  },

  // ============================================
  // SERVICES
  // ============================================

  async loadServices(container) {
    try {
      const { services } = await API.services.list();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <button class="btn btn-primary btn-full" onclick="AdminPage.showAddServiceModal()">
            🛠 Добавить услугу
          </button>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${services.length === 0
              ? EmptyState.render('🛠', 'Нет услуг', 'Добавьте услуги в салоне')
              : services.map(s => `
                <div class="service-card stagger-item">
                  <div style="font-size:32px;margin-bottom:8px;">${Utils.getCategoryInfo(s.category).emoji}</div>
                  <div class="service-card-title">${s.name}</div>
                  <div class="service-card-desc">${s.description || ''}</div>
                  <div class="service-card-footer">
                    <div class="service-card-price">${Utils.formatPrice(s.price, s.price_max)}</div>
                    <div class="service-card-duration">⏱ ${Utils.formatDuration(s.duration_minutes)}</div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка', e.message);
    }
  },

  showAddServiceModal() {
    Modal.open(`
      <div>
        <div style="font-size:var(--font-size-lg);font-weight:700;margin-bottom:var(--space-md);background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          🛠 Добавить услугу
        </div>
        <div class="form-group">
          <label class="form-label">📋 Название</label>
          <input class="form-input" id="service-name" placeholder="Название услуги">
        </div>
        <div class="form-group">
          <label class="form-label">📝 Описание</label>
          <textarea class="form-input" id="service-desc" style="min-height:80px;" placeholder="Описание услуги"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
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
        <button class="btn btn-primary btn-full" onclick="AdminPage.saveService()">
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
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка создания услуги');
    }
  }
};
