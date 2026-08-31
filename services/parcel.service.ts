import { Parcel, CreateParcelInput, DashboardStats } from '@/types/parcel.types';
import { MOCK_PARCELS, MOCK_DASHBOARD_STATS } from '@/constants/mockData';

// Mock service — will be replaced with Supabase calls later
export const parcelService = {
  async getParcels(): Promise<Parcel[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_PARCELS;
  },

  async getParcelById(id: string): Promise<Parcel | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return MOCK_PARCELS.find((p) => p.id === id);
  },

  async createParcel(input: CreateParcelInput): Promise<Parcel> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newParcel: Parcel = {
      id: String(MOCK_PARCELS.length + 1),
      tracking_number: `QL-2026-${String(MOCK_PARCELS.length + 142).padStart(5, '0')}`,
      recipient_name: input.recipient_name,
      recipient_phone: input.recipient_phone,
      recipient_address: input.recipient_address,
      city: input.city,
      status: 'pending',
      cod_amount: input.cod_amount,
      shipping_cost: 35,
      notes: input.notes ?? '',
      payment_method: input.payment_method ?? 'cash',
      payment_status: input.payment_method === 'card' ? 'paid' : 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      delivered_at: null,
      user_id: 'mock-user-1',
    };

    MOCK_PARCELS.push(newParcel);
    return newParcel;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return MOCK_DASHBOARD_STATS;
  },
};
