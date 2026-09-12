import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Café Americano 350ml', price: 35.00, category: 'bebidas', stock: 24, barcode: 'BEB001' },
  { id: 2, name: 'Refresco Cola 600ml', price: 22.50, category: 'bebidas', stock: 15, barcode: 'BEB002' },
  { id: 3, name: 'Agua Purificada 1L', price: 15.00, category: 'bebidas', stock: 40, barcode: 'BEB003' },
  { id: 4, name: 'Sandwich Jamón & Queso', price: 55.00, category: 'alimentos', stock: 8, barcode: 'ALI001' },
  { id: 5, name: 'Galletas de Avena', price: 18.00, category: 'alimentos', stock: 3, barcode: 'ALI002' }, // Stock bajo
  { id: 6, name: 'Papas Fritas 150g', price: 28.00, category: 'alimentos', stock: 20, barcode: 'ALI003' },
  { id: 7, name: 'Detergente Multiusos 1L', price: 42.00, category: 'limpieza', stock: 10, barcode: 'LIM001' },
  { id: 8, name: 'Papel Higiénico 4 rollos', price: 36.50, category: 'limpieza', stock: 2, barcode: 'LIM002' }, // Stock bajo
  { id: 9, name: 'Cable USB-C Carga Rápida', price: 120.00, category: 'tecnologia', stock: 6, barcode: 'TEC001' },
  { id: 10, name: 'Audífonos In-Ear Básicos', price: 180.00, category: 'tecnologia', stock: 5, barcode: 'TEC002' }
];

/**
 * ERROR INTENCIONAL 1 (TypeScript Strict Null Check):
 * Retorna 'Product | undefined' pero la firma exige estrictamente 'Product'.
 * TypeScript en modo estricto generará:
 * Type 'Product | undefined' is not assignable to type 'Product'.
 */
export function getProductById(id: number): Product {
  return INITIAL_PRODUCTS.find(p => p.id === id);
}

/**
 * ERROR INTENCIONAL 2 (Lógica de Inventario):
 * Al vender un producto, el stock en lugar de reducirse (+/-) se suma,
 * provocando que el stock aumente tras cada cobro en la caja.
 */
export function deductStock(productId: number, quantitySold: number): void {
  const prod = INITIAL_PRODUCTS.find(p => p.id === productId);
  if (prod) {
    // ERROR: Debería ser prod.stock -= quantitySold;
    prod.stock += quantitySold;
  }
}
