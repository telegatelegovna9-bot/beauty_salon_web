// ============================================
// PROFILE PAGE
// ============================================

const ProfilePage = {
  async render(params = {}) {
    const user = Store.get('user');
    if (!user) return `<div class="page page-enter"><div class="empty-state"><div class="loading-spinner"></div></div></div>`;

    const name = Utils.getUserName(user);
    const initials = Utils.getInitials(name);
    const roleInfo = Config.ROLES[user.role] || { label: user.role, icon: '👤' };
    const clientProfile = Store.get('clientProfile');
    const userAvatar = user.avatar_url || null;

    return `
      <div class="page page-enter" id="profile-page">
        <!-- Profile Header -->
        <div class="profile-header">
          ${Utils.renderAvatarWithUpload(name, userAvatar, 80, 'ProfilePage.showAvatarUpload()')}
          <div class="profile-name">${name}</div>
          <div class="profile-role">${roleInfo.icon} ${roleInfo.label}</div>
          ${user.username ? `<div style="color:rgba(255,255,255,0.6);font-size:var(--font-size-sm)">@${user.username}</div>` : ''}

          ${clientProfile ? `
            <div class="profile-stats">
              <div class="profile-stat">
                <div class="profile-stat-value">${clientProfile.total_visits || 0}</div>
                <div class="profile-stat-label">Визитов</div>
              </div>
              <div class="profile-stat">
                <div class="profile-stat-value">${clientProfile.total_spent ? Math.round(clientProfile.total_spent / 1000) + 'k' : '0'}</div>
                <div class="profile-stat-label">Потрачено ₽</div>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">

          <!-- Edit Profile -->
          <div class="menu-list">
            <div class="menu-item" onclick="ProfilePage.showEditModal()">
              <div class="menu-item-icon">✏️</div>
              <div class="menu-item-text">
                <div class="menu-item-title">Редактировать профиль</div>
                <div class="menu-item-subtitle">Имя, телефон, фото</div>
              </div>
              <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>

          <!-- Activate Code (for clients) -->
          ${user.role === 'client' ? `
            <div class="menu-list">
              <div class="menu-item" onclick="ProfilePage.showActivateCodeModal()">
                <div class="menu-item-icon">🔑</div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Активировать код</div>
                  <div class="menu-item-subtitle">Стать мастером</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ` : ''}

          <!-- Master Section -->
          ${Store.isMaster() ? `
            <div class="menu-list">
              <div class="menu-item" onclick="App.navigate('master-profile')">
                <div class="menu-item-icon">💅</div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Профиль мастера</div>
                  <div class="menu-item-subtitle">Услуги, расписание, портфолио</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              <div class="menu-item" onclick="App.navigate('master-schedule')">
                <div class="menu-item-icon">📅</div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Моё расписание</div>
                  <div class="menu-item-subtitle">Рабочие дни и часы</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              <div class="menu-item" onclick="App.navigate('master-bookings')">
                <div class="menu-item-icon">📋</div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Записи клиентов</div>
                  <div class="menu-item-subtitle">Управление записями</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ` : ''}

          <!-- Admin Section -->
          ${Store.isAdmin() ? `
            <div class="menu-list">
              <div class="menu-item" onclick="App.navigate('admin')">
                <div class="menu-item-icon">👑</div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Панель администратора</div>
                  <div class="menu-item-subtitle">Управление салоном</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              ${!Store.get('masterProfile') ? `
                <div class="menu-item" onclick="ProfilePage.createMasterProfile()">
                  <div class="menu-item-icon">💅</div>
                  <div class="menu-item-text">
                    <div class="menu-item-title">Создать профиль мастера</div>
                    <div class="menu-item-subtitle">Для работы с расписанием и записями</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ` : `
                <div class="menu-item" onclick="App.navigate('master-profile')">
                  <div class="menu-item-icon">💅</div>
                  <div class="menu-item-text">
                    <div class="menu-item-title">Профиль мастера</div>
                    <div class="menu-item-subtitle">Услуги, расписание, портфолио</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="menu-item" onclick="App.navigate('master-schedule')">
                  <div class="menu-item-icon">📅</div>
                  <div class="menu-item-text">
                    <div class="menu-item-title">Моё расписание</div>
                    <div class="menu-item-subtitle">Рабочие дни и часы</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="menu-item" onclick="App.navigate('master-bookings')">
                  <div class="menu-item-icon">📋</div>
                  <div class="menu-item-text">
                    <div class="menu-item-title">Записи клиентов</div>
                    <div class="menu-item-subtitle">Управление записями</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              `}
            </div>
          ` : ''}

          <!-- App Info -->
          <div style="text-align:center;padding:var(--space-lg);color:var(--color-text-tertiary);font-size:var(--font-size-xs)">
            <div style="font-size:24px;margin-bottom:4px;color:var(--color-primary-light)">✦</div>
            <div>${Config.APP_NAME}</div>
            <div style="color:var(--color-text-tertiary)">v${Config.APP_VERSION}</div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {},

  // ============================================
  // AVATAR UPLOAD
  // ============================================

  showAvatarUpload() {
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <p style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">Вы можете загрузить фото из Telegram или выбрать файл</p>

        <button class="btn btn-primary btn-full" onclick="ProfilePage.loadTelegramAvatar()">
          📸 Загрузить из Telegram
        </button>

        <div class="divider-text">или</div>

        <div class="file-input-wrapper btn btn-secondary btn-full">
          <span>📁 Выбрать файл</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="ProfilePage.uploadAvatarFile(this.files[0])">
        </div>

        <div id="avatar-preview-container" style="display:none;text-align:center">
          <div style="width:120px;height:120px;border-radius:50%;overflow:hidden;margin:0 auto;border:3px solid var(--color-primary-light)" id="avatar-preview"></div>
          <button class="btn btn-primary btn-full" style="margin-top:var(--space-md)" onclick="ProfilePage.confirmAvatarUpload()">
            Сохранить фото
          </button>
        </div>
      </div>
    `, 'Фото профиля');
  },

  async loadTelegramAvatar() {
    try {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
        const photoUrl = window.Telegram.WebApp.initDataUnsafe.user.photo_url;
        this._pendingAvatar = photoUrl;
        this._showAvatarPreview(photoUrl);
        Toast.success('Фото из Telegram загружено');
      } else {
        Toast.info('Фото из Telegram недоступно. Выберите файл вручную.');
      }
    } catch (e) {
      Toast.error('Не удалось загрузить фото из Telegram');
    }
  },

  uploadAvatarFile(file) {
    if (!file) return;
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
      Toast.error(validation.error);
      return;
    }

    this._pendingAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this._pendingAvatar = e.target.result;
      this._showAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  },

  _showAvatarPreview(url) {
    const container = document.getElementById('avatar-preview-container');
    const preview = document.getElementById('avatar-preview');
    if (container && preview) {
      preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
      container.style.display = 'block';
    }
  },

  async confirmAvatarUpload() {
    if (!this._pendingAvatar) {
      Toast.error('Сначала выберите фото');
      return;
    }

    try {
      let avatarUrl = this._pendingAvatar;

      // If it's a local file, upload it
      if (this._pendingAvatarFile) {
        const result = await Utils.uploadFile(
          `${Config.API_URL}/auth/avatar`,
          'avatar',
          this._pendingAvatarFile
        );
        avatarUrl = result.avatar_url;
      } else {
        // It's a URL (Telegram), send directly
        const { user } = await API.auth.updateProfile({ avatar_url: avatarUrl });
        Store.set('user', user);
      }

      // Update user in store
      const { user } = await API.auth.me();
      Store.set('user', user);

      Modal.close();
      this._pendingAvatar = null;
      this._pendingAvatarFile = null;
      Utils.haptic('success');
      Toast.success('Фото профиля обновлено');
      App.navigate('profile');
    } catch (e) {
      Toast.error(e.message || 'Ошибка загрузки фото');
    }
  },

  // ============================================
  // EDIT PROFILE
  // ============================================

  showEditModal() {
    const user = Store.get('user');
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Имя</label>
          <input class="form-input" id="edit-first-name" value="${user.first_name || ''}" placeholder="Ваше имя">
        </div>
        <div class="form-group">
          <label class="form-label">Фамилия</label>
          <input class="form-input" id="edit-last-name" value="${user.last_name || ''}" placeholder="Ваша фамилия">
        </div>
        <div class="form-group">
          <label class="form-label">Телефон</label>
          <input class="form-input" id="edit-phone" type="tel" value="${user.phone || ''}" placeholder="+7 (999) 000-00-00">
        </div>
        <button class="btn btn-primary btn-full" onclick="ProfilePage.saveProfile()">Сохранить</button>
      </div>
    `, 'Редактировать профиль');
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
      Toast.success('Профиль обновлён');
      App.navigate('profile');
    } catch (e) {
      Toast.error(e.message || 'Ошибка сохранения');
    }
  },

  showActivateCodeModal() {
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <p style="color:var(--color-text-secondary)">Введите код доступа, чтобы получить роль мастера</p>
        <div class="form-group">
          <label class="form-label">Код доступа</label>
          <input class="form-input" id="access-code-input" placeholder="XXXXXXXX" style="text-transform:uppercase;letter-spacing:0.1em;font-size:var(--font-size-lg);text-align:center" maxlength="8">
        </div>
        <button class="btn btn-primary btn-full" onclick="ProfilePage.activateCode()">Активировать</button>
      </div>
    `, 'Код доступа');
  },

  async activateCode() {
    const code = document.getElementById('access-code-input')?.value;
    if (!code || code.length < 6) {
      Toast.error('Введите корректный код');
      return;
    }

    try {
      const result = await API.auth.activateCode(code);
      Store.set('user', result.user);
      if (result.master_profile) Store.set('masterProfile', result.master_profile);
      Modal.close();
      Utils.haptic('success');
      Toast.success(result.message || 'Код активирован!');
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
      Toast.success('Профиль мастера создан!');
      App.navigate('profile');
    } catch (e) {
      Toast.error(e.message || 'Ошибка создания профиля');
    }
  }
};
