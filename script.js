// ÁNIMA — filtrado de catálogo + carrito con panel lateral

document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.product-card'));
  const checkboxes = Array.from(document.querySelectorAll('.filter-option input'));
  const resultCount = document.getElementById('result-count');
  const resetBtn = document.querySelector('.filter-reset');

  // ===================== NAV MOBILE (hamburguesa) =====================
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // cerrar el menú mobile al tocar un link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ===================== ACORDEÓN DE FILTROS (mobile) =====================
  const filtersAside = document.querySelector('.filters');
  const filtersTitle = document.querySelector('.filters-title');

  if (filtersAside && filtersTitle) {
    filtersTitle.addEventListener('click', () => {
      filtersAside.classList.toggle('is-open');
    });
  }

  // ===================== CARRITO =====================
  const cartCountEl = document.querySelector('.cart-count');
  const cartToggle = document.getElementById('cart-toggle');
  const cartPanel = document.getElementById('cart-panel');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartClose = document.getElementById('cart-close');
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const cartTotalEl = document.getElementById('cart-total');

  // cart: array de { id, name, tag, price (number), qty }
  const cart = [];
  let nextId = 1;

  function parsePrice(priceText) {
    // "$18.500" -> 18500
    return parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
  }

  function formatPrice(amount) {
    return '$' + amount.toLocaleString('es-AR');
  }

  function updateCartBadge() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.textContent = totalQty;
  }

  function renderCart() {
    cartItemsEl.innerHTML = '';

    if (cart.length === 0) {
      cartItemsEl.appendChild(cartEmptyEl);
      cartTotalEl.textContent = formatPrice(0);
      return;
    }

    let total = 0;

    cart.forEach(item => {
      total += item.price * item.qty;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-tag">${item.tag}</p>
        </div>
        <div class="cart-item-qty">
          <button type="button" class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Restar uno">−</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Sumar uno">+</button>
        </div>
        <p class="cart-item-price">${formatPrice(item.price * item.qty)}</p>
        <button type="button" class="cart-item-remove" data-action="remove" data-id="${item.id}" aria-label="Quitar ${item.name}">✕</button>
      `;
      cartItemsEl.appendChild(row);
    });

    cartTotalEl.textContent = formatPrice(total);
  }

  function addToCart({ name, tag, price, qty = 1 }) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: nextId++, name, tag, price, qty });
    }

    updateCartBadge();
    renderCart();
  }

  function getCardData(card) {
    return {
      name: card.querySelector('.product-name').textContent.trim(),
      tag: card.querySelector('.product-tag').textContent.trim(),
      price: parsePrice(card.querySelector('.product-price').textContent.trim()),
    };
  }

  function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
      return;
    }
    updateCartBadge();
    renderCart();
  }

  function removeFromCart(id) {
    const index = cart.findIndex(i => i.id === id);
    if (index === -1) return;
    cart.splice(index, 1);
    updateCartBadge();
    renderCart();
  }

  cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'inc') changeQty(id, 1);
    if (action === 'dec') changeQty(id, -1);
    if (action === 'remove') removeFromCart(id);
  });

  function openCart() {
    cartPanel.classList.add('is-open');
    cartOverlay.hidden = false;
    requestAnimationFrame(() => cartOverlay.classList.add('is-open'));
    cartPanel.setAttribute('aria-hidden', 'false');
    cartToggle.setAttribute('aria-expanded', 'true');
  }

  function closeCart() {
    cartPanel.classList.remove('is-open');
    cartOverlay.classList.remove('is-open');
    cartPanel.setAttribute('aria-hidden', 'true');
    cartToggle.setAttribute('aria-expanded', 'false');
    setTimeout(() => { cartOverlay.hidden = true; }, 300);
  }

  cartToggle.addEventListener('click', () => {
    const isOpen = cartPanel.classList.contains('is-open');
    isOpen ? closeCart() : openCart();
  });
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });

  // ===================== FIDELIDAD: ENVÍO GRATIS CADA 6TA COMPRA =====================
  // Cuenta compras finalizadas por navegador/dispositivo (localStorage).
  // Cada 5 compras acumuladas, la 6ta sale con envío gratis y el contador se reinicia.
  const LOYALTY_KEY = 'messina_loyalty_purchases';
  const PURCHASES_FOR_FREE_SHIPPING = 5;

  const loyaltyTextEl = document.getElementById('loyalty-text');
  const loyaltyBarFillEl = document.getElementById('loyalty-bar-fill');
  const checkoutBtn = document.getElementById('cart-checkout');

  function getLoyaltyCount() {
    try {
      const raw = localStorage.getItem(LOYALTY_KEY);
      const n = raw ? parseInt(raw, 10) : 0;
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  }

  function setLoyaltyCount(n) {
    try {
      localStorage.setItem(LOYALTY_KEY, String(n));
    } catch {
      // si localStorage no está disponible, el conteo no persiste entre visitas
    }
  }

  function renderLoyalty() {
    const count = getLoyaltyCount();
    const pct = Math.min(100, (count / PURCHASES_FOR_FREE_SHIPPING) * 100);
    loyaltyBarFillEl.style.width = pct + '%';

    if (count >= PURCHASES_FOR_FREE_SHIPPING) {
      loyaltyTextEl.innerHTML = '<strong>¡Esta compra tiene envío gratis! 🎉</strong>';
    } else {
      const remaining = PURCHASES_FOR_FREE_SHIPPING - count;
      loyaltyTextEl.innerHTML = `Llevás <strong>${count} de ${PURCHASES_FOR_FREE_SHIPPING}</strong> compras para tu envío gratis (te ${remaining === 1 ? 'falta' : 'faltan'} ${remaining})`;
    }
  }

  renderLoyalty();

  function buildWhatsAppOrderMessage(freeShipping, customerData) {
    const lines = cart.map(item => `- ${item.name} (${item.tag}) x${item.qty} — ${formatPrice(item.price * item.qty)}`);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    let msg = "Hola Messina's name, quiero confirmar este pedido:\n\n";
    msg += lines.join('\n');
    msg += `\n\nTotal: ${formatPrice(total)}`;
    if (freeShipping) {
      msg += '\n\n🎉 Esta compra tiene envío gratis por fidelidad.';
    }

    msg += '\n\nDatos para la entrega:';
    msg += `\nTitular: ${customerData.name}`;
    msg += `\nTeléfono: ${customerData.phone}`;
    msg += `\nDomicilio: ${customerData.address}`;
    msg += `\nHorario preferido: ${customerData.time}`;
    msg += `\nMedio de pago: ${customerData.payment}`;

    return msg;
  }

  // ===================== MODAL DE CHECKOUT (datos de entrega) =====================
  const checkoutOverlay = document.getElementById('checkout-overlay');
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutClose = document.getElementById('checkout-close');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutFormError = document.getElementById('checkout-form-error');

  function openCheckoutModal() {
    checkoutModal.classList.add('is-open');
    checkoutOverlay.hidden = false;
    requestAnimationFrame(() => checkoutOverlay.classList.add('is-open'));
    checkoutModal.setAttribute('aria-hidden', 'false');
  }

  function closeCheckoutModal() {
    checkoutModal.classList.remove('is-open');
    checkoutOverlay.classList.remove('is-open');
    checkoutModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { checkoutOverlay.hidden = true; }, 250);
  }

  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckoutModal);
  if (checkoutOverlay) checkoutOverlay.addEventListener('click', closeCheckoutModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCheckoutModal();
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      closeCart();
      openCheckoutModal();
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('checkout-name').value.trim();
      const phone = document.getElementById('checkout-phone').value.trim();
      const address = document.getElementById('checkout-address').value.trim();
      const timeRadio = checkoutForm.querySelector('input[name="checkout-time"]:checked');
      const payment = document.getElementById('checkout-payment').value;

      if (!name || !phone || !address || !timeRadio || !payment) {
        checkoutFormError.hidden = false;
        return;
      }
      checkoutFormError.hidden = true;

      const customerData = {
        name,
        phone,
        address,
        time: timeRadio.value,
        payment,
      };

      const currentCount = getLoyaltyCount();
      const earnsFreeShipping = currentCount >= PURCHASES_FOR_FREE_SHIPPING;

      // sumar la compra: si esta venía con envío gratis, el contador se reinicia;
      // si no, suma 1 hacia el próximo envío gratis.
      const newCount = earnsFreeShipping ? 0 : currentCount + 1;
      setLoyaltyCount(newCount);
      renderLoyalty();

      const message = buildWhatsAppOrderMessage(earnsFreeShipping, customerData);
      const waUrl = 'https://wa.me/5491168554861?text=' + encodeURIComponent(message);
      window.open(waUrl, '_blank', 'noopener');

      closeCheckoutModal();
      checkoutForm.reset();
    });
  }

  // ===================== MODAL DE DETALLE DE PRODUCTO =====================
  const productOverlay = document.getElementById('product-overlay');
  const productModal = document.getElementById('product-modal');
  const modalClose = document.getElementById('modal-close');
  const modalThumb = document.getElementById('modal-thumb');
  const modalBadge = document.getElementById('modal-badge');
  const modalName = document.getElementById('modal-product-name');
  const modalTag = document.getElementById('modal-tag');
  const modalDesc = document.getElementById('modal-desc');
  const modalPrice = document.getElementById('modal-price');
  const modalQtyValue = document.getElementById('modal-qty-value');
  const modalQtyDec = document.getElementById('modal-qty-dec');
  const modalQtyInc = document.getElementById('modal-qty-inc');
  const modalAddBtn = document.getElementById('modal-add-btn');

  let modalQty = 1;
  let activeCardData = null;

  function openProductModal(card) {
    activeCardData = getCardData(card);
    modalQty = 1;
    modalQtyValue.textContent = modalQty;

    const thumbClass = card.querySelector('.product-thumb').className
      .split(' ')
      .filter(c => c !== 'product-thumb')
      .join(' ');
    modalThumb.className = 'modal-thumb ' + thumbClass;

    const badge = card.querySelector('.product-badge');
    if (badge) {
      modalBadge.textContent = badge.textContent;
      modalBadge.hidden = false;
    } else {
      modalBadge.hidden = true;
    }

    modalName.textContent = activeCardData.name;
    modalTag.textContent = activeCardData.tag;
    modalDesc.textContent = card.dataset.desc || '';
    modalPrice.textContent = formatPrice(activeCardData.price);

    modalAddBtn.textContent = 'Agregar al carrito';
    modalAddBtn.classList.remove('is-confirmed');

    productModal.classList.add('is-open');
    productOverlay.hidden = false;
    requestAnimationFrame(() => productOverlay.classList.add('is-open'));
    productModal.setAttribute('aria-hidden', 'false');
  }

  function closeProductModal() {
    productModal.classList.remove('is-open');
    productOverlay.classList.remove('is-open');
    productModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { productOverlay.hidden = true; }, 250);
  }

  modalClose.addEventListener('click', closeProductModal);
  productOverlay.addEventListener('click', closeProductModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });

  modalQtyDec.addEventListener('click', () => {
    if (modalQty <= 1) return;
    modalQty -= 1;
    modalQtyValue.textContent = modalQty;
  });
  modalQtyInc.addEventListener('click', () => {
    modalQty += 1;
    modalQtyValue.textContent = modalQty;
  });

  modalAddBtn.addEventListener('click', () => {
    if (!activeCardData) return;
    addToCart({ ...activeCardData, qty: modalQty });

    modalAddBtn.textContent = 'Agregado ✓';
    modalAddBtn.classList.add('is-confirmed');
    setTimeout(() => {
      modalAddBtn.textContent = 'Agregar al carrito';
      modalAddBtn.classList.remove('is-confirmed');
    }, 1100);
  });

  cards.forEach(card => {
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Ver detalle de ' + card.querySelector('.product-name').textContent.trim());

    card.addEventListener('click', () => openProductModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProductModal(card);
      }
    });
  });

  function getCheckedLabels(groupHeading) {
    const group = Array.from(document.querySelectorAll('.filter-group')).find(
      g => g.querySelector('.filter-heading').textContent.trim() === groupHeading
    );
    if (!group) return [];
    return Array.from(group.querySelectorAll('input:checked')).map(
      input => input.nextElementSibling.textContent.trim().toLowerCase()
    );
  }

  function applyFilters() {
    const shapes = getCheckedLabels('Forma');
    const sizes = getCheckedLabels('Tamaño');

    let visibleCount = 0;

    cards.forEach(card => {
      const tagText = card.querySelector('.product-tag').textContent.toLowerCase();

      const matchesShape = shapes.some(shape => tagText.includes(shape.split(' ')[0]));
      const matchesSize = sizes.some(size => tagText.includes(size.split(' ')[0]));

      const visible = matchesShape && matchesSize;
      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });

    resultCount.textContent = visibleCount;
  }

  checkboxes.forEach(cb => cb.addEventListener('change', applyFilters));

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      checkboxes.forEach(cb => (cb.checked = true));
      applyFilters();
    });
  }

  applyFilters();

  // ===================== CARTAS (TAROT) =====================
  const cartaCards = Array.from(document.querySelectorAll('.carta-card'));

  cartaCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const name = card.querySelector('.carta-name').textContent.trim();
    const price = parsePrice(card.querySelector('.carta-price').textContent.trim());
    card.setAttribute('aria-label', 'Agregar ' + name + ' al carrito');

    function addCartaToCart() {
      addToCart({ name, tag: 'Mazo de tarot', price, qty: 1 });

      card.classList.add('product-card--added');
      setTimeout(() => card.classList.remove('product-card--added'), 500);
    }

    card.addEventListener('click', addCartaToCart);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addCartaToCart();
      }
    });
  });

  // ===================== PACKS / PEDIDOS =====================
  const packCards = Array.from(document.querySelectorAll('.pack-card'));

  const packOverlay = document.getElementById('pack-overlay');
  const packModal = document.getElementById('pack-modal');
  const packModalClose = document.getElementById('pack-modal-close');
  const packModalBadge = document.getElementById('pack-modal-badge');
  const packModalTitle = document.getElementById('pack-modal-title');
  const packModalDesc = document.getElementById('pack-modal-desc');
  const packModalGrid = document.getElementById('pack-modal-grid');
  const packModalPrice = document.getElementById('pack-modal-price');
  const packModalAddBtn = document.getElementById('pack-modal-add-btn');

  let activePackData = null;

  // data-includes usa el formato:
  // "Nombre|claseThumb|Nombre|claseThumb||NombreCarta|claseCartaThumb"
  // el "||" separa el bloque de velas del bloque de cartas (clases que empiezan con carta-thumb)
  function parsePackIncludes(raw) {
    if (!raw) return [];
    const parts = raw.split('|').map(s => s.trim());
    const items = [];
    for (let i = 0; i < parts.length; i += 2) {
      const name = parts[i];
      const thumbClass = parts[i + 1];
      if (name && thumbClass) items.push({ name, thumbClass });
    }
    return items;
  }

  function openPackModal(card) {
    const name = card.querySelector('.pack-name').textContent.trim();
    const priceEl = card.querySelector('.pack-price');
    const priceText = priceEl.childNodes[0].textContent.trim();
    const price = parsePrice(priceText);

    activePackData = { name, tag: 'Pack', price, qty: 1 };

    const badge = card.querySelector('.pack-badge');
    if (badge) {
      packModalBadge.textContent = badge.textContent;
      packModalBadge.hidden = false;
    } else {
      packModalBadge.hidden = true;
    }

    packModalTitle.textContent = name;
    packModalDesc.textContent = card.dataset.desc || '';
    packModalPrice.textContent = formatPrice(price);

    const items = parsePackIncludes(card.dataset.includes);
    packModalGrid.innerHTML = '';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'pack-modal-item';
      el.innerHTML = `
        <div class="pack-modal-thumb ${item.thumbClass}"></div>
        <p class="pack-modal-item-name">${item.name}</p>
      `;
      packModalGrid.appendChild(el);
    });

    packModalAddBtn.textContent = 'Agregar al carrito';
    packModalAddBtn.classList.remove('is-confirmed');

    packModal.classList.add('is-open');
    packOverlay.hidden = false;
    requestAnimationFrame(() => packOverlay.classList.add('is-open'));
    packModal.setAttribute('aria-hidden', 'false');
  }

  function closePackModal() {
    packModal.classList.remove('is-open');
    packOverlay.classList.remove('is-open');
    packModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { packOverlay.hidden = true; }, 250);
  }

  if (packModalClose) packModalClose.addEventListener('click', closePackModal);
  if (packOverlay) packOverlay.addEventListener('click', closePackModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePackModal();
  });

  if (packModalAddBtn) {
    packModalAddBtn.addEventListener('click', () => {
      if (!activePackData) return;
      addToCart(activePackData);

      packModalAddBtn.textContent = 'Agregado ✓';
      packModalAddBtn.classList.add('is-confirmed');
      setTimeout(() => {
        packModalAddBtn.textContent = 'Agregar al carrito';
        packModalAddBtn.classList.remove('is-confirmed');
      }, 1100);
    });
  }

  packCards.forEach(card => {
    const btn = card.querySelector('.pack-cta');
    if (!btn) return;

    const isCustom = card.classList.contains('pack-card--custom');

    btn.addEventListener('click', () => {
      if (isCustom) {
        // sin precio fijo: lleva al contacto en vez de abrir el modal
        document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      openPackModal(card);
    });
  });

  // ===================== RESEÑAS =====================
  const STORAGE_KEY = 'messina_reviews';

  const sampleReviews = [
    { name: 'Marina G.', rating: 5, text: 'La vela Memento es impresionante en persona, mucho más detallada que en la foto. Llegó perfecta.', date: '2026-05-12' },
    { name: 'Tomás R.', rating: 5, text: 'Pedí el Pack Inicio para regalar y quedaron todos encantados. El mazo Rider-Waite es de muy buena calidad.', date: '2026-04-28' },
    { name: 'Florencia A.', rating: 4, text: 'Hermosa la Luna Vieja, arde parejo y el aroma es sutil, no empalaga. Le bajo una estrella solo por la demora del envío.', date: '2026-04-03' },
  ];

  function loadStoredReviews() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveStoredReviews(reviews) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // si localStorage no está disponible (modo privado, etc.) seguimos sin persistir
    }
  }

  function starsMarkup(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="${i <= rating ? 'star-filled' : 'star-empty'}">★</span>`;
    }
    return html;
  }

  function formatReviewDate(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d)) return '';
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const reviewsListEl = document.getElementById('reviews-list');
  const reviewsAvgEl = document.getElementById('reviews-avg');
  const reviewsAvgStarsEl = document.getElementById('reviews-avg-stars');
  const reviewsCountEl = document.getElementById('reviews-count');

  function renderReviews() {
    const stored = loadStoredReviews();
    const all = [...stored, ...sampleReviews].sort((a, b) => new Date(b.date) - new Date(a.date));

    reviewsListEl.innerHTML = '';

    all.forEach(r => {
      const card = document.createElement('article');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-card-head">
          <p class="review-name">${escapeHtml(r.name)}</p>
          <div class="review-stars">${starsMarkup(r.rating)}</div>
        </div>
        <p class="review-date">${formatReviewDate(r.date)}</p>
        <p class="review-text">${escapeHtml(r.text)}</p>
      `;
      reviewsListEl.appendChild(card);
    });

    const avg = all.length ? all.reduce((sum, r) => sum + r.rating, 0) / all.length : 5;
    reviewsAvgEl.textContent = avg.toFixed(1);
    reviewsAvgStarsEl.innerHTML = starsMarkup(Math.round(avg));
    reviewsCountEl.textContent = all.length + (all.length === 1 ? ' reseña' : ' reseñas');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  renderReviews();

  // selector de estrellas del formulario
  const starPicker = document.getElementById('star-picker');
  const starBtns = starPicker ? Array.from(starPicker.querySelectorAll('.star-btn')) : [];
  const ratingInput = document.getElementById('review-rating');

  function setStarRating(value) {
    ratingInput.value = value;
    starBtns.forEach(btn => {
      const active = Number(btn.dataset.value) <= value;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => setStarRating(Number(btn.dataset.value)));
  });

  // formulario de nueva reseña
  const reviewForm = document.getElementById('review-form');
  const reviewFormError = document.getElementById('review-form-error');

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('review-name').value.trim();
      const text = document.getElementById('review-text').value.trim();
      const rating = Number(ratingInput.value);

      if (!name || !text || !rating) {
        reviewFormError.hidden = false;
        return;
      }
      reviewFormError.hidden = true;

      const stored = loadStoredReviews();
      stored.push({
        name,
        rating,
        text,
        date: new Date().toISOString().slice(0, 10),
      });
      saveStoredReviews(stored);

      renderReviews();
      reviewForm.reset();
      setStarRating(0);
    });
  }
});