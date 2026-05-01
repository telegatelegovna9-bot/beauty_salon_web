// ============================================
// PROFILE PAGE - YOUTH STYLE
// ============================================

const ProfilePage = {
  async render(params = {}) {
    const user = Store.get('user');
    if (!user) return `<div class="page page-enter"><div class="empty-state"><div class="loading-spinner"></div></div></div>`;

    const name = Utils.getUserName(user);
    const initials = Utils.getInitials(name);
    const roleInfo = Config.ROLES[user.role] || { label: user.role, icon: '👤' };
    const clientProfile = Store.get('clientProfile');

    // Generate gradient color based on name
    const colors = ['#FF6B9D', '#C44DFF', '#00D9FF', '#FFD740', '#00E676'];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
    const avatarBg = colors[colorIndex];

    return `
      <div class="page page-enter" id="profile-page">
        <!-- Profile Header with Gradient -->
        <div class="hero" style="padding: var(--space-xl) var(--space-md);">
          <div style="width: 100px; height: 100px; border-radius: var(--radius-full); background: ${avatarBg}; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; color: white; margin: 0 auto 16px; box-shadow: var(--glow-primary); position: relative; z-index: 1;">
            ${initials}
          </div>
          <div style="font-size: var(--font-size-2xl); font-weight: 800; margin-bottom: 4px; position: relative; z-index: 1;">${name}</div>
          <div style="font-size: var(--font-size-base); opacity: 0.9; margin-bottom: 8px; position: relative; z-index: 1;">${roleInfo.icon} ${roleInfo.label}</div>
          ${user.username ? `<div style="color:rgba(255,255,255,0.6); font-size: var(--font-size-sm); position: relative; z-index: 1;">@${user.username}</div>` : ''}

          ${clientProfile ? `
            <div style="display: flex; gap: var(--space-lg); justify-content: center; margin-top: var(--space-lg); position: relative; z-index: 1;">
              <div style="text-align: center;">
                <div style="font-size: var(--font-size-2xl); font-weight: 800; background: var(--gradient-warm); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${clientProfile.total_visits || 0}</div>
                <div style="font-size: var(--font-size-xs); opacity: 0.8; text-transform: uppercase; letter-spacing: 0.05em;">Визитов</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: var(--font-size-2xl); font-weight: 800; background: var(--gradient-cool); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${clientProfile.total_spent ? Utils.formatPrice(clientProfile.total_spent) : '0 ₽'}</div>
                <div style="font-size: var(--font-size-xs); opacity: 0.8; text-transform: uppercase; letter-spacing: 0.05em;">Потрачено</div>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-md);">

          <!-- Edit Profile -->
          <div class="menu-list">
            <div class="menu-item" onclick="ProfilePage.showEditModal()">
              <div class="menu-item-icon">✏️</div>
              <div class="menu-item-content">
                <div class="menu-item-title">Редактировать профиль</div>
                <div class="menu-item-subtitle">Имя, телефон</div>
              </div>
              <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>

          <!-- Activate Code (for clients) -->
          ${user.role === 'client' ? `
            <div class="menu-list">
              <div class="menu-item" onclick="ProfilePage.showActivateCodeModal()">
                <div class="menu-item-icon">🔑</div>
                <div class="menu-item-content">
                  <div class="menu-item-title">Активировать код</div>
                  <div class="menu-item-subtitle">Стать мастером</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ` : ''}

          <!-- Master Section -->
          ${Store.isMaster() ? `
            <div style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: var(--space-md);">👩‍🎨 Мастер</div>
            <div class="menu-list">
              <div class="menu-item" onclick="App.navigate('master-profile')">
                <div class="menu-item-icon">💅</div>
                <div class="menu-item-content">
                  <div class="menu-item-title">Профиль мастера</div>
                  <div class="menu-item-subtitle">Услуги, расписание, портфолио</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              <div class="menu-item" onclick="App.navigate('master-schedule')">
                <div class="menu-item-icon">📅</div>
                <div class="menu-item-content">
                  <div class="menu-item-title">Моё расписание</div>
                  <div class="menu-item-subtitle">Рабочие дни и часы</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              <div class="menu-item" onclick="App.navigate('master-bookings')">
                <div class="menu-item-icon">📋</div>
                <div class="menu-item-content">
                  <div class="menu-item-title">Записи клиентов</div>
                  <div class="menu-item-subtitle">Управление записями</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ` : ''}

          <!-- Admin Section -->
          ${Store.isAdmin() ? `
            <div style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: var(--space-md);">👑 Администратор</div>
            <div class="menu-list">
              <div class="menu-item" onclick="App.navigate('admin')">
                <div class="menu-item-icon">👑</div>
                <div class="menu-item-content">
                  <div class="menu-item-title">Панель администратора</div>
                  <div class="menu-item-subtitle">Управление салоном</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              ${!Store.get('masterProfile') ? `
                <div class="menu-item" onclick="ProfilePage.createMasterProfile()">
                  <div class="menu-item-icon">💅</div>
                  <div class="menu-item-content">
                    <div class="menu-item-title">Создать профиль мастера</div>
                    <div class="menu-item-subtitle">Для работы с расписанием и записями</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ` : `
                <div class="menu-item" onclick="App.navigate('master-profile')">
                  <div class="menu-item-icon">💅</div>
                  <div class="menu-item-content">
                    <div class="menu-item-title">Профиль мастера</div>
                    <div class="menu-item-subtitle">Услуги, расписание, портфолио</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="menu-item" onclick="App.navigate('master-schedule')">
                  <div class="menu-item-icon">📅</div>
                  <div class="menu-item-content">
                    <div class="menu-item-title">Моё расписание</div>
                    <div class="menu-item-subtitle">Рабочие дни и часы</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="menu-item" onclick="App.navigate('master-bookings')">
                  <div class="menu-item-icon">📋</div>
                  <div class="menu-item-content">
                    <div class="menu-item-title">Записи клиентов</div>
                    <div class="menu-item-subtitle">Управление записями</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              `}
            </div>
          ` : ''}

          <!-- App Info -->
          <div style="text-align:center;padding:var(--space-xl) var(--space-md);color:var(--color-text-tertiary);font-size:var(--font-size-xs)">
            <div style="font-size:32px;margin-bottom:8px;animation:float 3s ease-in-out infinite;">✨</div>
            <div style="font-weight:600;margin-bottom:4px;">Beauty Studio</div>
            <div>Версия 1.0 • ID: ${user.telegram_id}</div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {},

  showEditModal() {
    const user = Store.get('user');
    Modal.open(`
      <div>
        <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md); background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          ✏️ Редактировать профиль
        </div>
        <div class="form-group">
          <label class="form-label">💫 Имя</label>
          <input class="form-input" id="edit-first-name" value="${user.first_name || ''}" placeholder="Ваше имя">
        </div>
        <div class="form-group">
          <label class="form-label">💫 Фамилия</label>
          <input class="form-input" id="edit-last-name" value="${user.last_name || ''}" placeholder="Ваша фамилия">
        </div>
        <div class="form-group">
          <label class="form-label">📱 Телефон</label>
          <input class="form-input" id="edit-phone" type="tel" value="${user.phone || ''}" placeholder="+7 (999) 000-00-00">
        </div>
        <button class="btn btn-primary btn-full" onclick="ProfilePage.saveProfile()">
          💾 Сохранить
        </button>
      </div>
    `, 'Редактирование');
  },

  async saveProfile() {
    const firstName = document.getElementById('edit-first-name')?.value;
    const lastName = document.getElementById('edit-last-name')?.value;
    const phone = document.getElementById('edit-phone')?.value;

    try {
      const { user } = await API.auth.updateProfile({ first_name: firstName, last_name: lastName, phone });
      Store.set('user', user);
      Modal.close();
      Utils.haptic('success');
      Toast.success('Профиль обновлён! ✨');
      App.navigate('profile');
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка сохранения');
    }
  },

  showActivateCodeModal() {
    Modal.open(`
      <div>
        <div style="text-align: center; margin-bottom: var(--space-lg);">
          <div style="font-size: 48px; margin-bottom: 8px;">🔑</div>
          <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: 8px;">Активация кода</div>
          <div style="color: var(--color-text-secondary);">Введите код доступа, чтобы получить роль мастера</div>
        </div>
        <div class="form-group">
          <label class="form-label">🔐 Код доступа</label>
          <input class="form-input" id="access-code-input" placeholder="XXXXXXXX" style="text-transform:uppercase;letter-spacing:0.1em;font-size:var(--font-size-lg);text-align:center" maxlength="8">
        </div>
        <button class="btn btn-primary btn-full" onclick="ProfilePage.activateCode()">
          🚀 Активировать
        </button>
      </div>
    `, 'Код доступа');
  },

  async activateCode() {
    const code = document.getElementById('access-code-input')?.value;
    if (!code || code.length < 6) {
      Toast.warning('Введите корректный код');
      return;
    }

    try {
      const result = await API.auth.activateCode(code);
      Store.set('user', result.user);
      if (result.master_profile) Store.set('masterProfile', result.master_profile);
      Modal.close();
      Utils.haptic('success');
      Toast.success('Код активирован! 🎉');
      App.navigate('profile');
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Неверный код');
    }
  },

  async createMasterProfile() {
    try {
      const result = await API.post('/auth/create-master-profile', { display_name: '' });
      Store.set('masterProfile', result.master_profile);
      Utils.haptic('success');
      Toast.success('Профиль мастера создан! 💅');
      App.navigate('profile');
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка создания профиля');
    }
  }
};
