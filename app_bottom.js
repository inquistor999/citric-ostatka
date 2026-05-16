const productListEl = document.getElementById('product-list');
const searchInput = document.getElementById('product-search');
const summaryPanel = document.getElementById('summary-panel');
const summaryHeaderToggle = document.getElementById('summary-header-toggle');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartList = document.getElementById('cart-list');
const selectedCountEl = document.getElementById('selected-count');
const exportBtn = document.getElementById('export-btn');
const modal = document.getElementById('input-modal');
const modalOverlay = modal.querySelector('.modal-overlay');
const modalProductName = document.getElementById('modal-product-name');
const qtyInput = document.getElementById('stock-qty');
const commentInput = document.getElementById('stock-comment');
const saveBtn = document.getElementById('save-stock');
const removeBtn = document.getElementById('remove-stock');
const closeModalBtn = document.getElementById('close-modal');

let currentProduct = null;

// Get Telegram User ID if available
let CHAT_ID = null;
if (window.Telegram && window.Telegram.WebApp) {
  const webApp = window.Telegram.WebApp;
  webApp.ready();
  webApp.expand();
  if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
    CHAT_ID = webApp.initDataUnsafe.user.id;
  }
}

// ---- 4. Render product cards ----
function renderProducts(filter = '') {
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  productListEl.innerHTML = '';
  if (filtered.length === 0) {
    productListEl.innerHTML = '<p class="loader">Hech narsa topilmadi</p>';
    return;
  }

  // Optimize rendering for large lists
  const fragment = document.createDocumentFragment();
  const maxRender = Math.min(filtered.length, 100);

  for (let i = 0; i < maxRender; i++) {
    const product = filtered[i];
    const existing = selectedItems.find(it => it.id === product.id);
    const hasData = !!existing;
    
    const card = document.createElement('div');
    card.className = `product-card ${hasData ? 'has-data' : ''}`;
    card.dataset.id = product.id;
    card.innerHTML = `
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-meta">
           <span class="tag">${product.unit}</span>
        </div>
      </div>
      <div class="stock-indicator">
        <span class="stock-value">${hasData ? existing.quantity : ''}</span>
        <span class="stock-label">${hasData ? 'Savatda' : ''}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(product));
    fragment.appendChild(card);
  }

  productListEl.appendChild(fragment);

  if (filtered.length > 100) {
     const moreEl = document.createElement('p');
     moreEl.className = 'loader';
     moreEl.textContent = `Yana ${filtered.length - 100} ta mahsulot bor. Qidiruvdan foydalaning.`;
     productListEl.appendChild(moreEl);
  }

  const countSpan = document.getElementById('product-count');
  if (countSpan) countSpan.textContent = `${filtered.length} ta`;
}

// ---- 5. Search handler ----
let searchTimeout;
searchInput.addEventListener('input', e => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    renderProducts(e.target.value);
  }, 300); // debounce
});

// ---- 6. Modal handling ----
function openModal(product) {
  currentProduct = product;
  modalProductName.textContent = product.name;
  
  const existing = selectedItems.find(it => it.id === product.id);
  qtyInput.value = existing ? existing.quantity : '';
  commentInput.value = existing ? existing.comment : '';
  
  if (existing) {
    removeBtn.classList.remove('hidden');
    saveBtn.textContent = "O'zgarishlarni saqlash";
  } else {
    removeBtn.classList.add('hidden');
    saveBtn.textContent = "Saqlash va Savatga qo'shish";
  }
  
  modal.classList.remove('hidden');
  setTimeout(() => qtyInput.focus(), 100);
}

function closeModal() {
  modal.classList.add('hidden');
  currentProduct = null;
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

saveBtn.addEventListener('click', () => {
  const qty = parseFloat(qtyInput.value);
  if (isNaN(qty) || qty < 0) {
    alert("Iltimos, miqdorni to'g'ri kiriting");
    return;
  }
  const comment = commentInput.value.trim();

  const index = selectedItems.findIndex(it => it.id === currentProduct.id);
  const entry = {
    id: currentProduct.id,
    name: currentProduct.name,
    quantity: qty,
    comment: comment
  };
  if (index >= 0) selectedItems.splice(index, 1, entry);
  else selectedItems.push(entry);

  updateSummary();
  renderProducts(searchInput.value);
  closeModal();
});

removeBtn.addEventListener('click', () => {
  const index = selectedItems.findIndex(it => it.id === currentProduct.id);
  if (index >= 0) {
    selectedItems.splice(index, 1);
  }
  updateSummary();
  renderProducts(searchInput.value);
  closeModal();
});

// ---- 7. Cart / Summary handling ----
summaryHeaderToggle.addEventListener('click', () => {
  if (selectedItems.length === 0) return;
  summaryPanel.classList.toggle('expanded');
  cartItemsContainer.classList.toggle('hidden');
});

function updateSummary() {
  selectedCountEl.textContent = selectedItems.length;
  
  if (selectedItems.length > 0) {
    summaryPanel.classList.remove('hidden');
  } else {
    summaryPanel.classList.add('hidden');
    summaryPanel.classList.remove('expanded');
    cartItemsContainer.classList.add('hidden');
  }

  // Render cart items
  cartList.innerHTML = '';
  selectedItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
      </div>
      <div class="cart-item-qty">${item.quantity} kg</div>
    `;
    // Click to edit from cart
    el.addEventListener('click', () => {
      const prod = PRODUCTS.find(p => p.id === item.id);
      if(prod) openModal(prod);
    });
    cartList.appendChild(el);
  });
}

// ---- 8. Export to Excel ----
exportBtn.addEventListener('click', async () => {
  if (!CHAT_ID) {
    alert('Telegram chat ID aniqlanmadi. Iltimos botni Telegram ichida oching.');
    // return; 
  }
  
  const exportBtnOriginalText = exportBtn.innerHTML;
  exportBtn.innerHTML = 'Yuborilmoqda...';
  exportBtn.disabled = true;
  
  try {
    const response = await fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID || 123456789, items: selectedItems }),
    });
    const data = await response.json();
    if (response.ok) {
      alert('Excel fayli Telegram orqali yuborildi');
      selectedItems = [];
      renderProducts(searchInput.value);
      updateSummary();
    } else {
      console.error('Export error:', data);
      alert('Excel yuborishda xatolik yuz berdi. Backend bilan aloqa yo\'q bo\'lishi mumkin.');
    }
  } catch (e) {
    console.error(e);
    alert('Server bilan aloqa muammosi. Iltimos backend hostlingizni tekshiring.');
  } finally {
    exportBtn.innerHTML = exportBtnOriginalText;
    exportBtn.disabled = false;
  }
});

// ---- 9. Initial render ----
renderProducts();
updateSummary();
