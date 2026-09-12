export interface Product {
  id: number;
  name: string;
  price: number;
  category: 'bebidas' | 'alimentos' | 'limpieza' | 'tecnologia';
  stock: number;
  barcode: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  // NOTA: No existe la propiedad 'discount' aquí intencionalmente para pruebas
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface CheckoutResult {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  timestamp: string;
  items: CartItem[];
}
