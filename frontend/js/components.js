// ============================================
// REUSABLE COMPONENTS - YOUTH STYLE
// ============================================

// ============================================
// CALENDAR COMPONENT
// ============================================

const Calendar = {
  currentYear: null,
  currentMonth: null,
  selectedDate: null,
  onSelect: null,
  disabledDates: [],

  init(containerId, options = {}) {
    this.onSelect = options.onSelect || null;
    this.disabledDates = options.disabledDates || [];
    this.minDate = options.minDate || Utils.getTodayStr();
    this.maxDate = options.maxDate || null;

    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDate = options.selectedDate || null;

    this.containerId = containerId;
    this.render();
  },

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const year = this.currentYear;
    const month = this.currentMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = Utils.getTodayStr();

    // Build days grid
    let daysHtml = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      daysHtml += '<div class="calendar-day empty"></div>';
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === today;
      const isSelected = dateStr === this.selectedDate;
      const isPast = dateStr < this.minDate;
      const isFuture = this.maxDate && dateStr > this.maxDate;
      const isDisabled = isPast || isFuture || this.disabledDates.includes(dateStr);

      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' active';
      if (isDisabled) classes += ' disabled';

      daysHtml += `<div class="${classes}" ${!isDisabled ? `onclick="Calendar.selectDate('${dateStr}')"` : ''}>${d}</div>`;
    }

    container.innerHTML = `
      <div class="calendar">
        <div class="calendar-header">
          <button class="calendar-nav-btn" onclick="Calendar.prevMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div class="calendar-title">${Config.MONTHS[month]} ${year}</div>
          <button class="calendar-nav-btn" onclick="Calendar.nextMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        <div class="calendar-weekdays">
          ${Config.DAYS.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
        </div>
        <div class="calendar-days">${daysHtml}</div>
      </div>
    `;
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    Utils.haptic('light');
    this.render();
    if (this.onSelect) this.onSelect(dateStr);
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.render();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.render();
  }
};

// ============================================
// TIME SLOTS COMPONENT
// ============================================

const TimeSlots = {
  slots: [],
  selectedSlot: null,
  onSelect: null,

  render(containerId, slots, options = {}) {
    this.slots = slots;
    this.onSelect = options.onSelect || null;
    this.selectedSlot = options.selectedSlot || null;

    const container = document.getElementById(containerId);
    if (!container) return;

    if (!slots || slots.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">Нет доступных слотов</div>
          <div class="empty-state-text">Выберите другую дату или мастера</div>
        </div>
      `;
      return;
    }

    const availableSlots = slots.filter(s => s.available);
    if (availableSlots.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🚫</div>
          <div class="empty-state-title">Все слоты заняты</div>
          <div class="empty-state-text">Выберите другую дату</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="time-slots">
        ${slots.map(slot => `
          <div class="time-slot ${slot.available ? 'available' : 'unavailable'} ${this.selectedSlot?.start_time === slot.start_time ? 'selected' : ''}"
               ${slot.available ? `onclick="TimeSlots.selectSlot(${JSON.stringify(slot).replace(/"/g, '"')})"` : ''}>
            ${Utils.formatTime(slot.start_time)}
          </div>
        `).join('')}
      </div>
    `;
  },

  selectSlot(slot) {
    this.selectedSlot = slot;
    Utils.haptic('light');
    const container = document.getElementById(this._containerId);
    if (container) {
      container.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
      container.querySelectorAll('.time-slot.available').forEach(el => {
        if (el.textContent.trim() === Utils.formatTime(slot.start_time)) {
          el.classList.add('selected');
        }
      });
    }
    if (this.onSelect) this.onSelect(slot);
  }
};

// ============================================
// SERVICE CARD COMPONENT
// ============================================

const ServiceCard = {
  render(service, options = {}) {
    const { selected = false, onClick = '' } = options;
    const cat = Utils.getCategoryInfo(service.category);
    const price = Utils.formatPrice(service.price, service.price_max);
    const duration = Utils.formatDuration(service.duration_minutes);

    return `
      <div class="service-card ${selected ? 'selected' : ''} stagger-item" onclick="${onClick}">
        <div class="service-card-header">
          <div>
            <div style="font-size: 32px; margin-bottom: 8px;">${cat.emoji}</div>
            <div class="service-card-title">${service.name}</div>
            <div class="service-card-desc">${service.description || ''}</div>
          </div>
        </div>
        <div class="service-card-footer">
          <div class="service-card-price">${price}</div>
          <div class="service-card-duration">⏱ ${duration}</div>
        </div>
        ${selected ? '<div style="position:absolute;top:12px;right:12px;color:var(--color-primary);font-size:24px">✓</div>' : ''}
      </div>
    `;
  }
};

// ============================================
// MASTER CARD COMPONENT
// ============================================

const MasterCard = {
  render(master, options = {}) {
    const { selected = false, onClick = '', showServices = false } = options;
    const name = master.display_name || Utils.getMasterName(master);
    const rating = master.rating ? master.rating.toFixed(1) : null;
    const specs = Array.isArray(master.specializations) ? master.specializations : [];

    return `
      <div class="master-card ${selected ? 'selected' : ''} stagger-item" onclick="${onClick}">
        <div class="master-card-header">
          ${Utils.renderAvatar(name, master.avatar_url, 56)}
          <div class="master-card-info">
            <div class="master-card-name">${name}</div>
            ${rating ? `
              <div class="master-card-rating">
                ⭐ ${rating} <span style="color:var(--color-text-tertiary);font-weight:400">(${master.reviews_count || 0})</span>
              </div>
            ` : '<div class="master-card-rating" style="color:var(--color-text-tertiary)">🌟 Новый мастер</div>'}
          </div>
        </div>
        ${specs.length > 0 ? `<div class="master-card-bio">${specs.slice(0, 3).map(s => `✨ ${s}`).join(' • ')}</div>` : ''}
        ${selected ? '<div style="position:absolute;top:12px;right:12px;color:var(--color-primary);font-size:24px">✓</div>' : ''}
      </div>
    `;
  }
};

// ============================================
// BOOKING CARD COMPONENT
// ============================================

const BookingCard = {
  render(booking, options = {}) {
    const { onClick = '' } = options;
    const status = Utils.getStatusInfo(booking.status);
    const relDate = Utils.getRelativeDate(booking.booking_date);
    const masterName = booking.master_name || Utils.getMasterName(booking);

    return `
      <div class="booking-card stagger-item status-${booking.status}" onclick="${onClick}">
        <div class="booking-card-header">
          <div>
            <div style="font-size: 20px; margin-bottom: 4px;">${Utils.getStatusEmoji(booking.status)}</div>
            <div class="booking-card-service">${booking.service_name || 'Услуга'}</div>
          </div>
          <span class="booking-card-status status-${booking.status}">${status.label}</span>
        </div>
        <div class="booking-card-details">
          <div class="booking-card-detail">📅 ${relDate}</div>
          <div class="booking-card-detail">🕐 ${Utils.formatTime(booking.start_time)}</div>
          <div class="booking-card-detail">👤 ${masterName}</div>
        </div>
        ${booking.price ? `<div style="margin-top:8px;font-weight:700;font-size:var(--font-size-lg);background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${Utils.formatPrice(booking.price)}</div>` : ''}
      </div>
    `;
  }
};

// ============================================
// STEP INDICATOR COMPONENT
// ============================================

const StepIndicator = {
  render(steps, currentStep) {
    return `
      <div class="step-indicator" style="display:flex;gap:8px;justify-content:center;margin-bottom:var(--space-lg);padding:var(--space-md);background:var(--gradient-glass);border-radius:var(--radius-lg);backdrop-filter:blur(10px);">
        ${steps.map((step, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return `
            <div class="step" style="display:flex;align-items:center;gap:8px;${isActive ? 'opacity:1' : 'opacity:0.5'}">
              <div style="width:32px;height:32px;border-radius:var(--radius-full);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--font-size-sm);${isCompleted ? 'background:var(--gradient-primary);color:white;' : isActive ? 'border:2px solid var(--color-primary);color:var(--color-primary);' : 'background:var(--color-surface);color:var(--color-text-tertiary);'}">
                ${isCompleted ? '✓' : stepNum}
              </div>
              <div style="font-size:var(--font-size-xs);color:${isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'};font-weight:${isActive ? '600' : '400'}">${step}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};

// ============================================
// CATEGORY TABS COMPONENT
// ============================================

const CategoryTabs = {
  render(categories, activeCategory, onClickFn) {
    const allCategories = [
      { key: 'all', label: 'Все', icon: '💎' },
      ...categories.map(key => ({ key, ...Utils.getCategoryInfo(key) }))
    ];

    return `
      <div class="category-tabs">
        ${allCategories.map(cat => `
          <button class="category-tab ${activeCategory === cat.key ? 'active' : ''}"
                  onclick="${onClickFn}('${cat.key}')">
            ${cat.icon} ${cat.label}
          </button>
        `).join('')}
      </div>
    `;
  }
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

const EmptyState = {
  render(icon, title, text, buttonText = null, buttonAction = null) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-text">${text}</div>
        ${buttonText ? `<button class="btn btn-primary" onclick="${buttonAction}" style="margin-top:16px">${buttonText}</button>` : ''}
      </div>
    `;
  }
};
