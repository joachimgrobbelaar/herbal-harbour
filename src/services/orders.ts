import type { CartItem, CheckoutDetails, OrderChannel, OrderStatus, PaymentMethod, ShopOrder } from '../types';
import { api, orderFromApi } from './api';

export interface PlaceSaleInput {
  channel: OrderChannel;
  status?: Extract<OrderStatus, 'pending' | 'paid' | 'collected'>;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  notes?: string;
  coupon?: string | null;
}

function lines(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
    selectedWeight: item.selectedWeight,
  }));
}

export async function placeSale(input: PlaceSaleInput): Promise<ShopOrder> {
  const path = input.channel === 'pos' ? '/admin/pos' : '/checkout';
  const order = await api<ShopOrder>(path, {
    body: {
      ...input,
      items: lines(input.items),
      coupon: input.coupon || undefined,
    },
  });
  return orderFromApi(order);
}

export function checkoutToSale(items: CartItem[], details: CheckoutDetails, coupon: string | null): PlaceSaleInput {
  return {
    channel: 'online',
    status: 'pending',
    paymentMethod: details.paymentMethod,
    items,
    customerName: details.customerName,
    email: details.email,
    phone: details.phone,
    address: details.address,
    city: details.city,
    postalCode: details.postalCode,
    province: details.province,
    notes: details.notes,
    coupon,
  };
}

export async function cancelOrder(orderId: string): Promise<void> {
  await api(`/orders/${orderId}/cancel`);
}

export async function markOrderStatus(orderId: string, status: 'paid' | 'collected' | 'cancelled'): Promise<void> {
  await api(`/admin/orders/${orderId}/status`, { body: { status } });
}

export async function fetchMyOrders(): Promise<ShopOrder[]> {
  const data = await api<{ orders: ShopOrder[] }>('/orders/mine');
  return data.orders.map(orderFromApi);
}

export async function fetchAdminOrders(): Promise<ShopOrder[]> {
  const data = await api<{ orders: ShopOrder[] }>('/admin/orders');
  return data.orders.map(orderFromApi);
}
