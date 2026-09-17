import { PaymentInfo, PaymentMethod, PaymentStatus } from '@/types/payment.types';

// Mock payment service — simulates Stripe and cash payments.
// Will be replaced with real Stripe integration + Supabase Edge Function later.
export const paymentService = {
  /**
   * Create a mock payment intent (simulates Stripe PaymentIntent creation).
   * In production, this would call a Supabase Edge Function that uses
   * the Stripe secret key to create a real PaymentIntent server-side.
   */
  async createPaymentIntent(amount: number): Promise<{
    paymentId: string;
    clientSecret: string;
  }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const paymentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const clientSecret = `${paymentId}_secret_mock`;

    return { paymentId, clientSecret };
  },

  async confirmCardPayment(paymentId: string): Promise<PaymentInfo> {
    // Security Rule: Client-side card confirmation is strictly disabled in production.
    // Card payments must be processed via Stripe/CMI backend webhook with HMAC signature verification.
    throw new Error(
      'Paiement par carte non disponible directement sur le mobile. Veuillez sélectionner le paiement à la livraison (Cash).'
    );
  },

  /**
   * Create a cash payment record (no processing needed).
   * Payment will be collected by the delivery driver.
   */
  async createCashPayment(amount: number): Promise<PaymentInfo> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      method: 'cash',
      status: 'pending', // Will be marked 'paid' when driver collects
      amount,
      shipping_cost: 15,
    };
  },

  /**
   * Process payment based on method.
   */
  async processPayment(
    method: PaymentMethod,
    amount: number
  ): Promise<PaymentInfo> {
    if (method === 'card') {
      const { paymentId } = await this.createPaymentIntent(amount);
      const result = await this.confirmCardPayment(paymentId);
      return { ...result, amount };
    }

    return this.createCashPayment(amount);
  },

  /**
   * Get payment status label in French.
   */
  getStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      pending: 'En attente',
      paid: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé',
    };
    return labels[status];
  },

  /**
   * Get payment method label in French.
   */
  getMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      card: 'Carte bancaire',
      cash: 'Cash à la livraison',
      transfer: 'Virement bancaire (RIB)',
    };
    return labels[method];
  },
};
