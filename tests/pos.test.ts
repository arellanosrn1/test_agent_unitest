import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotal, calculateChange, calculateSubtotal, addToCart } from '../src/pos';
import { deductStock, INITIAL_PRODUCTS } from '../src/admin';
import { CartItem, Product } from '../src/types';

test('Caja POS - Cálculo correcto de Subtotal', () => {
  const dummyProd: Product = {
    id: 99,
    name: 'Producto Prueba',
    price: 50,
    category: 'alimentos',
    stock: 10,
    barcode: 'TST01'
  };
  const cart: CartItem[] = [{ product: dummyProd, quantity: 2 }];
  const subtotal = calculateSubtotal(cart);

  assert.equal(subtotal, 100, 'El subtotal de 2 productos de $50 debe ser $100');
});

test('Caja POS - Cálculo correcto del Total con descuento (FALLARÁ POR ERROR INTENCIONAL)', () => {
  const subtotal = 100;
  const tax = 16;
  const discount = 20;

  // Esperado: 100 + 16 - 20 = 96
  const total = calculateTotal(subtotal, tax, discount);

  assert.equal(total, 96, `El total con descuento debería ser 96, pero calculó ${total}`);
});

test('Caja POS - Cálculo del Cambio en Efectivo (FALLARÁ POR ERROR INTENCIONAL)', () => {
  const total = 150;
  const cashReceived = 200;

  // Esperado: 200 - 150 = 50
  const change = calculateChange(cashReceived, total);

  assert.equal(change, 50, `El cambio entregado debería ser 50, pero calculó ${change}`);
});

test('Administración - Descontar stock al vender (FALLARÁ POR ERROR INTENCIONAL)', () => {
  const prod = INITIAL_PRODUCTS[0]; // Café Americano stock inicial 24
  const initialStock = prod.stock;
  
  deductStock(prod.id, 2);

  // Esperado: initialStock - 2
  assert.equal(prod.stock, initialStock - 2, `El stock debió reducirse a ${initialStock - 2}, pero quedó en ${prod.stock}`);
});
