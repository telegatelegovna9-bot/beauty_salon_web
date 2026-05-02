// ============================================
// ADMIN PAGE
// ============================================

const AdminPage = {
  activeTab: 'dashboard',

  async render(params = {}) {
    return `
      <div class="page page-enter" id="admin-page">
        <!-- Admin Tabs -->
        <div style="display:flex;overflow-x:auto;background:var(--color-surface);border-bottom:1px solid var(--color-border-lighter);scrollbar-width:none">
          ${[
            { key: 'dashboard', label: '📊 Дашборд' },
            { key: 'bookings', label: '📅 Записи' },
            { key: 'masters', label: '💅 Мастера' },
            { key: 'portfolio', label: '📸 Портфолио' },
            { key: 'crm', label: '👥 CRM' },
            { key: 'codes', label: '🔑 Коды' },
            { key: 'services', label: '🛠 Услуги' }
          ].map(tab => `
            <button class="master-tab ${this.activeTab === tab.key ? 'active' : ''}"
                    onclick="AdminPage.switchTab('${tab.key}')"
                    style="white-space:nowrap;padding:14px 16px;font-size:var(--font-size-sm)">
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
    document.querySelectorAll('#admin-page .master-tab').forEach(t => {
      t.classList.toggle('active', t.textContent.trim().includes(
        { dashboard: 'Дашборд', bookings: 'Записи', masters: 'Мастера', portfolio: 'Портфолио', crm: 'CRM', codes: 'Коды', services: 'Услуги' }[tab]
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
      case 'portfolio': await this.loadPortfolio(container); break;
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
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-value">${stats.bookings_today}</div>
              <div class="stat-card-label">Записей сегодня</div>
            </div>
            <div class="stat-card stat-card-primary">
              <div class="stat-card-value">${Math.round(stats.revenue_today || 0).toLocaleString('ru-RU')}</div>
              <div class="stat-card-label">Выручка сегодня ₽</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.bookings_pending}</div>
              <div class="stat-card-label">Ожидают</div>
            </div>
            <div class="stat-card stat-card-primary">
              <div class="stat-card-value">${Math.round(stats.revenue_month || 0).toLocaleString('ru-RU')}</div>
              <div class="stat-card-label">Выручка за месяц ₽</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.total_clients}</div>
              <div class="stat-card-label">Клиентов</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.total_masters}</div>
              <div class="stat-card-label">Мастеров</div>
            </div>
          </div>

          <div>
            <div class="section-title">Последние записи</div>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
              ${recent_bookings.slice(0, 5).map(b => `
                <div class="card" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })" style="cursor:pointer">
                  <div class="card-body" style="display:flex;align-items:center;gap:var(--space-sm)">
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:600;font-size:var(--font-size-sm)">${b.service_name}</div>
                      <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">
                        ${b.client_first_name || b.client_username || 'Клиент'} → ${b.master_name}
                      </div>
                      <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary)">${Utils.formatDate(b.booking_date, 'short')} ${Utils.formatTime(b.start_time)}</div>
                    </div>
                    <span class="badge ${Utils.getStatusInfo(b.status).class}">${Utils.getStatusInfo(b.status).label}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          ${top_masters.length > 0 ? `
            <div>
              <div class="section-title">Топ мастеров</div>
              ${top_masters.map((m, i) => `
                <div style="display:flex;align-items:center;gap:var(--space-md);padding:10px 0;border-bottom:1px solid var(--color-border-lighter)">
                  <div style="width:24px;height:24px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);font-weight:700;color:var(--color-primary)">${i+1}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.display_name}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">${m.total_bookings} записей</div>
                  </div>
                  <div style="font-weight:600;color:var(--color-primary-dark)">${Math.round(m.total_revenue).toLocaleString('ru-RU')} ₽</div>
                </div>
              `).join('')}
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
              <div class="booking-card" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })">
                <div class="booking-card-header">
                  <div class="booking-date-time">
                    <div class="booking-date">${Utils.formatDate(b.booking_date, 'short')}</div>
                    <div class="booking-time">${Utils.formatTime(b.start_time)}</div>
                  </div>
                  <span class="badge ${Utils.getStatusInfo(b.status).class}">${Utils.getStatusInfo(b.status).label}</span>
                </div>
                <div class="booking-card-body">
                  <div style="font-weight:600">${b.service_name}</div>
                  <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">
                    ${b.client_first_name || b.client_username || 'Клиент'} → ${b.master_name}
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
              <div class="card">
                <div class="card-body">
                  <div style="display:flex;align-items:center;gap:var(--space-md)">
                    ${Utils.renderAvatar(Utils.getUserName(u), u.avatar_url || u.master_avatar_url, 44)}
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:600">${u.master_display_name || Utils.getUserName(u)}</div>
                      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">@${u.username || u.telegram_id}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
                      <span class="badge ${u.status === 'active' ? 'badge-active' : 'badge-cancelled'}">${u.status === 'active' ? 'Активен' : 'Заблокирован'}</span>
                      <button class="btn btn-ghost btn-sm" style="font-size:10px" onclick="AdminPage.toggleUserStatus(${u.id}, '${u.status}')">
                        ${u.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                      </button>
                    </div>
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
  // PORTFOLIO MANAGEMENT (CRUD)
  // ============================================

  async loadPortfolio(container) {
    try {
      const { items } = await API.portfolio.list();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <button class="btn btn-primary btn-full" onclick="AdminPage.showAddPortfolioModal()">
            + Добавить работу
          </button>
          <div class="filter-count" style="padding:0;font-size:var(--font-size-sm);color:var(--color-text-secondary)">
            Всего работ: ${items.length}
          </div>
          <div class="portfolio-admin-grid">
            ${items.length === 0
              ? '<div style="grid-column:1/-1">' + EmptyState.render('📸', 'Нет работ', 'Добавьте первую работу в портфолио') + '</div>'
              : items.map(item => `
                <div class="portfolio-admin-item">
                  <div style="position:relative">
                    <img src="${item.image_url}" alt="${item.title || ''}" loading="lazy">
                    <div class="portfolio-admin-item-actions">
                      <button onclick="AdminPage.showEditPortfolioModal(${item.id})" style="background:white;color:var(--color-text-primary);border:none;border-radius:var(--radius-full);width:28px;height:28px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md)">
                        ✏️
                      </button>
                      <button onclick="AdminPage.deletePortfolioItem(${item.id})" style="background:var(--color-error);color:white;border:none;border-radius:var(--radius-full);width:28px;height:28px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md)">
                        ✕
                      </button>
                    </div>
                    <div style="position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.5);color:white;padding:2px 6px;border-radius:4px;font-size:10px;backdrop-filter:blur(4px)">
                      ${Utils.getCategoryInfo(item.category).emoji} ${Utils.getCategoryInfo(item.category).label}
                    </div>
                  </div>
                  <div class="portfolio-admin-item-info">
                    <div class="portfolio-admin-item-title">${item.title || 'Без названия'}</div>
                    ${item.master_name ? `<div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary)">👤 ${item.master_name}</div>` : ''}
                    ${item.price ? `<div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-primary-dark);margin-top:2px">${Utils.formatPrice(item.price)}</div>` : ''}
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

  showAddPortfolioModal() {
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">URL изображения</label>
          <input class="form-input" id="admin-portfolio-url" placeholder="https://...">
        </div>
        <div class="form-group">
          <label class="form-label">Категория</label>
          <select class="form-input form-select" id="admin-portfolio-category">
            ${Config.PORTFOLIO_CATEGORIES.map(c =>
              `<option value="${c.value}">${c.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Название</label>
          <input class="form-input" id="admin-portfolio-title" placeholder="Название работы">
        </div>
        <div class="form-group">
          <label class="form-label">Описание</label>
          <textarea class="form-input form-textarea" id="admin-portfolio-desc" placeholder="Описание работы" style="min-height:60px"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Цена (₽) — опционально</label>
          <input class="form-input" id="admin-portfolio-price" type="number" placeholder="Например: 2500" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Мастер</label>
          <select class="form-input form-select" id="admin-portfolio-master">
            <option value="">Выберите мастера</option>
          </select>
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminPage.createPortfolioItem()">Добавить</button>
      </div>
    `, 'Новая работа');

    // Load masters for the select
    this._loadMastersForSelect();
  },

  async _loadMastersForSelect() {
    try {
      const { users } = await API.admin.users({ role: 'master' });
      const select = document.getElementById('admin-portfolio-master');
      if (select) {
        select.innerHTML = '<option value="">Выберите мастера</option>' +
          users.map(u => `<option value="${u.master_display_name}">${u.master_display_name || Utils.getUserName(u)}</option>`).join('');
      }
    } catch (e) {}
  },

  async createPortfolioItem() {
    const url = document.getElementById('admin-portfolio-url')?.value;
    const category = document.getElementById('admin-portfolio-category')?.value;
    const title = document.getElementById('admin-portfolio-title')?.value;
    const description = document.getElementById('admin-portfolio-desc')?.value;
    const price = document.getElementById('admin-portfolio-price')?.value;

    if (!url) { Toast.error('Введите URL изображения'); return; }
    if (!category) { Toast.error('Выберите категорию'); return; }

    try {
      await API.portfolio.create({
        image_url: url, category, title: title || null,
        description: description || null,
        price: price ? parseFloat(price) : null
      });
      Modal.close();
      Toast.success('Работа добавлена');
      await this.loadPortfolio(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  showEditPortfolioModal(itemId) {
    const items = this._allPortfolioItems || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div style="text-align:center;margin-bottom:var(--space-sm)">
          <img src="${item.image_url}" style="max-height:200px;border-radius:var(--radius-md);object-fit:contain">
        </div>
        <div class="form-group">
          <label class="form-label">Категория</label>
          <select class="form-input form-select" id="edit-portfolio-category">
            ${Config.PORTFOLIO_CATEGORIES.map(c =>
              `<option value="${c.value}" ${item.category === c.value ? 'selected' : ''}>${c.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Название</label>
          <input class="form-input" id="edit-portfolio-title" value="${item.title || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Описание</label>
          <textarea class="form-input form-textarea" id="edit-portfolio-desc" style="min-height:60px">${item.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Цена (₽)</label>
          <input class="form-input" id="edit-portfolio-price" type="number" value="${item.price || ''}" min="0">
        </div>
        <div class="form-group">
          <label class="toggle-label" style="display:flex;align-items:center;gap:var(--space-sm);font-size:var(--font-size-sm)">
            <label class="toggle">
              <input type="checkbox" id="edit-portfolio-featured" ${item.is_featured ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span>Показать в избранном</span>
          </label>
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminPage.updatePortfolioItem(${item.id})">Сохранить</button>
      </div>
    `, 'Редактировать работу');
  },

  async updatePortfolioItem(itemId) {
    const category = document.getElementById('edit-portfolio-category')?.value;
    const title = document.getElementById('edit-portfolio-title')?.value;
    const description = document.getElementById('edit-portfolio-desc')?.value;
    const price = document.getElementById('edit-portfolio-price')?.value;
    const isFeatured = document.getElementById('edit-portfolio-featured')?.checked;

    try {
      await API.portfolio.update(itemId, {
        category, title: title || null,
        description: description || null,
        price: price ? parseFloat(price) : null,
        is_featured: isFeatured ? 1 : 0
      });
      Modal.close();
      Toast.success('Работа обновлена');
      await this.loadPortfolio(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  deletePortfolioItem(itemId) {
    ConfirmDialog.open(
      'Удалить работу?',
      'Это действие нельзя отменить. Работа будет удалена из портфолио.',
      async () => {
        try {
          await API.portfolio.delete(itemId);
          Toast.success('Работа удалена');
          await this.loadPortfolio(document.getElementById('admin-tab-content'));
        } catch (e) {
          Toast.error(e.message || 'Ошибка удаления');
        }
      },
      { confirmText: 'Удалить', icon: '🗑️', variant: 'danger' }
    );
  },

  // ============================================
  // CRM
  // ============================================

  async loadCRM(container) {
    try {
      const { clients } = await API.admin.crm({ limit: 50 });
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${clients.length === 0
            ? EmptyState.render('👥', 'Нет клиентов', '')
            : clients.map(c => `
              <div class="card" onclick="AdminPage.openClientModal(${c.id})">
                <div class="card-body">
                  <div style="display:flex;align-items:center;gap:var(--space-md)">
                    ${Utils.renderAvatar(Utils.getUserName(c), c.avatar_url, 44)}
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:600">${Utils.getUserName(c)}</div>
                      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">
                        ${c.total_visits} визитов · ${Math.round(c.total_spent || 0).toLocaleString('ru-RU')} ₽
                      </div>
                      ${c.last_visit_date ? `<div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary)">Последний визит: ${Utils.formatDate(c.last_visit_date, 'short')}</div>` : ''}
                    </div>
                    <span class="badge badge-${c.crm_status}">${Config.CRM_STATUS[c.crm_status]?.label || c.crm_status}</span>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
      this._clients = clients;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка', e.message);
    }
  },

  openClientModal(userId) {
    const client = this._clients?.find(c => c.id === userId);
    if (!client) return;

    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div style="text-align:center">
          ${Utils.renderAvatar(Utils.getUserName(client), client.avatar_url, 64)}
          <div style="font-weight:700;font-size:var(--font-size-lg);margin-top:var(--space-sm)">${Utils.getUserName(client)}</div>
          ${client.username ? `<div style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">@${client.username}</div>` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">CRM Статус</label>
          <select class="form-input form-select" id="crm-status-select">
            ${Object.entries(Config.CRM_STATUS).map(([key, val]) =>
              `<option value="${key}" ${client.crm_status === key ? 'selected' : ''}>${val.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Заметки</label>
          <textarea class="form-input form-textarea" id="crm-notes">${client.notes || ''}</textarea>
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminPage.saveCRM(${userId})">Сохранить</button>
      </div>
    `, Utils.getUserName(client));
  },

  async saveCRM(userId) {
    const status = document.getElementById('crm-status-select')?.value;
    const notes = document.getElementById('crm-notes')?.value;
    try {
      await API.admin.updateCrm(userId, { crm_status: status, notes });
      Modal.close();
      Toast.success('CRM обновлён');
      await this.loadCRM(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  // ============================================
  // ACCESS CODES
  // ============================================

  async loadCodes(container) {
    try {
      const { codes } = await API.accessCodes.list();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <button class="btn btn-primary btn-full" onclick="AdminPage.createCode()">
            + Создать код доступа
          </button>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${codes.length === 0
              ? EmptyState.render('🔑', 'Нет кодов', 'Создайте код для нового мастера')
              : codes.map(code => `
                <div class="card">
                  <div class="card-body">
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <div>
                        <div style="font-family:monospace;font-size:var(--font-size-lg);font-weight:700;letter-spacing:0.1em;color:${code.is_active && !code.used_by ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'}">${code.code}</div>
                        <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary);margin-top:2px">
                          ${code.used_by ? `Использован: ${code.used_by_first_name || code.used_by_username || 'Пользователь'}` : (code.is_active ? 'Активен' : 'Деактивирован')}
                          ${code.expires_at ? ` · до ${Utils.formatDate(code.expires_at.split('T')[0], 'short')}` : ''}
                        </div>
                      </div>
                      <div style="display:flex;gap:8px;align-items:center">
                        ${code.is_active && !code.used_by ? `
                          <button class="btn btn-ghost btn-sm" onclick="AdminPage.copyCode('${code.code}')">📋</button>
                          <button class="btn btn-danger btn-sm" onclick="AdminPage.deleteCode(${code.id})">✕</button>
                        ` : ''}
                      </div>
                    </div>
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

  async createCode() {
    try {
      const { code } = await API.accessCodes.create({ role: 'master' });
      Utils.haptic('success');
      Toast.success(`Код создан: ${code.code}`);
      await this.loadCodes(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка создания кода');
    }
  },

  copyCode(code) {
    navigator.clipboard?.writeText(code).then(() => Toast.success('Код скопирован!')).catch(() => Toast.info(code));
  },

  async deleteCode(codeId) {
    try {
      await API.accessCodes.delete(codeId);
      Toast.success('Код деактивирован');
      await this.loadCodes(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
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
            + Добавить услугу
          </button>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${services.map(s => `
              <div class="service-card">
                <div class="service-icon">${Utils.getCategoryInfo(s.category).emoji}</div>
                <div class="service-info">
                  <div class="service-name">${s.name}</div>
                  <div class="service-meta">${Utils.formatDuration(s.duration_minutes)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="service-price">${Utils.formatPrice(s.price)}</div>
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.toggleService(${s.id}, ${s.is_active})" style="color:${s.is_active ? 'var(--color-success)' : 'var(--color-error)'}">
                    ${s.is_active ? '✓' : '✕'}
                  </button>
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
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Название</label>
          <input class="form-input" id="svc-name" placeholder="Название услуги">
        </div>
        <div class="form-group">
          <label class="form-label">Категория</label>
          <select class="form-input form-select" id="svc-category">
            ${Object.entries(Config.CATEGORIES).map(([key, val]) =>
              `<option value="${key}">${val.emoji} ${val.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Длительность (мин)</label>
          <input class="form-input" id="svc-duration" type="number" value="60">
        </div>
        <div class="form-group">
          <label class="form-label">Цена (₽)</label>
          <input class="form-input" id="svc-price" type="number" value="1000">
        </div>
        <div class="form-group">
          <label class="form-label">Описание</label>
          <textarea class="form-input form-textarea" id="svc-desc" style="min-height:60px"></textarea>
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminPage.createService()">Создать</button>
      </div>
    `, 'Новая услуга');
  },

  async createService() {
    const name = document.getElementById('svc-name')?.value;
    const category = document.getElementById('svc-category')?.value;
    const duration = parseInt(document.getElementById('svc-duration')?.value);
    const price = parseFloat(document.getElementById('svc-price')?.value);
    const description = document.getElementById('svc-desc')?.value;

    if (!name || !category || !duration || !price) {
      Toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      await API.services.create({ name, category, duration_minutes: duration, price, description });
      Modal.close();
      Toast.success('Услуга создана');
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async toggleService(serviceId, currentActive) {
    try {
      await API.services.update(serviceId, { is_active: currentActive ? 0 : 1 });
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await API.admin.updateUser(userId, { status: newStatus });
      Toast.success(`Пользователь ${newStatus === 'active' ? 'разблокирован' : 'заблокирован'}`);
      await this.loadMasters(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  }
};
