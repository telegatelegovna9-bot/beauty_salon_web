// ============================================
// BOOKING PAGE (4-step flow) - YOUTH STYLE
// ============================================

const BookPage = {
  step: 1,
  totalSteps: 4,
  state: {
    service: null,
    master: null,
    date: null,
    slot: null,
    services: [],
    masters: [],
    slots: [],
    activeCategory: 'all',
    loading: false
  },

  async render(params = {}) {
    // Pre-select service if passed
    if (params.serviceId) {
      try {
        const { service } = await API.services.get(params.serviceId);
        this.state.service = service;
        this.step = 2;
      } catch (e) {}
    } else {
      this.step = 1;
      this.state.service = null;
      this.state.master = null;
      this.state.date = null;
      this.state.slot = null;
    }

    return `<div class="page page-enter" id="book-page"></div>`;
  },

  async afterRender(params = {}) {
    await this.renderStep();
  },

  async renderStep() {
    const container = document.getElementById('book-page');
    if (!container) return;

    // Update header
    App.setHeader(`💅 Запись — шаг ${this.step} из ${this.totalSteps}`);

    const stepLabels = ['Услуга', 'Мастер', 'Дата и время', 'Подтверждение'];
    const stepsHtml = StepIndicator.render(stepLabels, this.step);

    let contentHtml = '';
    switch (this.step) {
      case 1: contentHtml = await this.renderStep1(); break;
      case 2: contentHtml = await this.renderStep2(); break;
      case 3: contentHtml = await this.renderStep3(); break;
      case 4: contentHtml = this.renderStep4(); break;
    }

    container.innerHTML = `
      ${stepsHtml}
      <div id="step-content" style="padding:0 var(--space-md) var(--space-lg)">
        ${contentHtml}
      </div>
    `;

    // Post-render setup
    if (this.step === 3) {
      this.initCalendar();
    }
  },

  // ============================================
  // STEP 1: SELECT SERVICE
  // ============================================

  async renderStep1() {
    if (this.state.services.length === 0) {
      try {
        const { services } = await API.services.list();
        this.state.services = services;
      } catch (e) {
        return `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Ошибка загрузки</div></div>`;
      }
    }

    const categories = [...new Set(this.state.services.map(s => s.category))];
    const filtered = this.state.activeCategory === 'all'
      ? this.state.services
      : this.state.services.filter(s => s.category === this.state.activeCategory);

    return `
      <div style="margin-bottom: var(--space-md);">
        <div style="text-align: center; margin-bottom: var(--space-lg);">
          <div style="font-size: 48px; animation: float 3s ease-in-out infinite;">💅</div>
          <div style="font-size: var(--font-size-lg); font-weight: 700; margin-top: var(--space-sm);">
            Выберите услугу
          </div>
        </div>
      </div>
      <div style="margin:0 calc(-1 * var(--space-md))">
        ${CategoryTabs.render(categories, this.state.activeCategory, 'BookPage.filterCategory')}
      </div>
      <div style="margin-top:var(--space-md); display:grid; grid-template-columns: repeat(2, 1fr); gap:var(--space-md)">
        ${filtered.map(service =>
          ServiceCard.render(service, {
            selected: this.state.service?.id === service.id,
            onClick: `BookPage.selectService(${service.id})`
          })
        ).join('')}
      </div>
    `;
  },

  filterCategory(category) {
    this.state.activeCategory = category;
    this.renderStep();
  },

  selectService(serviceId) {
    const service = this.state.services.find(s => s.id === serviceId);
    if (!service) return;
    this.state.service = service;
    this.state.master = null;
    this.state.masters = [];
    Utils.haptic('light');
    this.goToStep(2);
  },

  // ============================================
  // STEP 2: SELECT MASTER
  // ============================================

  async renderStep2() {
    if (!this.state.service) {
      this.step = 1;
      return this.renderStep1();
    }

    if (this.state.masters.length === 0) {
      try {
        const { masters } = await API.masters.list(this.state.service.id);
        this.state.masters = masters;
      } catch (e) {
        return `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Ошибка загрузки</div></div>`;
      }
    }

    if (this.state.masters.length === 0) {
      return EmptyState.render('👤', 'Нет доступных мастеров', 'Для этой услуги пока нет мастеров', 'Назад', 'BookPage.goToStep(1)');
    }

    const cat = Utils.getCategoryInfo(this.state.service.category);

    return `
      <div style="margin-bottom: var(--space-md);">
        <div style="display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--gradient-glass); border-radius:var(--radius-lg); backdrop-filter:blur(10px); margin-bottom:var(--space-md);">
          <div style="font-size: 32px;">${cat.emoji}</div>
          <div>
            <div style="font-weight:700; font-size:var(--font-size-lg);">${this.state.service.name}</div>
            <div style="font-size:var(--font-size-sm); color:var(--color-text-secondary);">⏱ ${Utils.formatDuration(this.state.service.duration_minutes)} • ${Utils.formatPrice(this.state.service.price)}</div>
          </div>
        </div>
        <div style="text-align: center; margin-bottom: var(--space-md);">
          <div style="font-size: 32px; margin-bottom: 8px;">👩‍🎨</div>
          <div style="font-size: var(--font-size-lg); font-weight: 700;">Выберите мастера</div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:var(--space-md)">
        ${this.state.masters.map(master =>
          MasterCard.render(master, {
            selected: this.state.master?.id === master.id,
            onClick: `BookPage.selectMaster(${master.id})`
          })
        ).join('')}
      </div>
    `;
  },

  selectMaster(masterId) {
    const master = this.state.masters.find(m => m.id === masterId);
    if (!master) return;
    this.state.master = master;
    this.state.date = null;
    this.state.slot = null;
    Utils.haptic('light');
    this.goToStep(3);
  },

  // ============================================
  // STEP 3: SELECT DATE & TIME
  // ============================================

  async renderStep3() {
    if (!this.state.service || !this.state.master) {
      this.step = 2;
      return this.renderStep2();
    }

    const masterName = this.state.master.display_name || Utils.getMasterName(this.state.master);

    return `
      <div style="margin-bottom: var(--space-md);">
        <div style="display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--gradient-glass); border-radius:var(--radius-lg); backdrop-filter:blur(10px); margin-bottom:var(--space-md);">
          ${Utils.renderAvatar(masterName, this.state.master.avatar_url, 48)}
          <div>
            <div style="font-weight:700;">${masterName}</div>
            <div style="font-size:var(--font-size-sm); color:var(--color-text-secondary);">${this.state.service.name}</div>
          </div>
        </div>
        <div style="text-align: center; margin-bottom: var(--space-md);">
          <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
          <div style="font-size: var(--font-size-lg); font-weight: 700;">Выберите дату и время</div>
        </div>
      </div>

      <!-- Calendar -->
      <div id="calendar-container" style="margin-bottom:var(--space-lg)"></div>

      <!-- Time Slots -->
      <div id="slots-section" style="display:none">
        <div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-secondary);margin-bottom:var(--space-sm);text-transform:uppercase;letter-spacing:0.05em">
          ⏰ Доступное время
        </div>
        <div id="slots-container"></div>
      </div>

      <!-- Loading slots -->
      <div id="slots-loading" style="display:none;text-align:center;padding:var(--space-xl)">
        <div class="loading-spinner" style="margin:0 auto 16px;"></div>
        <div style="color:var(--color-text-secondary);">Ищем свободное время...</div>
      </div>

      <!-- Next button -->
      <div id="step3-next" style="display:none;margin-top:var(--space-lg)">
        <button class="btn btn-primary btn-full btn-lg" onclick="BookPage.goToStep(4)">
          Продолжить ✨
        </button>
      </div>
    `;
  },

  initCalendar() {
    Calendar.init('calendar-container', {
      minDate: Utils.getTodayStr(),
      selectedDate: this.state.date,
      onSelect: (date) => {
        this.state.date = date;
        this.state.slot = null;
        this.loadSlots(date);
      }
    });
  },

  async loadSlots(date) {
    const slotsSection = document.getElementById('slots-section');
    const slotsLoading = document.getElementById('slots-loading');
    const slotsContainer = document.getElementById('slots-container');
    const nextBtn = document.getElementById('step3-next');

    if (!slotsSection || !slotsLoading) return;

    slotsSection.style.display = 'none';
    slotsLoading.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'none';

    try {
      const { slots, reason } = await API.schedule.getSlots(
        this.state.master.id,
        this.state.service.id,
        date
      );

      slotsLoading.style.display = 'none';
      slotsSection.style.display = 'block';

      TimeSlots._containerId = 'slots-container';
      TimeSlots.render('slots-container', slots, {
        selectedSlot: this.state.slot,
        onSelect: (slot) => {
          this.state.slot = slot;
          if (nextBtn) nextBtn.style.display = 'block';
          Utils.haptic('light');
        }
      });
    } catch (e) {
      slotsLoading.style.display = 'none';
      slotsSection.style.display = 'block';
      if (slotsContainer) {
        slotsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Ошибка загрузки слотов</div></div>`;
      }
    }
  },

  // ============================================
  // STEP 4: CONFIRMATION
  // ============================================

  renderStep4() {
    if (!this.state.service || !this.state.master || !this.state.date || !this.state.slot) {
      this.step = 3;
      this.renderStep();
      return '';
    }

    const masterName = this.state.master.display_name || Utils.getMasterName(this.state.master);
    const price = this.state.master.custom_price || this.state.service.price;

    return `
      <div style="text-align: center; margin-bottom: var(--space-lg);">
        <div style="font-size: 48px; margin-bottom: 8px; animation: bounce 2s ease-in-out infinite;">🎉</div>
        <div style="font-size: var(--font-size-xl); font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Почти готово!</div>
      </div>

      <div class="card" style="margin-bottom: var(--space-lg);">
        <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md); background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">📋 Детали записи</div>

        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-secondary);">💅 Услуга</span>
          <span style="font-weight: 600;">${this.state.service.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-secondary);">👩‍🎨 Мастер</span>
          <span style="font-weight: 600;">${masterName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-secondary);">📅 Дата</span>
          <span style="font-weight: 600;">${Utils.formatDate(this.state.date, 'full')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-secondary);">⏰ Время</span>
          <span style="font-weight: 600;">${Utils.formatTime(this.state.slot.start_time)} — ${Utils.formatTime(this.state.slot.end_time)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-secondary);">⏱ Длительность</span>
          <span style="font-weight: 600;">${Utils.formatDuration(this.state.service.duration_minutes)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 16px 0 0;">
          <span style="font-size: var(--font-size-lg); font-weight: 700;">💰 Стоимость</span>
          <span style="font-size: var(--font-size-xl); font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${Utils.formatPrice(price)}</span>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label class="form-label">💬 Комментарий (необязательно)</label>
        <textarea class="form-input" id="booking-notes" placeholder="Пожелания, особые требования..." style="min-height: 100px;"></textarea>
      </div>

      <!-- Confirm Button -->
      <button class="btn btn-primary btn-full btn-lg" id="confirm-btn" onclick="BookPage.confirmBooking()">
        🎉 Подтвердить запись
      </button>

      <div style="text-align:center;margin-top:var(--space-md);font-size:var(--font-size-sm);color:var(--color-text-tertiary)">
        ✨ Вы получите уведомление о подтверждении
      </div>
    `;
  },

  async confirmBooking() {
    const btn = document.getElementById('confirm-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Создаём запись...';
    }

    try {
      const notes = document.getElementById('booking-notes')?.value || '';

      const { booking } = await API.bookings.create({
        master_id: this.state.master.id,
        service_id: this.state.service.id,
        booking_date: this.state.date,
        start_time: this.state.slot.start_time,
        notes: notes || undefined
      });

      Utils.haptic('success');

      // Show success screen
      const container = document.getElementById('book-page');
      if (container) {
        container.innerHTML = `
          <div style="min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-xl);text-align:center">
            <div style="font-size:80px;animation:bounceIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55) forwards;margin-bottom:var(--space-lg)">🎉</div>
            <div style="font-size:var(--font-size-2xl);font-weight:800;margin-bottom:var(--space-md);background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Запись создана!</div>
            <div style="color:var(--color-text-secondary);margin-bottom:var(--space-lg);line-height:1.8">
              📅 ${Utils.formatDate(this.state.date, 'full')}<br>
              ⏰ в ${Utils.formatTime(this.state.slot.start_time)}<br>
              👩‍🎨 ${this.state.master.display_name || Utils.getMasterName(this.state.master)}
            </div>
            <button class="btn btn-primary btn-lg" onclick="App.navigate('bookings')" style="margin-bottom:var(--space-md)">
              📋 Мои записи
            </button>
            <button class="btn btn-ghost" onclick="BookPage.resetAndStart()">
              💅 Записаться ещё
            </button>
          </div>
        `;
      }

      App.setHeader('Beauty Studio ✨');

      // Notify Telegram WebApp
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify({
          type: 'booking_created',
          date: Utils.formatDate(this.state.date, 'full'),
          time: Utils.formatTime(this.state.slot.start_time),
          service: this.state.service.name,
          master: this.state.master.display_name || Utils.getMasterName(this.state.master)
        }));
      }

      Store.resetBooking();

    } catch (error) {
      Utils.haptic('error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🎉 Подтвердить запись';
      }

      const errorMessages = {
        'TIME_SLOT_TAKEN': 'Этот слот уже занят. Выберите другое время.',
        'MASTER_DAY_OFF': 'Мастер не работает в этот день.',
        'MASTER_NOT_WORKING': 'Мастер не работает в этот день недели.',
        'OUTSIDE_WORKING_HOURS': 'Выбранное время вне рабочих часов.'
      };

      const msg = errorMessages[error.data?.code] || error.message || 'Ошибка создания записи';
      Toast.error(msg);

      if (error.data?.code === 'TIME_SLOT_TAKEN') {
        this.state.slot = null;
        this.goToStep(3);
      }
    }
  },

  resetAndStart() {
    this.step = 1;
    this.state = {
      service: null, master: null, date: null, slot: null,
      services: this.state.services, masters: [], slots: [],
      activeCategory: 'all', loading: false
    };
    this.renderStep();
  },

  // ============================================
  // NAVIGATION
  // ============================================

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    this.step = step;
    Utils.scrollToTop(false);
    this.renderStep();
  },

  goBack() {
    if (this.step > 1) {
      this.goToStep(this.step - 1);
      return true;
    }
    return false;
  }
};
