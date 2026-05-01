// ============================================
// HOME PAGE - YOUTH STYLE
// ============================================

const HomePage = {
  async render() {
    const user = Store.get('user');
    const name = user ? Utils.getUserName(user) : 'Гость';
    const firstName = user?.first_name || name.split(' ')[0];

    return `
      <div class="page page-enter" id="home-page">
        <!-- Hero Section with Gradient -->
        <div class="hero">
          <div style="font-size: 48px; margin-bottom: 8px; animation: float 3s ease-in-out infinite;">💅</div>
          <div class="hero-greeting">Добро пожаловать ✨</div>
          <div class="hero-title">Привет, ${firstName}!</div>
          <div class="hero-subtitle">Красота начинается здесь</div>
          <div class="hero-cta">
            <button class="btn btn-primary btn-lg" onclick="App.navigate('book')">
              💖 Записаться
            </button>
            <button class="btn btn-secondary" onclick="App.navigate('portfolio')">
              📸 Портфолио
            </button>
          </div>
          <!-- Decorative elements -->
          <div style="position: absolute; top: 20px; right: 20px; font-size: 24px; opacity: 0.5; animation: float 4s ease-in-out infinite;">🌸</div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 20px; opacity: 0.4; animation: float 3.5s ease-in-out infinite 1s;">✨</div>
        </div>

        <!-- Quick Stats (for masters/admins) -->
        ${Store.isMaster() ? '<div id="master-stats-section"></div>' : ''}

        <!-- Services Section -->
        <div class="page-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
            <div class="section-title" style="margin-bottom: 0;">💎 Наши услуги</div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('book')">Все →</button>
          </div>
          <div id="home-services-list" class="stagger-scale">
            ${Utils.skeletonCard(6)}
          </div>
        </div>

        <!-- Masters Section -->
        <div class="page-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-md);">
            <div class="section-title" style="margin-bottom: 0;">👩‍🎨 Наши мастера</div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('book')">Все →</button>
          </div>
          <div id="home-masters-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md);">
            ${Utils.skeletonCard(4)}
          </div>
        </div>

        <!-- Upcoming Bookings -->
        <div class="page-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
            <div class="section-title" style="margin-bottom:0">📅 Ближайшие записи</div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('bookings')">Все →</button>
          </div>
          <div id="home-bookings-list">
            ${Utils.skeletonCard(2)}
          </div>
        </div>

        <!-- Trending Section -->
        <div class="page-section">
          <div class="section-title">🔥 Популярное</div>
          <div style="display: flex; gap: var(--space-sm); overflow-x: auto; padding-bottom: var(--space-sm); -webkit-overflow-scrolling: touch;">
            <div class="tag" style="flex-shrink: 0;">💅 Маникюр</div>
            <div class="tag" style="flex-shrink: 0;">💇‍♀️ Стрижка</div>
            <div class="tag" style="flex-shrink: 0;">💆‍♀️ Массаж</div>
            <div class="tag" style="flex-shrink: 0;">🎨 Окрашивание</div>
            <div class="tag" style="flex-shrink: 0;">✨ Брови</div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await Promise.all([
      this.loadServices(),
      this.loadMasters(),
      this.loadUpcomingBookings(),
      Store.isMaster() ? this.loadMasterStats() : Promise.resolve()
    ]);
  },

  async loadServices() {
    try {
      const { services } = await API.services.list();
      const container = document.getElementById('home-services-list');
      if (!container) return;

      const topServices = services.slice(0, 6);

      if (topServices.length === 0) {
        container.innerHTML = EmptyState.render('💅', 'Услуги не найдены', 'Скоро здесь появятся услуги');
        return;
      }

      container.innerHTML = topServices.map((service, index) =>
        ServiceCard.render(service, {
          onClick: `App.navigate('book', { serviceId: ${service.id} })`
        })
      ).join('');

      if (services.length > 6) {
        container.innerHTML += `
          <button class="btn btn-secondary btn-full" onclick="App.navigate('book')" style="margin-top:var(--space-sm)">
            Смотреть все услуги (${services.length}) 🚀
          </button>
        `;
      }
    } catch (e) {
      console.error('Failed to load services:', e);
    }
  },

  async loadMasters() {
    try {
      const { masters } = await API.masters.list();
      const container = document.getElementById('home-masters-list');
      if (!container) return;

      if (masters.length === 0) {
        container.innerHTML = EmptyState.render('👤', 'Мастера не найдены', 'Скоро здесь появятся мастера');
        return;
      }

      container.innerHTML = masters.slice(0, 4).map(master =>
        MasterCard.render(master, {
          onClick: `App.navigate('master-detail', { masterId: ${master.id} })`
        })
      ).join('');
    } catch (e) {
      console.error('Failed to load masters:', e);
    }
  },

  async loadUpcomingBookings() {
    try {
      const { bookings } = await API.bookings.my({ limit: 3 });
      const container = document.getElementById('home-bookings-list');
      if (!container) return;

      const upcoming = bookings.filter(b =>
        ['pending', 'confirmed'].includes(b.status) &&
        b.booking_date >= Utils.getTodayStr()
      ).slice(0, 3);

      if (upcoming.length === 0) {
        container.innerHTML = `
          <div class="card" style="text-align:center; padding: var(--space-xl);">
            <div style="font-size:48px;margin-bottom:12px;animation: float 3s ease-in-out infinite;">📅</div>
            <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: 8px;">Нет предстоящих записей</div>
            <div style="color: var(--color-text-secondary); margin-bottom: 16px;">Самое время побаловать себя!</div>
            <button class="btn btn-primary" onclick="App.navigate('book')">
              💅 Записаться сейчас
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = upcoming.map(booking =>
        BookingCard.render(booking, {
          onClick: `App.navigate('booking-detail', { bookingId: ${booking.id} })`
        })
      ).join('');
    } catch (e) {
      console.error('Failed to load bookings:', e);
    }
  },

  async loadMasterStats() {
    try {
      const container = document.getElementById('master-stats-section');
      if (!container) return;

      const profile = await API.masters.me();
      const { bookings } = await API.bookings.masterBookings({
        date: Utils.getTodayStr(),
        limit: 10
      });

      const todayCount = bookings.length;
      const pendingCount = bookings.filter(b => b.status === 'pending').length;
      const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;

      container.innerHTML = `
        <div class="page-section">
          <div class="section-title">📊 Сегодня</div>
          <div class="stats-grid">
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">📅</div>
              <div class="stat-card-value">${todayCount}</div>
              <div class="stat-card-label">Всего записей</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">⏳</div>
              <div class="stat-card-value" style="background: var(--gradient-warm); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${pendingCount}</div>
              <div class="stat-card-label">Ожидают</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">✅</div>
              <div class="stat-card-value" style="background: var(--gradient-cool); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${confirmedCount}</div>
              <div class="stat-card-label">Подтверждено</div>
            </div>
            <div class="stat-card stagger-item">
              <div class="stat-card-icon">💰</div>
              <div class="stat-card-value">${Utils.formatPrice(bookings.reduce((sum, b) => sum + (b.price || 0), 0))}</div>
              <div class="stat-card-label">Выручка</div>
            </div>
          </div>
          ${todayCount > 0 ? `
            <div style="margin-top:var(--space-md)">
              ${bookings.slice(0, 5).map((b, i) => `
                <div class="menu-item stagger-item" style="animation-delay: ${i * 80}ms;">
                  <div class="menu-item-icon">${Utils.getStatusEmoji(b.status)}</div>
                  <div class="menu-item-content">
                    <div class="menu-item-title">${b.service_name}</div>
                    <div class="menu-item-subtitle">${b.client_first_name || b.client_username || 'Клиент'} • ${Utils.formatTime(b.start_time)}</div>
                  </div>
                  <span class="badge ${Utils.getStatusInfo(b.status).class}">${Utils.getStatusInfo(b.status).label}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } catch (e) {
      // Master profile might not exist yet
    }
  }
};
