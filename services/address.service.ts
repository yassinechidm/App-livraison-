import { Address } from '@/types/order.types';

export let INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    user_id: 'client-oujda-1',
    label: 'Maison',
    address: 'Rue Al Andalous 14, Résidence Al Yassamine Apt 4',
    city: 'Hay Al Qods (وجدة)',
    is_default: true,
  },
  {
    id: 'addr-2',
    user_id: 'client-oujda-1',
    label: 'Bureau / Travail',
    address: 'Boulevard Mohammed V, Immeuble BMCE 2ème étage',
    city: 'Centre-Ville (وجدة)',
    is_default: false,
  },
];

export const addressService = {
  async getAddresses(userId?: string): Promise<Address[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [...INITIAL_ADDRESSES];
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newAddr: Address = {
      ...address,
      id: `addr-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    if (newAddr.is_default) {
      INITIAL_ADDRESSES.forEach((a) => (a.is_default = false));
    }
    INITIAL_ADDRESSES.push(newAddr);
    return newAddr;
  },

  async deleteAddress(id: string): Promise<void> {
    INITIAL_ADDRESSES = INITIAL_ADDRESSES.filter((a) => a.id !== id);
  },
};
