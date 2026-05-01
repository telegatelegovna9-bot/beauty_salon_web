// ============================================
// BOOKINGS PAGE - YOUTH STYLE
// ============================================

const BookingsPage = {
  activeFilter: 'upcoming',

  async render(params = {}) {
    return `
      <div class="page page-enter" id="bookings-page">
        <!-- Filter Tabs -->
        <div style="display:flex;gap:var(--space-sm);padding:var(--space-md);overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;">
          <button class="category-tab ${this.activeFilter === 'upcoming' ? 'active' : ''}" onclick="BookingsPage.setFilter('upcoming')">⏳ Предстоящие</button>
          <button class="category-tab ${this.activeFilter === 'completed' ? 'active' : ''}" onclick="BookingsPage.setFilter('completed')">✅ Завершённые</button>
          <button class="category-tab ${this.activeFilter === 'cancelled' ? 'active' : ''}" onclick="BookingsPage.setFilter('cancelled')">❌ Отменённые</button>
        </div>

        <div id="bookings-list" style="padding:0 var(--space-md) var(--space-lg);display:flex;flex-direction:column;gap:var(--space-md)">
          ${Utils.skeletonCard(4)}
        </div>
      </div>
    `;
  },

  async afterRender(params = {}) {
    await this.loadBookings();
  },

  setFilter(filter) {
    this.activeFilter = filter;
    // Update tab styles
    document.querySelectorAll('#bookings-page .category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.textContent.trim().includes(this.getFilterLabel(filter)));
    });
    this.loadBookings();
  },

  getFilterLabel(filter) {
    const labels = { upcoming: 'Предстоящие', completed: 'Завершённые', cancelled: 'Отменённые' };
    return labels[filter] || filter;
  },

  async loadBookings() {
    const container = document.getElementById('bookings-list');
    if (!container) return;

    container.innerHTML = Utils.skeletonCard(4);

    try {
      let params = { limit: 50 };

      if (this.activeFilter === 'completed') {
        params.status = 'completed';
      } else if (this.activeFilter === 'cancelled') {
        params.status = 'cancelled';
      }

      const { bookings } = await API.bookings.my(params);

      let filtered = bookings;
      if (this.activeFilter === 'upcoming') {
        filtered = bookings.filter(b =>
          ['pending', 'confirmed'].includes(b.status) &&
          b.booking_date >= Utils.getTodayStr()
        );
      }

      if (filtered.length === 0) {
        const emptyMessages = {
          upcoming: { icon: '📅', title: 'Нет записей', text: 'У вас нет предстоящих записей', btnText: 'Записаться', btnAction: "App.navigate('book')" },
          completed: { icon: '✅', title: 'Нет завершённых', text: 'Здесь будут ваши завершённые записи', btnText: null, btnAction: null },
          cancelled: { icon: '❌', title: 'Нет отменённых', text: 'У вас нет отменённых записей', btnText: null, btnAction: null }
        };
        const msg = emptyMessages[this.activeFilter];
        container.innerHTML = EmptyState.render(msg.icon, msg.title, msg.text, msg.btnText, msg.btnAction);
        return;
      }

      container.innerHTML = filtered.map(booking =>
        BookingCard.render(booking, {
          onClick: `BookingsPage.openBooking(${booking.id})`
        })
      ).join('');

    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message || 'Попробуйте позже');
    }
  },

  openBooking(bookingId) {
    App.navigate('booking-detail', { bookingId });
  }
};

// ============================================
// BOOKING DETAIL PAGE - YOUTH STYLE
// ============================================

const BookingDetailPage = {
  booking: null,

  async render(params = {}) {
    return `<div class="page page-enter" id="booking-detail-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(3)}</div>
    </div>`;
  },

  async afterRender(params = {}) {
    if (!params.bookingId) {
      App.navigate('bookings');
      return;
    }
    await this.loadBooking(params.bookingId);
  },

  async loadBooking(bookingId) {
    const container = document.getElementById('booking-detail-page');
    if (!container) return;

    try {
      const { booking } = await API.bookings.get(bookingId);
      this.booking = booking;

      const status = Utils.getStatusInfo(booking.status);
      const masterName = booking.master_name || Utils.getMasterName(booking);
      const user = Store.get('user');
      const masterProfile = Store.get('masterProfile');
      const isMaster = masterProfile && String(masterProfile.id) === String(booking.master_id);
      const isAdmin = user?.role === 'admin';

      // Action buttons based on role and status
      let actionButtons = '';

      if (booking.status === 'pending') {
        if (isMaster || isAdmin) {
          actionButtons += `
            <button class="btn btn-primary btn-full" onclick="BookingDetailPage.updateStatus('confirmed')">
              ✅ Подтвердить
            </button>
          `;
        }
        actionButtons += `
          <button class="btn btn-danger btn-full" onclick="BookingDetailPage.showCancelModal()">
            ❌ Отменить
          </button>
        `;
      }

      if (booking.status === 'confirmed') {
        if (isMaster || isAdmin) {
          actionButtons += `
            <button class="btn btn-primary btn-full" onclick="BookingDetailPage.updateStatus('completed')">
              🎉 Завершить
            </button>
            <button class="btn btn-danger btn-full" onclick="BookingDetailPage.showCancelModal()">
              ❌ Отменить
            </button>
          `;
        } else {
          actionButtons += `
            <button class="btn btn-danger btn-full" onclick="BookingDetailPage.showCancelModal()">
              ❌ Отменить запись
            </button>
          `;
        }
      }

      if (booking.status === 'completed' && !isMaster) {
        actionButtons += `
          <button class="btn btn-secondary btn-full" onclick="BookingDetailPage.showReviewModal()">
            ⭐ Оставить отзыв
          </button>
        `;
      }

      const statusEmojis = {
        'pending': '⏳',
        'confirmed': '✅',
        'completed': '🎉',
        'cancelled': '❌',
        'no-show': '😔'
      };

      container.innerHTML = `
        <div style="padding:var(--space-md)">
          <!-- Status Banner -->
          <div class="card" style="text-align:center; padding:var(--space-xl); margin-bottom:var(--space-lg); background:var(--gradient-glass); backdrop-filter:blur(10px);">
            <div style="font-size:64px; margin-bottom:12px; animation:${booking.status === 'completed' ? 'bounce 2s ease-in-out infinite' : 'float 3s ease-in-out infinite'};">${statusEmojis[booking.status] || '📅'}</div>
            <span class="badge ${status.class}" style="font-size:var(--font-size-base); padding:8px 20px;">${status.label}</span>
          </div>

          <!-- Details Card -->
          <div class="card" style="margin-bottom:var(--space-lg);">
            <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md); background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              📋 Детали записи
            </div>

            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
              <span style="color: var(--color-text-secondary);">💅 Услуга</span>
              <span style="font-weight: 600;">${booking.service_name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
              <span style="color: var(--color-text-secondary);">👩‍🎨 Мастер</span>
              <span style="font-weight: 600;">${masterName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
              <span style="color: var(--color-text-secondary);">📅 Дата</span>
              <span style="font-weight: 600;">${Utils.formatDate(booking.booking_date, 'full')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
              <span style="color: var(--color-text-secondary);">⏰ Время</span>
              <span style="font-weight: 600;">${Utils.formatTime(booking.start_time)} — ${Utils.formatTime(booking.end_time)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border);">
              <span style="color: var(--color-text-secondary);">⏱ Длительность</span>
              <span style="font-weight: 600;">${Utils.formatDuration(booking.duration_minutes)}</span>
            </div>
            ${booking.price ? `
              <div style="display: flex; justify-content: space-between; padding: 16px 0 0;">
                <span style="font-size: var(--font-size-lg); font-weight: 700;">💰 Стоимость</span>
                <span style="font-size: var(--font-size-xl); font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${Utils.formatPrice(booking.price)}</span>
              </div>
            ` : ''}
          </div>

          ${booking.notes ? `
            <div class="card" style="margin-bottom: var(--space-lg);">
              <div style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: 8px;">💬 Комментарий</div>
              <div style="color: var(--color-text-secondary); line-height: 1.6;">${booking.notes}</div>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
            ${actionButtons}
          </div>
        </div>
      `;

    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message || 'Попробуйте позже');
    }
  },

  async updateStatus(newStatus) {
    if (!this.booking) return;

    const statusLabels = {
      confirmed: 'подтверждённой',
      completed: 'завершённой'
    };

    if (!confirm(`Изменить статус записи на "${statusLabels[newStatus] || newStatus}"?`)) return;

    try {
      await API.bookings.updateStatus(this.booking.id, newStatus);
      Utils.haptic('success');
      Toast.success('Статус обновлён!');
      await this.loadBooking(this.booking.id);
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка обновления статуса');
    }
  },

  showCancelModal() {
    Modal.open(`
      <div style="text-align:center; padding: var(--space-md) 0;">
        <div style="font-size: 48px; margin-bottom: 12px;">❌</div>
        <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: 8px;">Отменить запись?</div>
        <div style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">Это действие нелзя отменить</div>
        <div style="display: flex; gap: var(--space-md);">
          <button class="btn btn-ghost flex-1" onclick="Modal.close()">Нет</button>
          <button class="btn btn-danger flex-1" onclick="BookingDetailPage.cancelBooking()">Да, отменить</button>
        </div>
      </div>
    `, 'Отмена записи');
  },

  async cancelBooking() {
    if (!this.booking) return;

    try {
      await API.bookings.updateStatus(this.booking.id, 'cancelled');
      Utils.haptic('success');
      Modal.close();
      Toast.success('Запись отменена');
      setTimeout(() => App.navigate('bookings'), 500);
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка отмены записи');
    }
  },

  showReviewModal() {
    Modal.open(`
      <div>
        <div style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md); background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          ⭐ Оставить отзыв
        </div>
        <div style="margin-bottom: var(--space-md);">
          <label class="form-label">Ваша оценка</label>
          <div id="rating-stars" style="display: flex; gap: 8px; font-size: 32px; cursor: pointer;">
            <span onclick="BookingDetailPage.setRating(1)">☆</span>
            <span onclick="BookingDetailPage.setRating(2)">☆</span>
            <span onclick="BookingDetailPage.setRating(3)">☆</span>
            <span onclick="BookingDetailPage.setRating(4)">☆</span>
            <span onclick="BookingDetailPage.setRating(5)">☆</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Комментарий (необязательно)</label>
          <textarea class="form-input" id="review-comment" placeholder="Расскажите о вашем опыте..." style="min-height: 100px;"></textarea>
        </div>
        <button class="btn btn-primary btn-full" onclick="BookingDetailPage.submitReview()">
          Отправить отзыв ✨
        </button>
      </div>
    `, 'Отзыв');
    this.rating = 0;
  },

  setRating(rating) {
    this.rating = rating;
    const stars = document.querySelectorAll('#rating-stars span');
    stars.forEach((star, i) => {
      star.textContent = i < rating ? '★' : '☆';
      star.style.color = i < rating ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
    });
  },

  async submitReview() {
    if (!this.booking || !this.rating) {
      Toast.warning('Поставьте оценку');
      return;
    }

    const comment = document.getElementById('review-comment')?.value || '';

    try {
      await API.bookings.addReview(this.booking.id, {
        rating: this.rating,
        comment
      });
      Utils.haptic('success');
      Modal.close();
      Toast.success('Спасибо за отзыв! 🎉');
      await this.loadBooking(this.booking.id);
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка отправки отзыва');
    }
  }
};
