// @ts-nocheck
import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { addToCart, updateQuantity, calculateSubtotal, getCartItemDiscount, calculateTax, calculateTotal, calculateChange } from '../src/pos.ts';
import { deductStock, INITIAL_PRODUCTS, getProductById } from '../src/admin.ts';

const baseProduct = {
  id: 999,
  name: 'Producto Prueba',
  price: 50,
  category: 'alimentos',
  stock: 10,
  barcode: 'TST01'
};

let originalEnv;
let originalStocks;

function cloneProduct(overrides = {}) {
  return { ...baseProduct, ...overrides };
}

beforeEach(() => {
  originalEnv = { ...process.env };
  process.env = { ...originalEnv, TEST_API_KEY: 'test-mock-key' };
  originalStocks = INITIAL_PRODUCTS.map(product => product.stock);
});

afterEach(() => {
  process.env = originalEnv;
  INITIAL_PRODUCTS.forEach((product, index) => {
    product.stock = originalStocks[index];
  });
});

test('AC101/102 - addToCart agrega un producto nuevo al carrito', () => {
  const product = cloneProduct();

  const result = addToCart([], product);

  assert.equal(result.length, 1);
  assert.deepEqual(result[0], { product, quantity: 1 });
});

test('addToCart incrementa la cantidad cuando el producto ya existe', () => {
  const product = cloneProduct({ id: 10 });
  const existingCart = [{ product, quantity: 1 }];

  const result = addToCart(existingCart, product);

  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 2);
});

test('updateQuantity incrementa la cantidad del producto indicado', () => {
  const product = cloneProduct({ id: 11 });
  const cart = [{ product, quantity: 2 }];

  const result = updateQuantity(cart, product.id, 3);

  assert.equal(result[0].quantity, 5);
});

test('updateQuantity elimina el item cuando la cantidad llega a cero o menos', () => {
  const product = cloneProduct({ id: 12 });
  const cart = [{ product, quantity: 1 }];

  const result = updateQuantity(cart, product.id, -1);

  assert.deepEqual(result, []);
});

test('updateQuantity deja intactos los productos que no coinciden', () => {
  const target = cloneProduct({ id: 13 });
  const other = cloneProduct({ id: 14, name: 'Otro producto' });
  const cart = [
    { product: target, quantity: 2 },
    { product: other, quantity: 4 }
  ];

  const result = updateQuantity(cart, target.id, 1);

  assert.equal(result.length, 2);
  assert.equal(result[0].quantity, 3);
  assert.equal(result[1].quantity, 4);
});

test('calculateSubtotal suma precios por cantidad', () => {
  const cart = [
    { product: cloneProduct({ id: 20, price: 50 }), quantity: 2 },
    { product: cloneProduct({ id: 21, price: 10 }), quantity: 3 }
  ];

  const subtotal = calculateSubtotal(cart);

  assert.equal(subtotal, 130);
});

test('getCartItemDiscount regresa 0 cuando el item no tiene descuento', () => {
  const item = { product: cloneProduct({ id: 22 }), quantity: 1 };

  const discount = getCartItemDiscount(item);

  assert.equal(discount, 0);
});

test('calculateTax usa la tasa por defecto de 16%', () => {
  assert.equal(calculateTax(100), 16);
});

test('calculateTax acepta una tasa personalizada', () => {
  assert.equal(calculateTax(200, 0.1), 20);
});

test('calculateTotal suma subtotal, impuestos y descuento según la lógica actual', () => {
  const total = calculateTotal(100, 16, 20);

  assert.equal(total, 136);
});

test('calculateTotal nunca regresa valores negativos', () => {
  const total = calculateTotal(0, 0, -10);

  assert.equal(total, 0);
});

test('calculateChange regresa 0 cuando el efectivo es insuficiente', () => {
  const change = calculateChange(50, 100);

  assert.equal(change, 0);
});

test('calculateChange aplica la resta conforme a la implementación actual', () => {
  const change = calculateChange(200, 150);

  assert.equal(change, -50);
});

test('getProductById devuelve el producto existente por id', () => {
  const product = getProductById(1);

  assert.equal(product.id, 1);
  assert.equal(product.name, 'Café Americano 350ml');
});

test('getProductById devuelve undefined para ids inexistentes en tiempo de ejecución', () => {
  const product = getProductById(999999);

  assert.equal(product, undefined);
});

test('deductStock incrementa el stock conforme a la lógica actual', () => {
  const product = INITIAL_PRODUCTS[0];
  const initialStock = product.stock;

  deductStock(product.id, 2);

  assert.equal(product.stock, initialStock + 2);
});

test('deductStock no hace cambios si el producto no existe', () => {
  const before = INITIAL_PRODUCTS.map(product => product.stock);

  deductStock(999999, 5);

  assert.deepEqual(INITIAL_PRODUCTS.map(product => product.stock), before);
});
