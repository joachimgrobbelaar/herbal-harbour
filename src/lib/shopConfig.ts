/**
 * Bank details shown on EFT orders. Replace the placeholders before taking real payments.
 * Customers pay by Instant EFT, Google Pay, Card, or when they collect in store.
 */
export const EFT_DETAILS = {
  accountName: 'Herbal Harbour Dispensary',
  bank: 'First National Bank (FNB)',
  accountNumber: '62849201938',
  branchCode: '250655',
  accountType: 'Cheque / Current',
};

export const FREE_SHIPPING_THRESHOLD = 750;
export const STANDARD_DELIVERY_FEE = 95;
export const DEFAULT_LOW_STOCK = 5;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending payment',
  paid: 'Paid',
  ready_for_pickup: 'Ready for Pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

export const PAYMENT_LABELS: Record<string, string> = {
  eft: 'EFT (bank transfer)',
  pay_on_collection: 'Pay on collection',
  google_pay: 'Google Pay (Instant Verification)',
  'instant-eft': 'Instant EFT (Capitec / FNB / Nedbank)',
  wallet: 'Patient Wallet (Google Pay balance)',
  'credit-card': 'Debit / Credit Card (Visa / Mastercard)',
  cod: 'Cash on Delivery / Pickup',
};
