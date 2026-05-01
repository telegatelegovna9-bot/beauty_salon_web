// ============================================
// REUSABLE COMPONENTS
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
      if (isSelected) classes += ' selected';
      if (isDisabled) classes += ' disabled';

      daysHtml += `<div class="${classes}" ${!isDisabled ? `onclick="Calendar.selectDate('${dateStr}')"` : ''}>${d}</div>`;
    }

    container.innerHTML = `
      <div class="calendar">
        <div class="calendar-header">
          <button class="calendar-nav-btn" onclick="Calendar.prevMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div class="calendar-title">${Config.MONTHS[month]} ${year}</div>
          <button class="calendar-nav-btn" onclick="Calendar.nextMonth()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      <div class="time-slots-grid">
        ${slots.map(slot => `
          <div class="time-slot ${slot.available ? 'available' : 'unavailable'} ${this.selectedSlot?.start_time === slot.start_time ? 'selected' : ''}"
               ${slot.available ? `onclick="TimeSlots.selectSlot(${JSON.stringify(slot).replace(/"/g, '&quot;')})"` : ''}>
            ${Utils.formatTime(slot.start_time)}
          </div>
        `).join('')}
      </div>
    `;
  },

  selectSlot(slot) {
    this.selectedSlot = slot;
    Utils.haptic('light');
    // Re-render to update selection
    const container = document.getElementById(this._containerId);
    if (container) {
      container.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
      // Find and mark selected
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
        <div class="service-icon">${cat.emoji}</div>
        <div class="service-info">
          <div class="service-name">${service.name}</div>
          <div class="service-meta">
            <span>⏱ ${duration}</span>
          </div>
        </div>
        <div class="service-price">${price}</div>
        ${selected ? '<div style="color:var(--color-gold);margin-left:4px">✓</div>' : ''}
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
        ${Utils.renderAvatar(name, master.avatar_url, 56)}
        <div class="master-info">
          <div class="master-name">${name}</div>
          ${specs.length > 0 ? `<div class="master-specialization">${specs.slice(0, 2).join(', ')}</div>` : ''}
          ${rating ? `
            <div class="master-rating">
              ★ ${rating}
              <span style="color:var(--color-text-tertiary);font-weight:400">(${master.reviews_count || 0})</span>
            </div>
          ` : '<div class="master-rating" style="color:var(--color-text-tertiary)">Новый мастер</div>'}
        </div>
        ${selected ? '<div style="color:var(--color-gold);font-size:20px">✓</div>' : `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        `}
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
      <div class="booking-card stagger-item" onclick="${onClick}">
        <div class="booking-card-header">
          <div class="booking-date-time">
            <div class="booking-date">${relDate}</div>
            <div class="booking-time">${Utils.formatTime(booking.start_time)}</div>
          </div>
          <span class="badge ${status.class}">${status.label}</span>
        </div>
        <div class="booking-card-body">
          <div style="font-weight:600;margin-bottom:4px">${booking.service_name || 'Услуга'}</div>
          <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">
            👤 ${masterName}
          </div>
          ${booking.price ? `<div style="font-size:var(--font-size-sm);color:var(--color-gold-dark);font-weight:600;margin-top:4px">${Utils.formatPrice(booking.price)}</div>` : ''}
        </div>
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
      <div class="step-indicator">
        ${steps.map((step, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return `
            <div class="step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
              <div class="step-dot">${isCompleted ? '✓' : stepNum}</div>
              <div class="step-label">${step}</div>
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
      { key: 'all', label: 'Все', icon: '✦' },
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
        ${buttonText ? `<button class="btn btn-primary" onclick="${buttonAction}">${buttonText}</button>` : ''}
      </div>
    `;
  }
};
