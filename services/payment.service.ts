import { PaymentMethod, PaymentStatus, PaymentInfo } from '@/types/payment.types';

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

  /**
   * Confirm a card payment (mock).
   * In production, this would use the Stripe SDK's confirmPayment.
   */
  async confirmCardPayment(paymentId: string): Promise<PaymentInfo> {
    // Simulate Stripe processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05;

    if (!isSuccess) {
      throw new Error('Le paiement a été refusé. Veuillez réessayer ou utiliser une autre carte.');
    }

    return {
      method: 'card',
      status: 'paid',
      amount: 0, // Will be set by caller
      shipping_cost: 15,
      stripe_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    };
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
