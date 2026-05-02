// ============================================
// UTILITY FUNCTIONS
// ============================================

const Utils = {
  // ============================================
  // DATE & TIME
  // ============================================

  formatDate(dateStr, format = 'short') {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();

    if (format === 'short') {
      return `${day} ${Config.MONTHS_GENITIVE[month]}`;
    }
    if (format === 'full') {
      return `${Config.DAYS_FULL[dayOfWeek]}, ${day} ${Config.MONTHS_GENITIVE[month]} ${year}`;
    }
    if (format === 'medium') {
      return `${day} ${Config.MONTHS_GENITIVE[month]} ${year}`;
    }
    if (format === 'day') {
      return `${Config.DAYS_FULL[dayOfWeek]}`;
    }
    return dateStr;
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  },

  formatPrice(price, priceMax = null) {
    if (!price && price !== 0) return 'Уточните цену';
    const formatted = new Intl.NumberFormat('ru-RU').format(price);
    if (priceMax) {
      const formattedMax = new Intl.NumberFormat('ru-RU').format(priceMax);
      return `от ${formatted} ₽`;
    }
    return `${formatted} ₽`;
  },

  formatDuration(minutes) {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
  },

  isToday(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  },

  isTomorrow(dateStr) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split('T')[0];
  },

  getRelativeDate(dateStr) {
    if (this.isToday(dateStr)) return 'Сегодня';
    if (this.isTomorrow(dateStr)) return 'Завтра';
    return this.formatDate(dateStr, 'short');
  },

  getTodayStr() {
    return new Date().toISOString().split('T')[0];
  },

  addDays(dateStr, days) {
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  // ============================================
  // STRING
  // ============================================

  getUserName(user) {
    if (!user) return 'Пользователь';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    if (user.username) return `@${user.username}`;
    return `ID: ${user.telegram_id || user.id}`;
  },

  getMasterName(master) {
    if (!master) return 'Мастер';
    return master.display_name || master.master_name ||
      this.getUserName({ first_name: master.master_first_name, last_name: master.master_last_name });
  },

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  },

  truncate(str, maxLength = 50) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  },

  pluralize(count, one, few, many) {
    if (count % 10 === 1 && count % 100 !== 11) return one;
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return few;
    return many;
  },

  // ============================================
  // DOM
  // ============================================

  el(id) {
    return document.getElementById(id);
  },

  qs(selector, parent = document) {
    return parent.querySelector(selector);
  },

  qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },

  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') el.className = value;
      else if (key === 'html') el.innerHTML = value;
      else if (key === 'text') el.textContent = value;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
      else el.setAttribute(key, value);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  },

  // ============================================
  // AVATAR
  // ============================================

  renderAvatar(name, imageUrl, size = 56) {
    const initials = this.getInitials(name);
    if (imageUrl) {
      return `<div class="master-avatar" style="width:${size}px;height:${size}px;overflow:hidden;position:relative">
        <img src="${imageUrl}" alt="${name}"
             style="width:100%;height:100%;object-fit:cover;border-radius:50%"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:${size * 0.38}px;font-weight:600;color:var(--color-primary);background:var(--color-bg-secondary);border-radius:50%">${initials}</div>
      </div>`;
    }
    return `<div class="master-avatar" style="width:${size}px;height:${size}px;font-size:${size * 0.38}px">${initials}</div>`;
  },

  // Avatar with upload overlay
  renderAvatarWithUpload(name, imageUrl, size = 80, onClick = '') {
    const avatar = this.renderAvatar(name, imageUrl, size);
    return `
      <div class="avatar-upload-wrapper" onclick="${onClick}" style="cursor:pointer">
        ${avatar}
        <div class="avatar-upload-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </div>
    `;
  },

  // ============================================
  // STARS RATING
  // ============================================

  renderStars(rating, max = 5) {
    const stars = [];
    for (let i = 1; i <= max; i++) {
      stars.push(i <= Math.round(rating) ? '★' : '☆');
    }
    return stars.join(' ');
  },

  // ============================================
  // DEBOUNCE
  // ============================================

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // ============================================
  // HAPTIC FEEDBACK
  // ============================================

  haptic(type = 'light') {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        if (type === 'light') window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        else if (type === 'medium') window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        else if (type === 'success') window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        else if (type === 'error') window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        else if (type === 'warning') window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
    } catch (e) {}
  },

  // ============================================
  // SCROLL
  // ============================================

  scrollToTop(smooth = true) {
    const container = document.getElementById('page-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }
  },

  // ============================================
  // SKELETON
  // ============================================

  skeletonCard(count = 3) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton skeleton-card"></div>
    `).join('');
  },

  // ============================================
  // CATEGORY / STATUS HELPERS
  // ============================================

  getCategoryInfo(category) {
    return Config.CATEGORIES[category] || { label: category, icon: '💆', emoji: '💆' };
  },

  getStatusInfo(status) {
    return Config.BOOKING_STATUS[status] || { label: status, class: '' };
  },

  // ============================================
  // FILE VALIDATION
  // ============================================

  validateFile(file) {
    const maxSize = Config.UPLOAD.maxSizeMB * 1024 * 1024;
    const allowedTypes = Config.UPLOAD.allowedTypes;

    if (file.size > maxSize) {
      return { valid: false, error: `Файл слишком большой. Максимум ${Config.UPLOAD.maxSizeMB} МБ` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Неподдерживаемый формат. Используйте JPG, PNG, WebP или GIF' };
    }

    return { valid: true, error: null };
  },

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async uploadFile(url, fieldName, file, extraFields = {}) {
    const formData = new FormData();
    formData.append(fieldName, file);

    Object.entries(extraFields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Telegram-Init-Data': API._initData || '',
        ...(API._devUserId ? { 'X-Dev-User-Id': API._devUserId } : {})
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw { status: response.status, message: data.error || 'Upload failed', data };
    return data;
  }
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const Toast = {
  show(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      default: '✦'
    };

    toast.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 300ms ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info: (msg) => Toast.show(msg, 'info')
};

// ============================================
// MODAL
// ============================================

const Modal = {
  open(content, title = '') {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');

    container.innerHTML = `
      <div class="modal-handle"></div>
      ${title ? `<div class="modal-title">${title}</div>` : ''}
      ${content}
    `;

    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');

    overlay.classList.add('hidden');
    container.classList.add('hidden');
    document.body.style.overflow = '';
  }
};
