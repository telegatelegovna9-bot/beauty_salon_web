// ============================================
// HOME PAGE - Premium Redesign
// ============================================

const HomePage = {
  async render() {
    const user = Store.get('user');
    const name = user ? Utils.getUserName(user) : 'Гость';
    const firstName = user?.first_name || name.split(' ')[0];

    return `
      <div class="page page-enter fade-in" id="home-page">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="loading-icon" style="margin-bottom: var(--space-lg);">
            ✨
          </div>
          <h1 class="hero-title">Привет, ${firstName}!</h1>
          <p class="hero-subtitle">Добро пожаловать в салон красоты премиум-класса</p>
          <div class="flex gap-md justify-center mt-lg">
            <button class="btn btn-primary btn-lg press-effect" onclick="App.navigate('book')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Записаться
            </button>
            <button class="btn btn-outline btn-lg press-effect" onclick="App.navigate('portfolio')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Портфолио
            </button>
          </div>
        </div>

        <!-- Quick Stats (for masters/admins) -->
        ${Store.isMaster() ? '<div id="master-stats-section" class="px-md"></div>' : ''}

        <!-- Services Section -->
        <div class="section-header">
          <div>
            <h2 class="section-title">Популярные услуги</h2>
            <p class="section-subtitle">Выберите процедуру для записи</p>
          </div>
          <button class="btn btn-ghost text-accent" onclick="App.navigate('book')">
            Все
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        
        <div id="home-services-list" class="services-grid">
          ${Utils.skeletonCard(4)}
        </div>

        <!-- Masters Section -->
        <div class="section-header mt-xl">
          <div>
            <h2 class="section-title">Наши мастера</h2>
            <p class="section-subtitle">Профессионалы с любовью к своему делу</p>
          </div>
          <button class="btn btn-ghost text-accent" onclick="App.navigate('master')">
            Все
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        
        <div id="home-masters-list" class="masters-grid">
          ${Utils.skeletonCard(3)}
        </div>

        <!-- Upcoming Bookings -->
        <div class="section-header mt-xl">
          <div>
            <h2 class="section-title">Ближайшие записи</h2>
            <p class="section-subtitle">Ваши предстоящие визиты</p>
          </div>
          <button class="btn btn-ghost text-accent" onclick="App.navigate('bookings')">
            Все
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        
        <div id="home-bookings-list" class="px-md">
          ${Utils.skeletonCard(2)}
        </div>

        <!-- Categories Quick Access -->
        <div class="section-header mt-xl">
          <h2 class="section-title">Категории</h2>
        </div>
        
        <div class="chips-container px-md">
          <div class="chip active" onclick="App.navigate('book', { category: 'all' })">Все</div>
          <div class="chip" onclick="App.navigate('book', { category: 'nails' })">Ногти</div>
          <div class="chip" onclick="App.navigate('book', { category: 'eyebrows' })">Брови</div>
          <div class="chip" onclick="App.navigate('book', { category: 'lashes' })">Ресницы</div>
          <div class="chip" onclick="App.navigate('book', { category: 'hair' })">Волосы</div>
          <div class="chip" onclick="App.navigate('book', { category: 'face' })">Лицо</div>
        </div>

        <!-- Promo Banner -->
        <div class="card mx-md mt-xl" style="background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); color: white;">
          <div class="flex items-center justify-between">
            <div>
              <h3 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-xs);">Скидка 15% на первый визит</h3>
              <p style="font-size: var(--font-size-sm); opacity: 0.9;">Запишитесь онлайн и получите скидку</p>
            </div>
            <button class="btn" style="background: rgba(255,255,255,0.2); color: white;" onclick="App.navigate('book')">
              Получить
            </button>
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
        container.innerHTML = `
          <div class="card mx-md text-center py-xl">
            <div style="font-size: 48px; margin-bottom: var(--space-md);">💅</div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Услуги не найдены</h3>
            <p class="text-secondary">Скоро здесь появятся услуги</p>
          </div>
        `;
        return;
      }

      container.innerHTML = topServices.map(service => `
        <div class="service-card press-effect" onclick="App.navigate('book', { serviceId: ${service.id} })">
          <div class="service-image" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 32px;">
            ${service.category === 'nails' ? '💅' : 
              service.category === 'eyebrows' ? '✨' : 
              service.category === 'lashes' ? '👁️' : 
              service.category === 'hair' ? '💇‍♀️' : '🌸'}
          </div>
          <div class="service-content">
            <h3 class="service-title">${service.name}</h3>
            <div class="service-duration">${service.duration || 60} мин</div>
            <div class="service-price">${Utils.formatPrice(service.price)} ₽</div>
            <button class="btn btn-primary btn-sm mt-md" style="width: 100%;">Выбрать</button>
          </div>
        </div>
      `).join('');

      if (services.length > 6) {
        container.innerHTML += `
          <div class="flex justify-center mt-lg">
            <button class="btn btn-secondary" onclick="App.navigate('book')" style="min-width: 200px;">
              Все услуги (${services.length})
            </button>
          </div>
        `;
      }
    } catch (e) {
      console.error('Failed to load services:', e);
      const container = document.getElementById('home-services-list');
      if (container) {
        container.innerHTML = `
          <div class="card mx-md text-center py-xl">
            <div style="font-size: 48px; margin-bottom: var(--space-md);">😔</div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Ошибка загрузки</h3>
            <p class="text-secondary">Попробуйте обновить страницу</p>
          </div>
        `;
      }
    }
  },

  async loadMasters() {
    try {
      const { masters } = await API.masters.list();
      const container = document.getElementById('home-masters-list');
      if (!container) return;

      if (masters.length === 0) {
        container.innerHTML = `
          <div class="card mx-md text-center py-xl">
            <div style="font-size: 48px; margin-bottom: var(--space-md);">👤</div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Мастера не найдены</h3>
            <p class="text-secondary">Скоро здесь появятся мастера</p>
          </div>
        `;
        return;
      }

      container.innerHTML = masters.slice(0, 4).map(master => `
        <div class="master-card press-effect" onclick="App.navigate('master-detail', { masterId: ${master.id} })">
          <div class="master-avatar" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 24px;">
            ${master.first_name ? master.first_name.charAt(0).toUpperCase() : 'М'}
          </div>
          <h3 class="master-name">${master.first_name || 'Мастер'} ${master.last_name || ''}</h3>
          <p class="master-specialty">${master.specialty || 'Специалист'}</p>
          <div class="flex items-center justify-center gap-xs mt-sm">
            <span style="font-size: 12px; color: var(--color-accent);">★</span>
            <span style="font-size: var(--font-size-sm); font-weight: 500;">${master.rating || '5.0'}</span>
          </div>
        </div>
      `).join('');
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
          <div class="card text-center py-xl">
            <div style="font-size: 48px; margin-bottom: var(--space-md); color: var(--color-secondary);">📅</div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Нет предстоящих записей</h3>
            <p class="text-secondary mb-lg">Запишитесь на первую процедуру</p>
            <button class="btn btn-primary" onclick="App.navigate('book')">
              Записаться
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = upcoming.map(booking => `
        <div class="card mb-md press-effect" onclick="App.navigate('booking-detail', { bookingId: ${booking.id} })">
          <div class="flex items-center justify-between mb-sm">
            <div>
              <h3 style="font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary);">
                ${booking.service_name}
              </h3>
              <p class="text-secondary">${Utils.formatDate(booking.booking_date)} • ${Utils.formatTime(booking.start_time)}</p>
            </div>
            <span class="chip ${booking.status === 'confirmed' ? 'active' : ''}" style="font-size: var(--font-size-xs); padding: 4px 8px;">
              ${Utils.getStatusInfo(booking.status).label}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-sm">
              <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--color-secondary); display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--color-accent);">
                ${booking.master_first_name ? booking.master_first_name.charAt(0).toUpperCase() : 'М'}
              </div>
              <div>
                <p style="font-weight: 500;">${booking.master_first_name || 'Мастер'}</p>
                <p class="text-sm text-secondary">Мастер</p>
              </div>
            </div>
            <div style="text-align: right;">
              <p style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-accent);">
                ${Utils.formatPrice(booking.price)} ₽
              </p>
            </div>
          </div>
        </div>
      `).join('');
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
        <div class="card">
          <h2 class="section-title" style="margin-bottom: var(--space-lg);">Статистика на сегодня</h2>
          <div class="flex gap-md">
            <div class="flex-1 text-center">
              <div style="font-size: var(--font-size-3xl); font-weight: 800; color: var(--color-accent);">${todayCount}</div>
              <p class="text-secondary">Всего записей</p>
            </div>
            <div class="flex-1 text-center">
              <div style="font-size: var(--font-size-3xl); font-weight: 800; color: var(--color-warning);">${pendingCount}</div>
              <p class="text-secondary">Ожидают подтверждения</p>
            </div>
          </div>
          
          ${todayCount > 0 ? `
            <div style="margin-top: var(--space-xl);">
              <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-md);">Ближайшие записи</h3>
              ${bookings.slice(0, 3).map(b => `
                <div class="flex items-center justify-between py-md" style="border-bottom: 1px solid var(--color-border-light);">
                  <div class="flex items-center gap-md">
                    <div style="font-weight: 700; color: var(--color-accent);">${Utils.formatTime(b.start_time)}</div>
                    <div>
                      <div style="font-weight: 500;">${b.service_name}</div>
                      <div class="text-sm text-secondary">${b.client_first_name || b.client_username || 'Клиент'}</div>
                    </div>
                  </div>
                  <span class="chip ${b.status === 'confirmed' ? 'active' : ''}" style="font-size: var(--font-size-xs); padding: 4px 8px;">
                    ${Utils.getStatusInfo(b.status).label}
                  </span>
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
