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

  function addToCart(card) {
    const name = card.querySelector('.product-name').textContent.trim();
    const tag = card.querySelector('.product-tag').textContent.trim();
    const price = parsePrice(card.querySelector('.product-price').textContent.trim());

    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: nextId++, name, tag, price, qty: 1 });
    }

    updateCartBadge();
    renderCart();

    card.classList.add('product-card--added');
    setTimeout(() => card.classList.remove('product-card--added'), 500);
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

  cards.forEach(card => {
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Agregar al carrito');

    card.addEventListener('click', () => addToCart(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addToCart(card);
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
});