import { PaymentMethod, PaymentStatus } from './payment.types';

export type ParcelStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'returned';

export interface ParcelStatusInfo {
  key: ParcelStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface Parcel {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  city: string;
  status: ParcelStatus;
  cod_amount: number; // Cash on Delivery amount in MAD
  shipping_cost: number;
  notes: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  user_id: string;
}

export interface CreateParcelInput {
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  city: string;
  cod_amount: number;
  notes?: string;
  payment_method?: PaymentMethod;
}

export interface DashboardStats {
  totalParcels: number;
  pendingParcels: number;
  inTransitParcels: number;
  deliveredParcels: number;
  returnedParcels: number;
  totalCodAmount: number;
  deliveredCodAmount: number;
}
