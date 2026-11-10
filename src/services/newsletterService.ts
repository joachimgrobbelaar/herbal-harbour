/**
 * Herbal Harbour Dispensary VIP Club & Mailing List Service
 * Handles POPIA-compliant newsletter signups, storage, and export.
 */

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  interest: string;
  subscribedAt: string;
  vipCode: string;
  status: 'active' | 'unsubscribed';
}

const STORAGE_KEY = 'herbal_harbour_newsletter_subscribers';
export const DEFAULT_VIP_COUPON = 'VIPHARBOUR';

export function getStoredSubscribers(): NewsletterSubscriber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore private mode */
  }
  return [];
}

export function saveSubscribers(list: NewsletterSubscriber[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function subscribeToNewsletter(
  email: string,
  interest: string = 'General Medical Cannabis & Genetics'
): Promise<{ success: boolean; isNew: boolean; subscriber: NewsletterSubscriber }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const existingList = getStoredSubscribers();
  const existing = existingList.find((s) => s.email === cleanEmail);

  if (existing) {
    return {
      success: true,
      isNew: false,
      subscriber: existing,
    };
  }

  const newSubscriber: NewsletterSubscriber = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    source: 'web_footer_club',
    interest,
    subscribedAt: new Date().toISOString(),
    vipCode: DEFAULT_VIP_COUPON,
    status: 'active',
  };

  const updatedList = [newSubscriber, ...existingList];
  saveSubscribers(updatedList);

  return {
    success: true,
    isNew: true,
    subscriber: newSubscriber,
  };
}

/**
 * Exports subscribers to CSV for direct import into Mailchimp, Brevo, or Google Sheets.
 */
export function exportSubscribersToCsv(): string {
  const subs = getStoredSubscribers();
  const headers = ['Email', 'Subscribed Date', 'Interest Category', 'VIP Coupon Code', 'Status'];
  const rows = subs.map((s) => [
    s.email,
    new Date(s.subscribedAt).toLocaleDateString('en-ZA'),
    `"${s.interest.replace(/"/g, '""')}"`,
    s.vipCode,
    s.status,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
