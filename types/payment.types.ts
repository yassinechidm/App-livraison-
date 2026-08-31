export type PaymentMethod = 'cash' | 'transfer' | 'card';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number; // Total amount in MAD
  shipping_cost: number;
  stripe_payment_id?: string;
  bank_transfer_ref?: string;
  paid_at?: string;
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'cash',
    title: 'Cash à la livraison (Espèces)',
    subtitle: 'Payez directement au livreur à la réception',
    emoji: '💵',
    color: '#00B602',
    bgColor: '#F0FDF4',
  },
  {
    id: 'transfer',
    title: 'Virement Bancaire (RIB)',
    subtitle: 'CIH Bank / Attijariwafa Bank / Application bancaire',
    emoji: '🏦',
    color: '#0066FF',
    bgColor: '#EBF2FF',
  },
];

export const BANK_DETAILS = {
  bankName: 'CIH Bank / Attijariwafa Bank',
  accountHolder: 'QuickLivraison Oujda SARL',
  rib: '230 570 4567890123456700 89',
  iban: 'MA64 2305 7045 6789 0123 4567 0089',
  swift: 'CIHMMAMC',
  city: 'Oujda',
  whatsappReceipt: '+212 6 61 22 33 44',
};

