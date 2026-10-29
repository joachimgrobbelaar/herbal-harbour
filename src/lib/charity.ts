import { CharityInitiative, DonationRecord } from '../types';

export const SA_CHARITY_INITIATIVES: CharityInitiative[] = [
  {
    id: 'fynbos',
    name: 'SANParks Wildlife & Fynbos Conservation',
    category: 'Botanical & Ecological Habitat',
    description: 'Preserves the highly endangered Cape Floral Kingdom, restores biodiversity, and combats destructive fynbos wildfires.',
    targetMonthly: 12000,
    currentRaised: 9450,
    impactMetrics: '14,200 ha restored · 6 endangered plant species protected',
  },
  {
    id: 'indigenous-flora',
    name: 'Indigenous Medicinal Flora Trust',
    category: 'Medicinal Heritage',
    description: 'Empowers local African herbalists with sustainable propagation of Sutherlandia, Sceletium, and indigenous medicinal flora.',
    targetMonthly: 8000,
    currentRaised: 5820,
    impactMetrics: '4 community nurseries · 18,000 seedlings planted',
  },
  {
    id: 'alt-med-research',
    name: 'Alternative Medicine Research SA',
    category: 'Clinical Research',
    description: 'Funds scientific pharmacology trials, cannabinoid therapeutic safety profiles, and affordable access for chronic patients.',
    targetMonthly: 5000,
    currentRaised: 3910,
    impactMetrics: '3 clinical trials funded · 450 chronic pain patients assisted',
  },
];

const COMMUNITY_DONATIONS_KEY = 'herbal_harbour_community_donations';
const DONATION_RECORDS_KEY = 'herbal_harbour_donation_records';

export interface CommunityCharityStats {
  totalRaised: number;
  monthlyGoal: number;
  donorCount: number;
  initiatives: CharityInitiative[];
}

export function calculateRoundUp(totalAmount: number): { roundedTotal: number; donationAmount: number } {
  if (totalAmount <= 0) {
    return { roundedTotal: 0, donationAmount: 0 };
  }
  // Round up to nearest R10
  const remainder = totalAmount % 10;
  let donation = remainder === 0 ? 10 : Math.round((10 - remainder) * 100) / 100;
  if (donation < 1) donation += 10; // ensure meaningful contribution
  const roundedTotal = Math.round((totalAmount + donation) * 100) / 100;
  return {
    roundedTotal,
    donationAmount: donation,
  };
}

export function getCharityStats(): CommunityCharityStats {
  const baseMonthlyGoal = 25000;
  let storedAddedDonations = 0;
  let storedRecords: DonationRecord[] = [];

  try {
    const rawVal = localStorage.getItem(COMMUNITY_DONATIONS_KEY);
    if (rawVal) storedAddedDonations = parseFloat(rawVal) || 0;
    const rawRecords = localStorage.getItem(DONATION_RECORDS_KEY);
    if (rawRecords) storedRecords = JSON.parse(rawRecords);
  } catch {
    /* private browsing fallback */
  }

  // Base starting total from community contributions this month
  const baseTotal = 19180;
  const totalRaised = Math.round((baseTotal + storedAddedDonations) * 100) / 100;
  const baseDonors = 342;
  const donorCount = baseDonors + storedRecords.length;

  // Distribute additional donations into initiatives
  const initiatives = SA_CHARITY_INITIATIVES.map((init) => {
    const initAdded = storedRecords
      .filter((rec) => rec.charityId === init.id)
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      ...init,
      currentRaised: Math.round((init.currentRaised + initAdded) * 100) / 100,
    };
  });

  return {
    totalRaised,
    monthlyGoal: baseMonthlyGoal,
    donorCount,
    initiatives,
  };
}

export function recordCharityDonation(
  amount: number,
  charityId: string,
  source: 'spin' | 'wallet' | 'checkout_roundup',
  userId?: string,
  userEmail?: string
): CommunityCharityStats {
  if (amount <= 0) return getCharityStats();

  const record: DonationRecord = {
    id: `don_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userEmail,
    amount: Math.round(amount * 100) / 100,
    charityId,
    source,
    createdAt: new Date().toISOString(),
  };

  try {
    const currentAdded = parseFloat(localStorage.getItem(COMMUNITY_DONATIONS_KEY) || '0') || 0;
    localStorage.setItem(COMMUNITY_DONATIONS_KEY, (currentAdded + record.amount).toString());

    const currentRecords: DonationRecord[] = JSON.parse(localStorage.getItem(DONATION_RECORDS_KEY) || '[]');
    currentRecords.unshift(record);
    localStorage.setItem(DONATION_RECORDS_KEY, JSON.stringify(currentRecords.slice(0, 50)));
  } catch {
    /* private browsing fallback */
  }

  // Dispatch custom window event so all components react immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hh-charity-updated', { detail: record }));
  }

  return getCharityStats();
}
