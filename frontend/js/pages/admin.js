// ============================================
// ADMIN PAGE
// ============================================

const AdminPage = {
  activeTab: 'dashboard',

  async render(params = {}) {
    return `
      <div class="page page-enter" id="admin-page">
        <!-- Admin Tabs -->
        <div style="display:flex;overflow-x:auto;background:var(--color-surface);border-bottom:1px solid var(--color-border-light);scrollbar-width:none">
          ${[
            { key: 'dashboard', label: '📊 Дашборд' },
            { key: 'bookings', label: '📅 Записи' },
            { key: 'masters', label: '💅 Мастера' },
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
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-value">${stats.bookings_today}</div>
              <div class="stat-card-label">Записей сегодня</div>
            </div>
            <div class="stat-card stat-card-gold">
              <div class="stat-card-value">${Math.round(stats.revenue_today || 0).toLocaleString('ru-RU')}</div>
              <div class="stat-card-label">Выручка сегодня ₽</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.bookings_pending}</div>
              <div class="stat-card-label">Ожидают</div>
            </div>
            <div class="stat-card stat-card-gold">
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

          <!-- Recent Bookings -->
          <div>
            <div class="section-title">Последние записи</div>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
              ${recent_bookings.slice(0, 5).map(b => `
                <div class="card" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })" style="cursor:pointer">
                  <div class="card-body" style="display:flex;align-items:center;gap:var(--space-sm)">
                    <div style="flex:1">
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

          <!-- Top Masters -->
          ${top_masters.length > 0 ? `
            <div>
              <div class="section-title">Топ мастеров</div>
              ${top_masters.map((m, i) => `
                <div style="display:flex;align-items:center;gap:var(--space-md);padding:10px 0;border-bottom:1px solid var(--color-border-light)">
                  <div style="width:24px;height:24px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);font-weight:700;color:var(--color-gold)">${i+1}</div>
                  <div style="flex:1">
                    <div style="font-weight:600">${m.display_name}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">${m.total_bookings} записей</div>
                  </div>
                  <div style="font-weight:600;color:var(--color-gold-dark)">${Math.round(m.total_revenue).toLocaleString('ru-RU')} ₽</div>
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
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--color-gold)">
                      ${Utils.getInitials(Utils.getUserName(u))}
                    </div>
                    <div style="flex:1">
                      <div style="font-weight:600">${u.master_display_name || Utils.getUserName(u)}</div>
                      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">@${u.username || u.telegram_id}</div>
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
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--color-gold)">
                      ${Utils.getInitials(Utils.getUserName(c))}
                    </div>
                    <div style="flex:1">
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
          <div style="font-size:32px;font-weight:700;color:var(--color-gold);margin-bottom:4px">${Utils.getInitials(Utils.getUserName(client))}</div>
          <div style="font-weight:700;font-size:var(--font-size-lg)">${Utils.getUserName(client)}</div>
          ${client.username ? `<div style="color:var(--color-text-secondary)">@${client.username}</div>` : ''}
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
      const { services } = await API.services.list({ include_inactive: true });
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-lg)">
            <div>
              <h2 class="section-title">Управление услугами</h2>
              <p class="text-secondary">Всего услуг: ${services.length}</p>
            </div>
            <button class="btn btn-primary" onclick="AdminPage.showAddServiceModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Добавить услугу
            </button>
          </div>

          <div class="services-grid">
            ${services.map(s => `
              <div class="card service-card-admin">
                <div class="flex items-center gap-md mb-md">
                  <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 20px;">
                    ${Utils.getCategoryInfo(s.category).emoji}
                  </div>
                  <div style="flex: 1;">
                    <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: 2px;">${s.name}</h3>
                    <p class="text-secondary">${Utils.formatDuration(s.duration_minutes)}</p>
                    ${s.description ? `<p class="text-sm text-secondary mt-xs">${s.description.substring(0, 60)}${s.description.length > 60 ? '...' : ''}</p>` : ''}
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-accent);">
                      ${Utils.formatPrice(s.price)} ₽
                    </div>
                    <div style="font-size: var(--font-size-xs); color: ${s.is_active ? 'var(--color-success)' : 'var(--color-error)'};">
                      ${s.is_active ? 'Активна' : 'Неактивна'}
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex gap-xs">
                    <button class="btn btn-ghost btn-sm" onclick="AdminPage.toggleService(${s.id}, ${s.is_active})" style="color:${s.is_active ? 'var(--color-success)' : 'var(--color-error)'}">
                      ${s.is_active ? 'Деактивировать' : 'Активировать'}
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="AdminPage.editService(${s.id})">
                      Редактировать
                    </button>
                  </div>
                  <button class="btn btn-outline btn-sm" style="color: var(--color-error); border-color: var(--color-error);" onclick="AdminPage.showDeleteServiceModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    Удалить
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `
        <div class="card text-center py-xl">
          <div style="font-size: 48px; margin-bottom: var(--space-md);">⚠️</div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Ошибка загрузки</h3>
          <p class="text-secondary">${e.message || 'Попробуйте обновить страницу'}</p>
        </div>
      `;
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
  },

  showDeleteServiceModal(serviceId, serviceName) {
    Modal.open(`
      <div class="modal-content">
        <h3 class="modal-title">Удалить услугу</h3>
        <p class="modal-text">Вы уверены, что хотите удалить услугу <strong>${serviceName}</strong>? Это действие нельзя отменить.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="Modal.close()">Отмена</button>
          <button class="btn btn-danger" onclick="AdminPage.deleteService(${serviceId})">Удалить</button>
        </div>
      </div>
    `, {
      className: 'danger-modal'
    });
  },

  async deleteService(serviceId) {
    try {
      await API.services.delete(serviceId);
      Toast.success('Услуга успешно удалена');
      Modal.close();
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка при удалении услуги');
    }
  },

  editService(serviceId) {
    // Редирект на страницу редактирования или открытие модалки редактирования
    App.navigate('admin', { tab: 'services', edit: serviceId });
  }
};
