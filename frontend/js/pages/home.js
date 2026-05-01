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
          <div class="hero-greeting">Добро пожаловать</div>
          <div class="hero-title">Привет, ${firstName}! ✨</div>
          <div class="hero-subtitle">Запишитесь на любимую процедуру в несколько кликов</div>
          <div class="hero-cta">
            <button class="btn btn-primary" onclick="App.navigate('book')">
              💅 Записаться
            </button>
            <button class="btn" style="background:rgba(255,255,255,0.12);color:white" onclick="App.navigate('portfolio')">
              Портфолио
            </button>
          </div>
        </div>

        <!-- Quick Stats (for masters/admins) -->
        ${Store.isMaster() ? '<div id="master-stats-section"></div>' : ''}

        <!-- Services Section -->
        <div class="page-section">
          <div class="section-title">Наши услуги</div>
          <div id="home-services-list">
            ${Utils.skeletonCard(4)}
          </div>
        </div>

        <!-- Masters Section -->
        <div class="page-section" style="padding-top:0">
          <div class="section-title">Наши мастера</div>
          <div id="home-masters-list">
            ${Utils.skeletonCard(3)}
          </div>
        </div>

        <!-- Upcoming Bookings -->
        <div class="page-section" style="padding-top:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
            <div class="section-title" style="margin-bottom:0">Ближайшие записи</div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('bookings')">Все →</button>
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

      // Show top 6 services
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
          <div style="text-align:center;padding:var(--space-lg);color:var(--color-text-secondary)">
            <div style="font-size:32px;margin-bottom:8px">📅</div>
            <div>Нет предстоящих записей</div>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('book')" style="margin-top:12px">
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
            <div style="margin-top:var(--space-md)">
              ${bookings.slice(0, 3).map(b => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--color-border-light)">
                  <div style="font-weight:600;color:var(--color-gold)">${Utils.formatTime(b.start_time)}</div>
                  <div style="flex:1">
                    <div style="font-weight:500">${b.service_name}</div>
                    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${b.client_first_name || b.client_username || 'Клиент'}</div>
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
