import { INITIAL_PRODUCTS, deductStock } from './admin';
import {
  addToCart,
  updateQuantity,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateChange,
  getCartItemDiscount
} from './pos';
import { CartItem, Product, PaymentMethod } from './types';

// Estado local de la Caja y Administración
let cart: CartItem[] = [];
let currentCategory = 'all';
let searchQuery = '';

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid') as HTMLDivElement;
const cartList = document.getElementById('cartList') as HTMLUListElement;
const emptyCartMsg = document.getElementById('emptyCartMsg') as HTMLDivElement;
const txtSubtotal = document.getElementById('txtSubtotal') as HTMLElement;
const txtTax = document.getElementById('txtTax') as HTMLElement;
const txtTotal = document.getElementById('txtTotal') as HTMLElement;
const txtChange = document.getElementById('txtChange') as HTMLElement;
const inputDiscount = document.getElementById('inputDiscount') as HTMLInputElement;
const inputCashReceived = document.getElementById('inputCashReceived') as HTMLInputElement;
const selectPaymentMethod = document.getElementById('selectPaymentMethod') as HTMLSelectElement;
const paymentForm = document.getElementById('paymentForm') as HTMLFormElement;
const btnClearCart = document.getElementById('btnClearCart') as HTMLButtonElement;
const productSearch = document.getElementById('productSearch') as HTMLInputElement;
const filterButtons = document.querySelectorAll('.filter-btn');
const ticketModal = document.getElementById('ticketModal') as HTMLDivElement;
const ticketReceipt = document.getElementById('ticketReceipt') as HTMLDivElement;
const btnCloseModal = document.getElementById('btnCloseModal') as HTMLButtonElement;

// Renderizar Productos en el Catálogo
function renderProducts(): void {
  productsGrid.innerHTML = '';

  const filtered = INITIAL_PRODUCTS.filter(prod => {
    const matchesCat = currentCategory === 'all' || prod.category === currentCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No se encontraron productos.</p>`;
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div>
        <span class="prod-category">${product.category}</span>
        <h3 class="prod-title">${product.name}</h3>
      </div>
      <div class="prod-bottom">
        <span class="prod-price">$${product.price.toFixed(2)}</span>
        <span class="prod-stock">Stock: ${product.stock}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      cart = addToCart(cart, product);
      renderCart();
      updateTotals();
    });

    productsGrid.appendChild(card);
  });
}

// Renderizar Carrito de la Caja
function renderCart(): void {
  cartList.innerHTML = '';

  if (cart.length === 0) {
    emptyCartMsg.style.display = 'block';
    return;
  }

  emptyCartMsg.style.display = 'none';

  cart.forEach(item => {
    const li = document.createElement('li');
    li.className = 'cart-item';

    // Intento de uso de función con error intencional de TS
    const discount = getCartItemDiscount(item);

    li.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-name">${item.product.name}</span>
        <span class="cart-item-sub">$${item.product.price.toFixed(2)} c/u | Desc: $${discount}</span>
      </div>
      <div class="cart-item-actions">
        <button class="btn-qty btn-minus" data-id="${item.product.id}">-</button>
        <span>${item.quantity}</span>
        <button class="btn-qty btn-plus" data-id="${item.product.id}">+</button>
      </div>
    `;

    // Eventos de botones + y -
    li.querySelector('.btn-minus')?.addEventListener('click', (e) => {
      e.stopPropagation();
      cart = updateQuantity(cart, item.product.id, -1);
      renderCart();
      updateTotals();
    });

    li.querySelector('.btn-plus')?.addEventListener('click', (e) => {
      e.stopPropagation();
      cart = updateQuantity(cart, item.product.id, 1);
      renderCart();
      updateTotals();
    });

    cartList.appendChild(li);
  });
}

// Actualizar Totales Financieros de la Caja
function updateTotals(): void {
  const subtotal = calculateSubtotal(cart);
  const tax = calculateTax(subtotal);

  /**
   * ERROR INTENCIONAL 6 (TypeScript Type Mismatch):
   * Se asigna el valor directo del input (que es 'string') como argumento de descuento,
   * provocando un error en tsc:
   * Argument of type 'string' is not assignable to parameter of type 'number'.
   */
  const rawDiscount = inputDiscount.value; // Tipo string
  const total = calculateTotal(subtotal, tax, rawDiscount);

  txtSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  txtTax.textContent = `$${tax.toFixed(2)}`;
  txtTotal.textContent = `$${Number(total).toFixed(2)}`;

  updateChangeDisplay(Number(total));
}

// Calcular y mostrar el cambio a devolver
function updateChangeDisplay(total: number): void {
  const cashReceived = parseFloat(inputCashReceived.value) || 0;
  const change = calculateChange(cashReceived, total);

  // Muestra el cambio (el cual saldrá negativo o erróneo debido al error en pos.ts)
  txtChange.textContent = `$${change.toFixed(2)}`;
}

// Event Listeners
inputDiscount.addEventListener('input', () => updateTotals());
inputCashReceived.addEventListener('input', () => {
  const subtotal = calculateSubtotal(cart);
  const tax = calculateTax(subtotal);
  const discount = parseFloat(inputDiscount.value) || 0;
  const total = calculateTotal(subtotal, tax, discount);
  updateChangeDisplay(total);
});

btnClearCart.addEventListener('click', () => {
  cart = [];
  renderCart();
  updateTotals();
});

productSearch.addEventListener('input', (e) => {
  searchQuery = (e.target as HTMLInputElement).value;
  renderProducts();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.getAttribute('data-category') || 'all';
    renderProducts();
  });
});

// Procesamiento de Cobro
paymentForm.addEventListener('submit', (e) => {
  // ERROR INTENCIONAL 7:
  // Se omite intencionalmente e.preventDefault() en algunas pruebas,
  // pero para evitar que recargue la página si se prueba en vivo, lo incluimos
  // y en su lugar generamos el error en el stock y el recibo.
  e.preventDefault();

  if (cart.length === 0) {
    alert('La caja está vacía. Selecciona productos para cobrar.');
    return;
  }

  const subtotal = calculateSubtotal(cart);
  const tax = calculateTax(subtotal);
  const discount = parseFloat(inputDiscount.value) || 0;
  const total = calculateTotal(subtotal, tax, discount);
  const paymentMethod = selectPaymentMethod.value as PaymentMethod;
  const cashReceived = parseFloat(inputCashReceived.value) || 0;

  if (paymentMethod === 'cash' && cashReceived < total) {
    alert(`El efectivo recibido ($${cashReceived.toFixed(2)}) es menor al total ($${total.toFixed(2)}).`);
    return;
  }

  // Deducción de Stock (dispara el error lógico donde el stock aumenta)
  cart.forEach(item => {
    deductStock(item.product.id, item.quantity);
  });

  const change = calculateChange(cashReceived, total);

  // Mostrar Ticket
  ticketReceipt.innerHTML = `
    <h3>*** NOVASTORE RETAIL ***</h3>
    <p>Ticket de Venta #TK-${Math.floor(1000 + Math.random() * 9000)}</p>
    <p>Fecha: ${new Date().toLocaleString()}</p>
    <div class="ticket-divider"></div>
    ${cart.map(item => `
      <p>${item.quantity}x ${item.product.name} - $${(item.product.price * item.quantity).toFixed(2)}</p>
    `).join('')}
    <div class="ticket-divider"></div>
    <p>Subtotal: $${subtotal.toFixed(2)}</p>
    <p>IVA (16%): $${tax.toFixed(2)}</p>
    <p>Descuento aplicado: $${discount.toFixed(2)}</p>
    <p><strong>TOTAL COBRADO: $${total.toFixed(2)}</strong></p>
    <p>Método de pago: ${paymentMethod.toUpperCase()}</p>
    ${paymentMethod === 'cash' ? `
      <p>Efectivo Recibido: $${cashReceived.toFixed(2)}</p>
      <p>Cambio devuelto: $${change.toFixed(2)}</p>
    ` : ''}
    <div class="ticket-divider"></div>
    <p style="text-align:center;">¡Gracias por su compra!</p>
  `;

  ticketModal.classList.remove('hidden');

  // Limpiar carrito tras cobro y refrescar inventario en pantalla
  cart = [];
  inputCashReceived.value = '';
  renderCart();
  updateTotals();
  renderProducts(); // Mostrará el stock aumentado por el bug
});

btnCloseModal.addEventListener('click', () => {
  ticketModal.classList.add('hidden');
});

// Inicialización
renderProducts();
renderCart();
updateTotals();
