// ============================================
// REUSABLE COMPONENTS - Premium Redesign
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
      const isDisabled = this.disabledDates.includes(dateStr) ||
        (this.minDate && dateStr < this.minDate) ||
        (this.maxDate && dateStr > this.maxDate);

      daysHtml += `
        <div class="calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''}"
             onclick="${!isDisabled ? `Calendar.selectDate('${dateStr}')` : ''}">
          ${d}
          ${isToday ? '<div class="today-dot"></div>' : ''}
        </div>
      `;
    }

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    container.innerHTML = `
      <div class="calendar">
        <div class="calendar-header">
          <button class="calendar-nav" onclick="Calendar.prevMonth()">←</button>
          <div class="calendar-title">${monthNames[month]} ${year}</div>
          <button class="calendar-nav" onclick="Calendar.nextMonth()">→</button>
        </div>
        <div class="calendar-weekdays">
          ${dayNames.map(day => `<div class="weekday">${day}</div>`).join('')}
        </div>
        <div class="calendar-grid">
          ${daysHtml}
        </div>
      </div>
    `;
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.render();
    if (this.onSelect) this.onSelect(dateStr);
  },

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.render();
  },

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.render();
  }
};

// ============================================
// SERVICE CARD COMPONENT - Premium Redesign
// ============================================

const ServiceCard = {
  render(service, options = {}) {
    const { selected = false, onClick = '', compact = false } = options;
    const cat = Utils.getCategoryInfo(service.category);
    const price = Utils.formatPrice(service.price, service.price_max);
    const duration = Utils.formatDuration(service.duration_minutes);

    if (compact) {
      return `
        <div class="card service-card-compact press-effect ${selected ? 'selected' : ''}" onclick="${onClick}"
             style="${selected ? 'border-color: var(--color-accent); box-shadow: var(--shadow-accent);' : ''}">
          <div class="flex items-center gap-md">
            <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 20px;">
              ${cat.emoji}
            </div>
            <div style="flex: 1;">
              <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: 2px;">${service.name}</h3>
              <p class="text-secondary">${duration}</p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-accent);">${price}</div>
              ${selected ? '<div style="font-size: var(--font-size-sm); color: var(--color-accent); margin-top: 2px;">✓ Выбрано</div>' : ''}
            </div>
          </div>
        </div>
      `;
    }

    // Full card with image
    return `
      <div class="service-card press-effect ${selected ? 'selected' : ''}" onclick="${onClick}"
           style="${selected ? 'border-color: var(--color-accent); box-shadow: var(--shadow-accent);' : ''}">
        <div class="service-image" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 32px;">
          ${cat.emoji}
        </div>
        <div class="service-content">
          <h3 class="service-title">${service.name}</h3>
          <div class="service-duration">${duration}</div>
          <div class="service-price">${price}</div>
          <button class="btn ${selected ? 'btn-primary' : 'btn-secondary'} btn-sm mt-md" style="width: 100%;">
            ${selected ? '✓ Выбрано' : 'Выбрать'}
          </button>
        </div>
      </div>
    `;
  }
};

// ============================================
// PRICE LIST COMPONENT
// ============================================

const PriceList = {
  render(services, options = {}) {
    const { groupByCategory = true, showFilters = true } = options;
    
    // Group services by category
    const categories = {};
    services.forEach(service => {
      const cat = service.category || 'other';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(service);
    });

    // Category tabs
    const categoryTabs = Object.keys(categories).map(cat => {
      const catInfo = Utils.getCategoryInfo(cat);
      return `
        <div class="chip" onclick="PriceList.filterCategory('${cat}')">
          ${catInfo.emoji} ${catInfo.label}
        </div>
      `;
    }).join('');

    // Services by category
    const servicesByCategory = Object.entries(categories).map(([cat, catServices]) => {
      const catInfo = Utils.getCategoryInfo(cat);
      return `
        <div class="price-category">
          <div class="flex items-center gap-md mb-lg">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 18px;">
              ${catInfo.emoji}
            </div>
            <div>
              <h2 style="font-size: var(--font-size-xl); font-weight: 700;">${catInfo.label}</h2>
              <p class="text-secondary">${catServices.length} услуг</p>
            </div>
          </div>
          
          <div class="price-services">
            ${catServices.map(service => `
              <div class="card price-service-item">
                <div class="flex items-center justify-between">
                  <div style="flex: 1;">
                    <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: 4px;">${service.name}</h3>
                    <p class="text-secondary">${Utils.formatDuration(service.duration_minutes)}</p>
                    ${service.description ? `<p class="text-sm text-secondary mt-sm">${service.description}</p>` : ''}
                  </div>
                  <div style="text-align: right; min-width: 100px;">
                    <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--color-accent);">
                      ${Utils.formatPrice(service.price)} ₽
                    </div>
                    ${service.price_max && service.price_max > service.price ? `
                      <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); text-decoration: line-through;">
                        ${Utils.formatPrice(service.price_max)} ₽
                      </div>
                    ` : ''}
                  </div>
                </div>
                <button class="btn btn-outline btn-sm mt-md" onclick="App.navigate('book', { serviceId: ${service.id} })" style="width: 100%;">
                  Записаться
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="price-list">
        ${showFilters ? `
          <div class="mb-xl">
            <h1 class="section-title mb-md">Прайс-лист</h1>
            <p class="text-secondary mb-lg">Актуальные цены на все услуги салона</p>
            <div class="chips-container">
              <div class="chip active" onclick="PriceList.filterCategory('all')">Все услуги</div>
              ${categoryTabs}
            </div>
          </div>
        ` : ''}
        
        ${servicesByCategory}
        
        <!-- Promo banner -->
        <div class="card mt-xl" style="background: linear-gradient(135deg, var(--color-accent), var(--color-accent-light)); color: white;">
          <div class="flex items-center justify-between">
            <div>
              <h3 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-xs);">Скидка 20% на комплекс</h3>
              <p style="font-size: var(--font-size-sm); opacity: 0.9;">При записи на 3 и более процедур</p>
            </div>
            <button class="btn" style="background: rgba(255,255,255,0.2); color: white;" onclick="App.navigate('book')">
              Узнать больше
            </button>
          </div>
        </div>
      </div>
    `;
  },

  filterCategory(category) {
    // Implementation would filter the price list
    console.log('Filter by category:', category);
  }
};

// ============================================
// MASTER CARD COMPONENT - Premium Redesign
// ============================================

const MasterCard = {
  render(master, options = {}) {
    const { selected = false, onClick = '', showServices = false } = options;
    const name = master.display_name || Utils.getMasterName(master);
    const rating = master.rating ? master.rating.toFixed(1) : null;
    const specs = Array.isArray(master.specializations) ? master.specializations : [];

    return `
      <div class="master-card press-effect ${selected ? 'selected' : ''}" onclick="${onClick}"
           style="${selected ? 'border-color: var(--color-accent); box-shadow: var(--shadow-accent);' : ''}">
        <div class="master-avatar" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-accent-light)); display: flex; align-items: center; justify-content: center; color: var(--color-accent); font-size: 24px;">
          ${name.charAt(0).toUpperCase()}
        </div>
        <h3 class="master-name">${name}</h3>
        ${specs.length > 0 ? `<p class="master-specialty">${specs.slice(0, 2).join(', ')}</p>` : ''}
        ${rating ? `
          <div class="flex items-center justify-center gap-xs mt-sm">
            <span style="font-size: 12px; color: var(--color-accent);">★</span>
            <span style="font-size: var(--font-size-sm); font-weight: 500;">${rating}</span>
          </div>
        ` : ''}
        <div class="mt-md">
          <button class="btn ${selected ? 'btn-primary' : 'btn-secondary'} btn-sm" style="width: 100%;">
            ${selected ? '✓ Выбрано' : 'Выбрать'}
          </button>
        </div>
      </div>
    `;
  }
};

// ============================================
// BOOKING CARD COMPONENT
// ============================================

const BookingCard = {
  render(booking, options = {}) {
    const { onClick = '', showActions = false } = options;
    const statusInfo = Utils.getStatusInfo(booking.status);
    const serviceName = booking.service_name || 'Услуга';
    const masterName = booking.master_first_name || 'Мастер';
    const date = Utils.formatDate(booking.booking_date, true);
    const time = Utils.formatTime(booking.start_time);

    return `
      <div class="card booking-card press-effect" onclick="${onClick}">
        <div class="flex items-center justify-between mb-md">
          <div>
            <h3 style="font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary);">
              ${serviceName}
            </h3>
            <p class="text-secondary">${date} • ${time}</p>
          </div>
          <span class="chip ${booking.status === 'confirmed' ? 'active' : ''}" style="font-size: var(--font-size-xs); padding: 4px 8px;">
            ${statusInfo.label}
          </span>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-sm">
            <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--color-secondary); display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--color-accent);">
              ${masterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style="font-weight: 500;">${masterName}</p>
              <p class="text-sm text-secondary">Мастер</p>
            </div>
          </div>
          ${booking.price ? `
            <div style="text-align: right;">
              <p style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-accent);">
                ${Utils.formatPrice(booking.price)} ₽
              </p>
            </div>
          ` : ''}
        </div>
        
        ${showActions ? `
          <div class="flex gap-sm mt-md">
            <button class="btn btn-secondary btn-sm flex-1" onclick="event.stopPropagation(); BookingCard.cancelBooking(${booking.id})">
              Отменить
            </button>
            <button class="btn btn-primary btn-sm flex-1" onclick="event.stopPropagation(); BookingCard.reschedule(${booking.id})">
              Перенести
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  cancelBooking(bookingId) {
    if (confirm('Вы уверены, что хотите отменить запись?')) {
      API.bookings.cancel(bookingId)
        .then(() => {
          Utils.showToast('Запись отменена', 'success');
          App.refreshPage();
        })
        .catch(e => {
          Utils.showToast('Ошибка отмены', 'error');
        });
    }
  },

  reschedule(bookingId) {
    App.navigate('book', { bookingId });
  }
};

// ============================================
// STEP INDICATOR COMPONENT
// ============================================

const StepIndicator = {
  render(steps, currentStep) {
    return `
      <div class="step-indicator">
        ${steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          
          return `
            <div class="step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
              <div class="step-number">${isCompleted ? '✓' : stepNum}</div>
              <div class="step-label">${step}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

const EmptyState = {
  render(icon, title, subtitle, buttonText, buttonAction) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-subtitle">${subtitle}</div>
        ${buttonText ? `
          <button class="btn btn-primary mt-md" onclick="${buttonAction}">
            ${buttonText}
          </button>
        ` : ''}
      </div>
    `;
  }
};

// ============================================
// MODAL COMPONENT
// ============================================

const Modal = {
  open(content, options = {}) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    
    if (!overlay || !container) return;
    
    container.innerHTML = content;
    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
    
    // Add close button if not present
    if (options.closeButton !== false) {
      const closeBtn = `<button class="modal-close" onclick="Modal.close()">×</button>`;
      container.innerHTML = closeBtn + container.innerHTML;
    }
  },
  
  close() {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    
    if (overlay) overlay.classList.add('hidden');
    if (container) container.classList.add('hidden');
  }
};

// ============================================
// TOAST COMPONENT
// ============================================

const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${this.getIcon(type)}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
  },
  
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || 'ℹ';
  },
  
  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  warning(message) { this.show(message, 'warning'); },
  info(message) { this.show(message, 'info'); }
};

// ============================================
// SKELETON LOADING COMPONENT
// ============================================

const Skeleton = {
  card(count = 1) {
    return Array(count).fill(`
      <div class="card skeleton" style="height: 120px;"></div>
    `).join('');
  },
  
  list(count = 1) {
    return Array(count).fill(`
      <div class="skeleton" style="height: 60px; margin-bottom: var(--space-sm);"></div>
    `).join('');
  },
  
  text(lines = 1) {
    return Array(lines).fill(`
      <div class="skeleton" style="height: 20px; margin-bottom: 8px;"></div>
    `).join('');
  }
};

// ============================================
// CATEGORY TABS COMPONENT
// ============================================

const CategoryTabs = {
  render(categories, activeCategory, onClickHandler) {
    const allCategories = ['all', ...categories];
    
    return `
      <div class="category-tabs">
        ${allCategories.map(cat => {
          const catInfo = Utils.getCategoryInfo(cat);
          const isActive = cat === activeCategory;
          
          return `
            <button class="category-tab ${isActive ? 'active' : ''}" 
                    onclick="${onClickHandler}('${cat}')">
              ${cat === 'all' ? 'Все' : catInfo.emoji}
              <span>${cat === 'all' ? 'Все' : catInfo.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }
};
