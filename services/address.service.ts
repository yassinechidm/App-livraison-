import { supabase } from "@/lib/supabase";
import { Address } from "@/types/order.types";

export const addressService = {
  async getAddresses(userId?: string): Promise<Address[]> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUserId = userId || session?.user?.id;
      if (!currentUserId) return [];

      const { data, error } = await (supabase as any)
        .from("addresses")
        .select("*")
        .eq("user_id", currentUserId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(_mapAddress);
    } catch (err) {
      console.warn("[addressService] getAddresses error:", err);
      return [];
    }
  },

  async addAddress(input: Omit<Address, "id">): Promise<Address> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || input.user_id;
    if (!userId) {
      throw new Error("Vous devez être connecté pour ajouter une adresse.");
    }

    if (input.is_default) {
      // Unset previous defaults for user
      await (supabase as any)
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const { data, error } = await (supabase as any)
      .from("addresses")
      .insert({
        user_id: userId,
        label: input.label,
        street: input.address,
        city: input.city || "Oujda",
        latitude: input.latitude || 34.6867,
        longitude: input.longitude || -1.9114,
        is_default: input.is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("[addressService] addAddress error:", error);
      throw new Error(error.message || "Impossible d'enregistrer l'adresse.");
    }

    return _mapAddress(data);
  },

  async deleteAddress(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("addresses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[addressService] deleteAddress error:", error);
      throw new Error(error.message || "Impossible de supprimer l'adresse.");
    }
  },
};

function _mapAddress(row: any): Address {
  return {
    id: row.id,
    user_id: row.user_id,
    label: row.label,
    address: row.street || row.address || "",
    city: row.city || "Oujda",
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    is_default: row.is_default ?? false,
    created_at: row.created_at,
  };
}
