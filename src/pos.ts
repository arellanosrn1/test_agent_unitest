import { CartItem, Product } from './types';

/**
 * Agrega un producto al carrito o incrementa la cantidad.
 */
export function addToCart(cart: CartItem[], product: Product): CartItem[] {
  const existing = cart.find(item => item.product.id === product.id);
  if (existing) {
    return cart.map(item =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }
  return [...cart, { product, quantity: 1 }];
}

/**
 * Reduce o incrementa la cantidad de un ítem.
 */
export function updateQuantity(cart: CartItem[], productId: number, delta: number): CartItem[] {
  return cart
    .map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    })
    .filter((item): item is CartItem => item !== null);
}

/**
 * Calcula el subtotal acumulado de los ítems en el carrito.
 */
export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
}

/**
 * ERROR INTENCIONAL 3 (TypeScript Compile Error):
 * Intenta acceder a una propiedad 'discount' que no existe en el tipo 'CartItem'.
 * TypeScript mostrará: Property 'discount' does not exist on type 'CartItem'.
 */
export function getCartItemDiscount(item: CartItem): number {
  return item.discount ?? 0;
}

/**
 * Calcula el impuesto (IVA). Por defecto 16% (0.16).
 */
export function calculateTax(subtotal: number, rate: number = 0.16): number {
  return subtotal * rate;
}

/**
 * ERROR INTENCIONAL 4 (Lógica de Cálculo del Total):
 * En lugar de restar el descuento, ¡lo suma al total a pagar!
 * Además, si el descuento viene como string de un input, puede causar concatenación indebida.
 */
export function calculateTotal(subtotal: number, tax: number, discount: number): number {
  // ERROR LÓGICO: Se suma el descuento (+ discount) en lugar de restarse (- discount)
  const total = subtotal + tax + discount;
  return Math.max(0, total);
}

/**
 * ERROR INTENCIONAL 5 (Lógica de Cálculo del Cambio):
 * Resta invertida: Total - Efectivo recibido, en lugar de Efectivo recibido - Total.
 * Ejemplo: Si el total es $150 y el cliente paga con $200, devuelve -$50 en vez de +$50.
 */
export function calculateChange(cashReceived: number, total: number): number {
  if (cashReceived < total) {
    return 0;
  }
  // ERROR LÓGICO: Debe ser (cashReceived - total)
  return total - cashReceived;
}
