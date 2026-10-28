/**
 * Bank details shown on EFT orders. Replace the placeholders before taking real payments.
 * There is no card gateway: customers pay by EFT or when they collect in store.
 */
export const EFT_DETAILS = {
  accountName: 'Herbal Harbour',
  bank: 'Add your bank in src/lib/shopConfig.ts',
  accountNumber: '0000000000',
  branchCode: '000000',
  accountType: 'Current',
};

export const FREE_SHIPPING_THRESHOLD = 750;
export const STANDARD_DELIVERY_FEE = 95;
export const DEFAULT_LOW_STOCK = 5;

export const ORDER_STATUS_LABELS = {
  pending: 'Pending payment',
  paid: 'Paid',
  collected: 'Collected',
  cancelled: 'Cancelled',
} as const;

export const PAYMENT_LABELS = {
  eft: 'EFT (bank transfer)',
  pay_on_collection: 'Pay on collection',
} as const;
