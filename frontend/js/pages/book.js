// ============================================
// BOOKING PAGE - Premium Redesign
// 4-step flow with soft beauty design
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

    return `<div class="page page-enter fade-in" id="book-page"></div>`;
  },

  async afterRender(params = {}) {
    await this.renderStep();
  },

  async renderStep() {
    const container = document.getElementById('book-page');
    if (!container) return;

    // Update header
    App.setHeader(`Запись — шаг ${this.step} из ${this.totalSteps}`);

    const stepLabels = ['Услуга', 'Мастер', 'Дата', 'Подтверждение'];
    const stepsHtml = this.renderStepIndicator(stepLabels, this.step);

    let contentHtml = '';
    switch (this.step) {
      case 1: contentHtml = await this.renderStep1(); break;
      case 2: contentHtml = await this.renderStep2(); break;
      case 3: contentHtml = await this.renderStep3(); break;
      case 4: contentHtml = this.renderStep4(); break;
    }

    container.innerHTML = `
      <div class="px-md pt-md">
        ${stepsHtml}
      </div>
      <div id="step-content" class="px-md pb-xl">
        ${contentHtml}
      </div>
    `;

    // Post-render setup
    if (this.step === 3) {
      this.initCalendar();
    }
  },

  renderStepIndicator(labels, activeStep) {
    return `
      <div class="flex justify-between items-center mb-xl">
        ${labels.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === activeStep;
          const isCompleted = stepNum < activeStep;
          
          return `
            <div class="flex flex-col items-center" style="flex: 1; position: relative;">
              <!-- Connector line -->
              ${index < labels.length - 1 ? `
                <div style="position: absolute; top: 12px; left: 50%; width: 100%; height: 2px; background: ${isCompleted ? 'var(--color-accent)' : 'var(--color-border)'}; z-index: 1;"></div>
              ` : ''}
              
              <!-- Step circle -->
              <div class="flex items-center justify-center" style="
                width: 24px;
                height: 24px;
                border-radius: var(--radius-full);
                background: ${isActive ? 'var(--color-accent)' : isCompleted ? 'var(--color-accent)' : 'var(--color-bg-secondary)'};
                color: ${isActive || isCompleted ? 'white' : 'var(--color-text-tertiary)'};
                font-size: var(--font-size-sm);
                font-weight: 600;
                z-index: 2;
                border: 2px solid ${isCompleted ? 'var(--color-accent)' : 'transparent'};
                transition: all var(--transition-base);
              ">
                ${isCompleted ? '✓' : stepNum}
              </div>
              
              <!-- Step label -->
              <div class="mt-sm" style="
                font-size: var(--font-size-xs);
                font-weight: ${isActive ? '600' : '500'};
                color: ${isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)'};
                text-align: center;
                max-width: 80px;
              ">
                ${label}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
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
        return `
          <div class="card text-center py-xl">
            <div style="font-size: 48px; margin-bottom: var(--space-md);">⚠️</div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Ошибка загрузки</h3>
            <p class="text-secondary">Попробуйте обновить страницу</p>
          </div>
        `;
      }
    }

    const categories = [...new Set(this.state.services.map(s => s.category || 'other'))];
    const filtered = this.state.activeCategory === 'all'
      ? this.state.services
      : this.state.services.filter(s => s.category === this.state.activeCategory);

    return `
      <div class="mb-lg">
        <h2 class="section-title mb-md">Выберите услугу</h2>
        <p class="text-secondary mb-lg">Подберите процедуру, которая вам подходит</p>
        
        <!-- Category filters -->
        <div class="chips-container">
          <div class="chip ${this.state.activeCategory === 'all' ? 'active' : ''}" 
               onclick="BookPage.filterCategory('all')">
            Все
          </div>
          ${categories.map(cat => `
            <div class="chip ${this.state.activeCategory === cat ? 'active' : ''}" 
                 onclick="BookPage.filterCategory('${cat}')">
              ${Utils.getCategoryInfo(cat).label}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Services grid -->
      <div class="services-grid">
        ${filtered.map(service => `
          <div class="service-card press-effect ${this.state.service?.id === service.id ? 'selected' : ''}" 
               onclick="BookPage.selectService(${service.id})"
               style="${this.state.service?.id === service.id ? 'border-color: var(--color-accent); box-shadow: var(--shadow-accent);' : ''}">
            <div class="service-image" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 32px;">
              ${Utils.getCategoryInfo(service.category).emoji}
            </div>
            <div class="service-content">
              <h3 class="service-title">${service.name}</h3>
              <div class="service-duration">${service.duration_minutes || 60} мин</div>
              <div class="service-price">${Utils.formatPrice(service.price)} ₽</div>
              <button class="btn ${this.state.service?.id === service.id ? 'btn-primary' : 'btn-secondary'} btn-sm mt-md" style="width: 100%;">
                ${this.state.service?.id === service.id ? '✓ Выбрано' : 'Выбрать'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      ${filtered.length === 0 ? `
        <div class="card text-center py-xl">
          <div style="font-size: 48px; margin-bottom: var(--space-md);">🔍</div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Услуги не найдены</h3>
          <p class="text-secondary">Попробуйте выбрать другую категорию</p>
        </div>
      ` : ''}
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
    this.state.master = null; // Reset master when service changes
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
        return `
          <div class="card text-center py-xl">
            <div style="font-size: 48px; margin-bottom: var(--space-md);">⚠️</div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Ошибка загрузки</h3>
            <p class="text-secondary">Попробуйте обновить страницу</p>
          </div>
        `;
      }
    }

    if (this.state.masters.length === 0) {
      return `
        <div class="card text-center py-xl">
          <div style="font-size: 48px; margin-bottom: var(--space-md);">👤</div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Нет доступных мастеров</h3>
          <p class="text-secondary mb-lg">Для этой услуги пока нет мастеров</p>
          <button class="btn btn-secondary" onclick="BookPage.goToStep(1)">
            ← Назад к услугам
          </button>
        </div>
      `;
    }

    return `
      <div class="mb-lg">
        <h2 class="section-title mb-md">Выберите мастера</h2>
        <p class="text-secondary mb-lg">Профессионалы, которые выполнят вашу процедуру</p>
        
        <!-- Selected service preview -->
        <div class="card mb-lg">
          <div class="flex items-center gap-md">
            <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 20px;">
              ${Utils.getCategoryInfo(this.state.service.category).emoji}
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: 2px;">${this.state.service.name}</h3>
              <p class="text-secondary">${this.state.service.duration_minutes || 60} мин • ${Utils.formatPrice(this.state.service.price)} ₽</p>
            </div>
            <button class="btn btn-ghost text-accent" onclick="BookPage.goToStep(1)">
              Изменить
            </button>
          </div>
        </div>
      </div>

      <!-- Masters grid -->
      <div class="masters-grid">
        ${this.state.masters.map(master => `
          <div class="master-card press-effect ${this.state.master?.id === master.id ? 'selected' : ''}" 
               onclick="BookPage.selectMaster(${master.id})"
               style="${this.state.master?.id === master.id ? 'border-color: var(--color-accent); box-shadow: var(--shadow-accent);' : ''}">
            <div class="master-avatar" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 24px;">
              ${master.first_name ? master.first_name.charAt(0).toUpperCase() : 'М'}
            </div>
            <h3 class="master-name">${master.first_name || 'Мастер'} ${master.last_name || ''}</h3>
            <p class="master-specialty">${master.specialty || 'Специалист'}</p>
            <div class="flex items-center justify-center gap-xs mt-sm">
              <span style="font-size: 12px; color: var(--color-accent);">★</span>
              <span style="font-size: var(--font-size-sm); font-weight: 500;">${master.rating || '5.0'}</span>
            </div>
            <div class="mt-md">
              <button class="btn ${this.state.master?.id === master.id ? 'btn-primary' : 'btn-secondary'} btn-sm" style="width: 100%;">
                ${this.state.master?.id === master.id ? '✓ Выбрано' : 'Выбрать'}
              </button>
            </div>
          </div>
        `).join('')}
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
      <div class="mb-lg">
        <h2 class="section-title mb-md">Выберите дату и время</h2>
        <p class="text-secondary mb-lg">Запланируйте удобный для вас визит</p>
        
        <!-- Selected service & master preview -->
        <div class="card mb-lg">
          <div class="flex items-center justify-between mb-md">
            <div class="flex items-center gap-md">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 18px;">
                ${Utils.getCategoryInfo(this.state.service.category).emoji}
              </div>
              <div>
                <h3 style="font-size: var(--font-size-base); font-weight: 600;">${this.state.service.name}</h3>
                <p class="text-sm text-secondary">${this.state.service.duration_minutes || 60} мин</p>
              </div>
            </div>
            <div style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-accent);">
              ${Utils.formatPrice(this.state.service.price)} ₽
            </div>
          </div>
          
          <div class="flex items-center gap-md">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--color-secondary); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 16px;">
              ${masterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">${masterName}</h3>
              <p class="text-sm text-secondary">Мастер</p>
            </div>
            <div style="margin-left: auto;">
              <button class="btn btn-ghost text-accent" onclick="BookPage.goToStep(2)">
                Изменить
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar -->
      <div id="calendar-container" class="mb-xl"></div>

      <!-- Time Slots -->
      <div id="slots-section" style="display: none;">
        <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-md);">Доступное время</h3>
        <div id="slots-container" class="time-slots"></div>
      </div>

      <!-- Loading slots -->
      <div id="slots-loading" style="display: none; text-align: center; padding: var(--space-xl);">
        <div class="loading-spinner" style="margin: 0 auto;"></div>
        <p class="text-secondary mt-md">Загружаем доступное время...</p>
      </div>

      <!-- Next button -->
      <div id="step3-next" style="display: none; margin-top: var(--space-xl);">
        <button class="btn btn-primary btn-full btn-lg press-effect" onclick="BookPage.goToStep(4)">
          Продолжить →
        </button>
      </div>
    `;
  },

  initCalendar() {
    // Simple calendar implementation for demo
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const today = new Date();
    const days = [];
    
    // Generate next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const currentMonth = monthNames[today.getMonth()];

    container.innerHTML = `
      <div class="card">
        <div class="flex items-center justify-between mb-md">
          <h3 style="font-size: var(--font-size-lg); font-weight: 600;">${currentMonth}</h3>
          <div class="flex gap-xs">
            <button class="btn btn-ghost" style="padding: 4px 8px;" onclick="BookPage.prevMonth()">
              ←
            </button>
            <button class="btn btn-ghost" style="padding: 4px 8px;" onclick="BookPage.nextMonth()">
              →
            </button>
          </div>
        </div>
        
        <div class="calendar-grid">
          ${dayNames.map(day => `
            <div style="text-align: center; font-size: var(--font-size-sm); color: var(--color-text-secondary); padding: 8px 0;">
              ${day}
            </div>
          `).join('')}
          
          ${days.map((date, index) => {
            const dayOfMonth = date.getDate();
            const dayOfWeek = date.getDay();
            const isToday = index === 0;
            const isSelected = this.state.date === Utils.formatDate(date);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            return `
              <div class="calendar-day ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}"
                   onclick="BookPage.selectDate('${Utils.formatDate(date)}')"
                   style="
                     grid-column: ${dayOfWeek + 1};
                     ${isToday ? 'font-weight: 700;' : ''}
                     ${isWeekend ? 'color: var(--color-accent);' : ''}
                   ">
                ${dayOfMonth}
                ${isToday ? '<div style="width: 4px; height: 4px; background: var(--color-accent); border-radius: 50%; margin: 2px auto 0;"></div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  selectDate(date) {
    this.state.date = date;
    this.state.slot = null;
    this.loadSlots(date);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock slots
      const mockSlots = [
        '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'
      ];
      
      slotsContainer.innerHTML = mockSlots.map(slot => `
        <button class="time-slot ${this.state.slot === slot ? 'selected' : ''}"
                onclick="BookPage.selectSlot('${slot}')">
          ${slot}
        </button>
      `).join('');

      slotsLoading.style.display = 'none';
      slotsSection.style.display = 'block';
      
    } catch (e) {
      console.error('Failed to load slots:', e);
      slotsLoading.innerHTML = `
        <div style="text-align: center; padding: var(--space-lg);">
          <div style="font-size: 48px; margin-bottom: var(--space-md);">😔</div>
          <h3 style="font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--space-sm);">Ошибка загрузки</h3>
          <p class="text-secondary">Попробуйте выбрать другую дату</p>
        </div>
      `;
    }
  },

  selectSlot(slot) {
    this.state.slot = slot;
    const nextBtn = document.getElementById('step3-next');
    if (nextBtn) {
      nextBtn.style.display = 'block';
    }
    
    // Update UI
    document.querySelectorAll('.time-slot').forEach(el => {
      el.classList.remove('selected');
    });
    event?.target?.classList.add('selected');
  },

  // ============================================
  // STEP 4: CONFIRMATION
  // ============================================

  renderStep4() {
    if (!this.state.service || !this.state.master || !this.state.date || !this.state.slot) {
      this.step = 3;
      return this.renderStep3();
    }

    const masterName = this.state.master.display_name || Utils.getMasterName(this.state.master);
    const formattedDate = Utils.formatDate(this.state.date, true);

    return `
      <div class="mb-lg">
        <h2 class="section-title mb-md">Подтверждение записи</h2>
        <p class="text-secondary mb-lg">Проверьте детали и подтвердите запись</p>
      </div>

      <!-- Booking summary -->
      <div class="card mb-lg">
        <div class="flex items-center justify-between mb-md">
          <h3 style="font-size: var(--font-size-lg); font-weight: 600;">Детали записи</h3>
          <div style="font-size: var(--font-size-sm); color: var(--color-accent); font-weight: 600; padding: 4px 12px; background: rgba(255, 107, 154, 0.1); border-radius: var(--radius-full);">
            Подтверждение
          </div>
        </div>
        
        <div class="space-y-md">
          <!-- Service -->
          <div class="flex items-center gap-md">
            <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 20px;">
              ${Utils.getCategoryInfo(this.state.service.category).emoji}
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">${this.state.service.name}</h3>
              <p class="text-secondary">${this.state.service.duration_minutes || 60} мин</p>
            </div>
            <div style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-accent);">
              ${Utils.formatPrice(this.state.service.price)} ₽
            </div>
          </div>
          
          <!-- Master -->
          <div class="flex items-center gap-md">
            <div style="width: 48px; height: 48px; border-radius: var(--radius-full); background: var(--color-secondary); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 18px;">
              ${masterName.charAt(0).toUpperCase()}
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">${masterName}</h3>
              <p class="text-secondary">Мастер</p>
            </div>
            <button class="btn btn-ghost text-accent" onclick="BookPage.goToStep(2)">
              Изменить
            </button>
          </div>
          
          <!-- Date & Time -->
          <div class="flex items-center gap-md">
            <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: var(--color-bg-secondary); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 20px;">
              📅
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">${formattedDate}</h3>
              <p class="text-secondary">${this.state.slot}</p>
            </div>
            <button class="btn btn-ghost text-accent" onclick="BookPage.goToStep(3)">
              Изменить
            </button>
          </div>
        </div>
        
        <!-- Total -->
        <div style="margin-top: var(--space-xl); padding-top: var(--space-md); border-top: 1px solid var(--color-border-light);">
          <div class="flex items-center justify-between">
            <div>
              <h3 style="font-size: var(--font-size-lg); font-weight: 600;">Итого</h3>
              <p class="text-secondary">Включая все услуги</p>
            </div>
            <div style="font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-accent);">
              ${Utils.formatPrice(this.state.service.price)} ₽
            </div>
          </div>
        </div>
      </div>

      <!-- Additional notes -->
      <div class="card mb-lg">
        <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--space-sm);">Дополнительные пожелания</h3>
        <textarea id="booking-notes" class="input" placeholder="Например, предпочтения по процедуре, аллергии и т.д." rows="3"></textarea>
      </div>

      <!-- Actions -->
      <div class="space-y-md">
        <button class="btn btn-primary btn-full btn-lg press-effect" onclick="BookPage.submitBooking()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
          Подтвердить запись
        </button>
        
        <button class="btn btn-secondary btn-full" onclick="BookPage.goToStep(3)">
          ← Назад
        </button>
      </div>
    `;
  },

  async submitBooking() {
    try {
      const notes = document.getElementById('booking-notes')?.value || '';
      
      const booking = await API.bookings.create({
        service_id: this.state.service.id,
        master_id: this.state.master.id,
        booking_date: this.state.date,
        start_time: this.state.slot,
        notes: notes
      });

      Utils.showToast('Запись успешно создана!', 'success');
      
      // Reset state
      this.state.service = null;
      this.state.master = null;
      this.state.date = null;
      this.state.slot = null;
      this.step = 1;
      
      // Navigate to bookings page
      setTimeout(() => App.navigate('bookings'), 1500);
      
    } catch (error) {
      console.error('Booking error:', error);
      Utils.showToast('Ошибка при создании записи', 'error');
    }
  },

  goToStep(step) {
    this.step = step;
    this.renderStep();
  },

  prevMonth() {
    // Implementation for previous month
    console.log('Previous month');
  },

  nextMonth() {
    // Implementation for next month
    console.log('Next month');
  }
};
