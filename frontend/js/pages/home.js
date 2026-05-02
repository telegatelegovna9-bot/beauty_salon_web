// ============================================
// HOME PAGE
// ============================================

const HomePage = {
  async render() {
    const user = Store.get('user');
    const name = user ? Utils.getUserName(user) : 'Гость';
    const firstName = user?.first_name || name.split(' ')[0];

    return `
      <div class="page page-enter" id="home-page">
        <!-- Hero -->
        <div class="hero">
          <div class="hero-greeting">● Добро пожаловать</div>
          <div class="hero-title">Привет, ${firstName}! ✨</div>
          <div class="hero-subtitle">Запишитесь на любимую процедуру в несколько кликов</div>
          <div class="hero-cta">
            <button class="btn btn-primary" onclick="App.navigate('book')">
              💅 Записаться
            </button>
            <button class="btn btn-outline" onclick="App.navigate('portfolio')">
              Портфолио
            </button>
          </div>
        </div>

        <!-- Quick Stats (for masters/admins) -->
        ${Store.isMaster() ? '<div id="master-stats-section"></div>' : ''}

        <!-- Services Section -->
        <div class="page-section">
          <div class="section-header">
            <div class="section-title">Наши услуги</div>
            <button class="section-link" onclick="App.navigate('book')">
              Все услуги
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <div id="home-services-list">
            ${Utils.skeletonCard(4)}
          </div>
        </div>

        <!-- Masters Section -->
        <div class="page-section" style="padding-top:0">
          <div class="section-header">
            <div class="section-title">Наши мастера</div>
            <button class="section-link" onclick="App.navigate('book')">
              Все мастера
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <div id="home-masters-list">
            ${Utils.skeletonCard(3)}
          </div>
        </div>

        <!-- Upcoming Bookings -->
        <div class="page-section" style="padding-top:0">
          <div class="section-header">
            <div class="section-title">Ближайшие записи</div>
            <button class="section-link" onclick="App.navigate('bookings')">
              Все
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <div id="home-bookings-list">
            ${Utils.skeletonCard(2)}
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

      container.innerHTML = topServices.map(service =>
        ServiceCard.render(service, {
          onClick: `App.navigate('book', { serviceId: ${service.id} })`
        })
      ).join('');

      if (services.length > 6) {
        container.innerHTML += `
          <button class="btn btn-secondary btn-full" onclick="App.navigate('book')" style="margin-top:var(--space-sm)">
            Все услуги (${services.length})
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
          <div class="empty-state">
            <div class="empty-state-icon" style="font-size:32px">📅</div>
            <div class="empty-state-title" style="font-size:var(--font-size-base)">Нет предстоящих записей</div>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('book')">
              Записаться
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

      container.innerHTML = `
        <div class="page-section" style="padding-bottom:0">
          <div class="section-title">Сегодня</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-value">${todayCount}</div>
              <div class="stat-card-label">Записей</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value" style="color:var(--color-warning)">${pendingCount}</div>
              <div class="stat-card-label">Ожидают</div>
            </div>
          </div>
          ${todayCount > 0 ? `
            <div style="margin-top:var(--space-md);background:var(--color-surface);border-radius:var(--radius-lg);border:1px solid var(--color-border-lighter);overflow:hidden">
              ${bookings.slice(0, 3).map(b => `
                <div style="display:flex;align-items:center;gap:12px;padding:12px var(--space-md);border-bottom:1px solid var(--color-border-lighter)">
                  <div style="font-weight:700;color:var(--color-primary);font-size:var(--font-size-sm);min-width:48px">${Utils.formatTime(b.start_time)}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.service_name}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">${b.client_first_name || b.client_username || 'Клиент'}</div>
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
