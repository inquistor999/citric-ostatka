// app.js – Front‑end logic for Citric Ostatka Mini App
// ------------------------------------------------------------
// This script runs in the Telegram Web App. It provides:
//  • Searchable product list
//  • Modal for entering stock quantity and optional comment
//  • Tracking of selected items
//  • Export to Excel via backend endpoint
// ------------------------------------------------------------

// ---- 1. Initialise Telegram Web App ----
const tg = window.Telegram?.WebApp;
if (!tg) {
  console.error('Telegram Web App environment not detected');
}
// Telegram gives us the user ID which we will use as chat_id when sending a file
const CHAT_ID = tg?.initDataUnsafe?.user?.id || null;

// ---- 2. Sample product data (replace with real data source as needed) ----
const PRODUCTS = [
  { id: 1, name: 'Olma', unit: 'kg' },
  { id: 2, name: 'Banan', unit: 'kg' },
  { id: 3, name: 'Sabzi', unit: 'kg' },
  { id: 4, name: 'Pomidor', unit: 'kg' },
  { id: 5, name: 'Sariyog\u2019', unit: 'l' },
  { id: 6, name: 'Shakar', unit: 'kg' },
  { id: 7, name: 'Un', unit: 'kg' },
  { id: 8, name: 'Sut', unit: 'l' },
];

let selectedItems = [];

// ---- 3. DOM elements ----
const productListEl = document.getElementById('product-list');
const searchInput = document.getElementById('product-search');
const summaryPanel = document.getElementById('summary-panel');
const selectedCountEl = document.getElementById('selected-count');
const exportBtn = document.getElementById('export-btn');
const modal = document.getElementById('input-modal');
const modalOverlay = modal.querySelector('.modal-overlay');
const modalProductName = document.getElementById('modal-product-name');
const qtyInput = document.getElementById('stock-qty');
const commentInput = document.getElementById('stock-comment');
const saveBtn = document.getElementById('save-stock');
const closeModalBtn = document.getElementById('close-modal');

let currentProduct = null; // product currently being edited in modal

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

  filtered.forEach(product => {
    const hasData = selectedItems.some(it => it.id === product.id);
    const card = document.createElement('div');
    card.className = `product-card ${hasData ? 'has-data' : ''}`;
    card.dataset.id = product.id;
    card.innerHTML = `
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-meta">${product.unit}</div>
      </div>
      <div class="stock-indicator">
        <span class="stock-value">${hasData ? '✔' : ''}</span>
        <span class="stock-label">${hasData ? 'Kiritildi' : ''}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(product));
    productListEl.appendChild(card);
  });

  // Update product count header
  const countSpan = document.getElementById('product-count');
  if (countSpan) countSpan.textContent = `${filtered.length} ta`;
}

// ---- 5. Search handler ----
searchInput.addEventListener('input', e => {
  renderProducts(e.target.value);
});

// ---- 6. Modal handling ----
function openModal(product) {
  currentProduct = product;
  modalProductName.textContent = product.name;
  // Prefill if already exists
  const existing = selectedItems.find(it => it.id === product.id);
  qtyInput.value = existing ? existing.quantity : '';
  commentInput.value = existing ? existing.comment : '';
  modal.classList.remove('hidden');
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
    alert('Iltimos, miqdorni to\'g\'ri kiriting');
    return;
  }
  const comment = commentInput.value.trim();

  // Update or add entry
  const index = selectedItems.findIndex(it => it.id === currentProduct.id);
  const entry = {
    id: currentProduct.id,
    name: currentProduct.name,
    quantity: qty,
    comment,
  };
  if (index >= 0) selectedItems.splice(index, 1, entry);
  else selectedItems.push(entry);

  // UI updates
  updateSummary();
  renderProducts(searchInput.value);
  closeModal();
});

function updateSummary() {
  if (selectedItems.length > 0) {
    summaryPanel.classList.remove('hidden');
    selectedCountEl.textContent = selectedItems.length;
  } else {
    summaryPanel.classList.add('hidden');
  }
}

// ---- 7. Export to Excel ----
exportBtn.addEventListener('click', async () => {
  if (!CHAT_ID) {
    alert('Telegram chat ID aniqlanmadi. Iltimos botni Telegram ichida oching.');
    return;
  }
  try {
    const response = await fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, items: selectedItems }),
    });
    const data = await response.json();
    if (response.ok) {
      alert('Excel fayli Telegram orqali yuborildi');
      // Reset after successful export
      selectedItems = [];
      renderProducts(searchInput.value);
      updateSummary();
    } else {
      console.error('Export error:', data);
      alert('Excel yuborishda xatolik yuz berdi');
    }
  } catch (e) {
    console.error(e);
    alert('Server bilan aloqa muammosi');
  }
});

// ---- 8. Initial render ----
renderProducts();
updateSummary();
