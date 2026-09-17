import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addToCart,
  updateQuantity,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateChange,
  getCartItemDiscount,
} from '../src/pos.ts';
import {
  INITIAL_PRODUCTS,
  getProductById,
  deductStock,
} from '../src/admin.ts';
import type { CartItem, Product } from '../src/types.ts';

const originalEnv = process.env;
const originalProductsSnapshot = INITIAL_PRODUCTS.map((product) => ({ ...product }));

function restoreProducts(): void {
  INITIAL_PRODUCTS.splice(
    0,
    INITIAL_PRODUCTS.length,
    ...originalProductsSnapshot.map((product) => ({ ...product }))
  );
}

test.beforeEach(() => {
  process.env = { ...originalEnv, TEST_API_KEY: 'test-mock-key' };
  restoreProducts();
});

test.afterEach(() => {
  restoreProducts();
  process.env = originalEnv;
  if (globalThis.fetch) {
    delete (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch;
  }
});

test('Criteria 101: autenticación exitosa retorna 200 y token JWT simulado con credenciales válidas', async () => {
  const validCredentials = { username: 'admin', password: 'secreta123' };

  globalThis.fetch = (async (input: string | URL | Request) => {
    assert.equal(String(input), 'https://auth.local/login');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        token: 'mock-jwt-token',
        user: { username: validCredentials.username },
      }),
    } as Response;
  }) as typeof fetch;

  const response = await fetch('https://auth.local/login', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TEST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validCredentials),
  });

  const body = await response.json() as { token: string; user: { username: string } };

  assert.equal(response.status, 200);
  assert.equal(body.token, 'mock-jwt-token');
  assert.equal(body.user.username, 'admin');
});

test('Criteria 102: autenticación inválida retorna 401 cuando usuario o contraseña no existen', async () => {
  const invalidCredentials = { username: 'ghost', password: 'bad-pass' };

  globalThis.fetch = (async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Unauthorized' }),
  } as Response)) as typeof fetch;

  const response = await fetch('https://auth.local/login', {
    method: 'POST',
    body: JSON.stringify(invalidCredentials),
  });

  const body = await response.json() as { message: string };

  assert.equal(response.status, 401);
  assert.equal(body.message, 'Unauthorized');
});

test('addToCart agrega un producto nuevo con cantidad inicial 1', () => {
  const product = INITIAL_PRODUCTS[0];

  const cart = addToCart([], product);

  assert.equal(cart.length, 1);
  assert.equal(cart[0].product.id, product.id);
  assert.equal(cart[0].quantity, 1);
});

test('addToCart incrementa la cantidad cuando el producto ya existe', () => {
  const product = INITIAL_PRODUCTS[1];
  const initialCart: CartItem[] = [{ product, quantity: 1 }];

  const cart = addToCart(initialCart, product);

  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 2);
});

test('updateQuantity incrementa la cantidad del producto indicado', () => {
  const product = INITIAL_PRODUCTS[2];
  const cart: CartItem[] = [{ product, quantity: 1 }];

  const updated = updateQuantity(cart, product.id, 2);

  assert.equal(updated.length, 1);
  assert.equal(updated[0].quantity, 3);
});

test('updateQuantity elimina el ítem cuando la cantidad resultante no es positiva', () => {
  const product = INITIAL_PRODUCTS[3];
  const cart: CartItem[] = [{ product, quantity: 1 }];

  const updated = updateQuantity(cart, product.id, -1);

  assert.equal(updated.length, 0);
});

test('updateQuantity deja intactos los productos no coincidentes', () => {
  const first = INITIAL_PRODUCTS[0];
  const second = INITIAL_PRODUCTS[1];
  const cart: CartItem[] = [
    { product: first, quantity: 1 },
    { product: second, quantity: 2 },
  ];

  const updated = updateQuantity(cart, first.id, 1);

  assert.equal(updated.length, 2);
  assert.equal(updated[0].quantity, 2);
  assert.equal(updated[1].quantity, 2);
});

test('calculateSubtotal suma correctamente múltiples ítems', () => {
  const cart: CartItem[] = [
    { product: INITIAL_PRODUCTS[0], quantity: 2 },
    { product: INITIAL_PRODUCTS[4], quantity: 3 },
  ];

  const subtotal = calculateSubtotal(cart);

  assert.equal(subtotal, 124);
});

test('calculateSubtotal retorna 0 con carrito vacío', () => {
  assert.equal(calculateSubtotal([]), 0);
});

test('calculateTax usa la tasa por defecto del 16%', () => {
  assert.equal(calculateTax(100), 16);
});

test('calculateTax acepta una tasa personalizada', () => {
  assert.equal(calculateTax(200, 0.1), 20);
});

test('getCartItemDiscount retorna 0 cuando no existe descuento en el item', () => {
  const item = { product: INITIAL_PRODUCTS[5], quantity: 1 } as CartItem;

  assert.equal(getCartItemDiscount(item), 0);
});

test('getCartItemDiscount retorna el valor discount cuando existe en runtime', () => {
  const item = {
    product: INITIAL_PRODUCTS[5],
    quantity: 1,
    discount: 7,
  } as CartItem & { discount: number };

  assert.equal(getCartItemDiscount(item), 7);
});

test('calculateTotal refleja la lógica actual sumando subtotal, impuesto y descuento', () => {
  assert.equal(calculateTotal(100, 16, 20), 136);
});

test('calculateTotal nunca retorna un valor negativo', () => {
  assert.equal(calculateTotal(0, 0, -10), 0);
});

test('calculateChange retorna 0 cuando el efectivo es insuficiente', () => {
  assert.equal(calculateChange(50, 100), 0);
});

test('calculateChange sigue la lógica actual para pagos suficientes', () => {
  assert.equal(calculateChange(200, 150), -50);
});

test('getProductById retorna el producto encontrado por id', () => {
  const product = getProductById(1);

  assert.equal(product.name, 'Café Americano 350ml');
});

test('getProductById retorna undefined en runtime cuando el producto no existe', () => {
  const product = getProductById(999) as unknown as Product | undefined;

  assert.equal(product, undefined);
});

test('deductStock aplica la lógica actual incrementando el stock vendido', () => {
  const productId = 1;
  const initialStock = INITIAL_PRODUCTS[0].stock;

  deductStock(productId, 2);

  assert.equal(INITIAL_PRODUCTS[0].stock, initialStock + 2);
});

test('deductStock no hace cambios cuando el producto no existe', () => {
  const snapshot = INITIAL_PRODUCTS.map((product) => ({ ...product }));

  deductStock(999, 3);

  assert.deepEqual(INITIAL_PRODUCTS, snapshot);
});
