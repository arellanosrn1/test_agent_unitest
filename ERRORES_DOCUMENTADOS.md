# Catálogo y Solucionario de Errores Intencionales

Este documento sirve como guía y clave de respuestas para las pruebas unitarias, análisis estático o evaluación de agentes/desarrolladores sobre el proyecto **NovaStore Admin & Caja POS**.

---

## 1. Errores de Compilación TypeScript (Estáticos)

Al ejecutar `npm run typecheck` o `npx tsc --noEmit`, TypeScript detectará los siguientes 3 errores:

### Error 1: Retorno Nulo en Búsqueda de Producto
- **Archivo:** `src/admin.ts`
- **Función:** `getProductById(id: number): Product`
- **Mensaje de TypeScript:**
  ```text
  Type 'Product | undefined' is not assignable to type 'Product'.
  ```
- **Causa:** `Array.prototype.find()` puede devolver `undefined` si el ID no existe en el catálogo, pero la firma declara estrictamente que siempre devuelve `Product`.
- **Solución sugerida:**
  ```typescript
  export function getProductById(id: number): Product | undefined {
    return INITIAL_PRODUCTS.find(p => p.id === id);
  }
  ```

### Error 2: Propiedad Inexistente en Tipo `CartItem`
- **Archivo:** `src/pos.ts`
- **Función:** `getCartItemDiscount(item: CartItem)`
- **Mensaje de TypeScript:**
  ```text
  Property 'discount' does not exist on type 'CartItem'.
  ```
- **Causa:** La interfaz `CartItem` en `src/types.ts` sólo contiene `product` y `quantity`. Se intentó acceder a `item.discount`.
- **Solución sugerida:**
  Agregar `discount?: number;` a la interfaz `CartItem` en `src/types.ts`, o manejar el descuento a nivel de producto/global.

### Error 3: Mismatch de Tipos (`string` a `number`) en Cálculo del Total
- **Archivo:** `src/main.ts`
- **Función:** `updateTotals()`
- **Mensaje de TypeScript:**
  ```text
  Argument of type 'string' is not assignable to parameter of type 'number'.
  ```
- **Causa:** Se pasa `inputDiscount.value` (que es de tipo `string`) directamente a `calculateTotal(subtotal, tax, discount)` cuya firma espera un `number`.
- **Solución sugerida:**
  ```typescript
  const rawDiscount = parseFloat(inputDiscount.value) || 0;
  const total = calculateTotal(subtotal, tax, rawDiscount);
  ```

---

## 2. Errores Lógicos y de Negocio (Tiempo de Ejecución)

Estos errores permiten que la aplicación compile (si se ignoran o corrigen los tipos) o se ejecute en Vite, pero provocan fallos en las pruebas unitarias y en la operación de la caja:

### Error 4: Descuento Sumado en Vez de Restado al Total
- **Archivo:** `src/pos.ts`
- **Función:** `calculateTotal(subtotal: number, tax: number, discount: number)`
- **Comportamiento Anómalo:**
  Si el subtotal es $100, IVA es $16 y se aplica un descuento de $20, el total debería ser:
  $$100 + 16 - 20 = \$96.00$$
  Sin embargo, el código ejecuta:
  ```typescript
  const total = subtotal + tax + discount; // Da $136.00
  ```
- **Solución sugerida:**
  ```typescript
  const total = subtotal + tax - discount;
  return Math.max(0, total);
  ```

### Error 5: Cálculo Invertido del Cambio en Efectivo
- **Archivo:** `src/pos.ts`
- **Función:** `calculateChange(cashReceived: number, total: number)`
- **Comportamiento Anómalo:**
  Si el total a pagar es $150 y el cliente entrega un billete de $200, la función calcula:
  $$\text{total} - \text{cashReceived} = 150 - 200 = -\$50.00$$
  Devuelve un valor negativo en vez del cambio real (\$50.00).
- **Solución sugerida:**
  ```typescript
  return cashReceived - total;
  ```

### Error 6: Incremento de Stock al Realizar una Venta
- **Archivo:** `src/admin.ts`
- **Función:** `deductStock(productId: number, quantitySold: number)`
- **Comportamiento Anómalo:**
  Al vender productos y presionar "Cobrar", el stock disponible en lugar de decrementar, aumenta:
  ```typescript
  prod.stock += quantitySold; // Provoca que el inventario aumente tras cada venta
  ```
- **Solución sugerida:**
  ```typescript
  prod.stock = Math.max(0, prod.stock - quantitySold);
  ```

---

## 3. Comandos Útiles para Pruebas

- **Comprobar Errores de Tipos con TypeScript:**
  ```bash
  npm run typecheck
  ```
- **Iniciar Servidor Local de Maqueta:**
  ```bash
  npm install
  npm run dev
  ```
