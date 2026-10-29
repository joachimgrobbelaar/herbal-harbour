import type { Product, ShopOrder, StockMovement } from '../types';

function stamp(date: Date | null): string {
  return date ? date.toISOString() : '';
}

/** Downloads an .xlsx workbook of the current catalogue, orders, and stock movements. */
export async function downloadShopWorkbook(
  products: Product[],
  orders: ShopOrder[],
  movements: StockMovement[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const book = XLSX.utils.book_new();
  const productRows = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    strainType: product.strainType,
    price: product.price,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    inStock: product.inStock,
    active: product.active,
    thc: product.thc,
    cbd: product.cbd,
    batchNumber: product.batchNumber,
  }));
  const orderRows = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: stamp(order.createdAt),
    channel: order.channel,
    status: order.status,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    creditApplied: order.creditApplied ?? 0,
    total: order.total,
    items: order.items.map((item) => `${item.quantity}x ${item.name}`).join('; '),
  }));
  const movementRows = movements.map((movement) => ({
    id: movement.id,
    createdAt: stamp(movement.createdAt),
    productId: movement.productId,
    productName: movement.productName,
    delta: movement.delta,
    stockAfter: movement.stockAfter,
    reason: movement.reason,
    channel: movement.channel,
    orderId: movement.orderId || '',
    userId: movement.userId,
  }));
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(productRows), 'Products');
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(orderRows), 'Orders');
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(movementRows), 'StockMovements');
  const day = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `herbal-harbour-${day}.xlsx`);
}
