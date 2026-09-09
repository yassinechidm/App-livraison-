import {
    AnyPurchasableItem,
    CartItem,
    CartState,
    SelectedCustomization,
} from "@/types/cart.types";

type CartListener = (state: CartState) => void;

class CartManager {
  private items: CartItem[] = [];
  private listeners: Set<CartListener> = new Set();
  private deliveryFeeRate: number = 15.0; // 15 MAD flat rate for delivery in Oujda
  private freeDeliveryThreshold: number = 100.0; // Free delivery above 100 MAD
  private deliveryMode: "DELIVERY" | "PICKUP" = "DELIVERY";
  private loyaltyFreeDelivery: boolean = false; // true if client has 5+ past orders

  public setLoyaltyFreeDelivery(isFree: boolean) {
    this.loyaltyFreeDelivery = isFree;
    this.notify();
  }

  public getState(): CartState {
    const subtotal = this.items.reduce((sum, item) => {
      const unitPrice =
        Number(item.unit_total_price ?? item.product.price) || 0;
      return sum + unitPrice * (Number(item.quantity) || 1);
    }, 0);

    const itemCount = this.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );

    let deliveryFee = 0;
    let freeDeliveryReason: "threshold" | "loyalty" | null = null;

    if (this.deliveryMode === "DELIVERY" && itemCount > 0) {
      if (this.loyaltyFreeDelivery) {
        deliveryFee = 0;
        freeDeliveryReason = "loyalty";
      } else if (subtotal >= this.freeDeliveryThreshold) {
        deliveryFee = 0;
        freeDeliveryReason = "threshold";
      } else {
        deliveryFee = this.deliveryFeeRate;
      }
    }

    const total = subtotal + deliveryFee;

    return {
      items: [...this.items],
      subtotal,
      deliveryFee,
      deliveryMode: this.deliveryMode,
      freeDeliveryThreshold: this.freeDeliveryThreshold,
      total,
      itemCount,
      freeDeliveryReason,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Safe fail
      }
    });
  }

  public subscribe(listener: CartListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setDeliveryMode(mode: "DELIVERY" | "PICKUP") {
    this.deliveryMode = mode;
    this.notify();
  }

  public addItem(
    product: AnyPurchasableItem,
    quantity: number = 1,
    selected_customizations?: SelectedCustomization[],
    special_instructions?: string,
  ) {
    if (!product || !product.id) return;

    const basePrice = Number(product.price) || 0;
    const customExtra = (selected_customizations || []).reduce(
      (sum, c) => sum + (Number(c.price) || 0),
      0,
    );
    const unit_total_price = basePrice + customExtra;

    // Generate unique key based on product id + customizations
    const customKey = (selected_customizations || [])
      .map((c) => `${c.groupId}:${c.optionId}`)
      .sort()
      .join("|");
    const safeInstructions = (special_instructions || "").trim();
    const cartItemId =
      customKey || safeInstructions
        ? `${product.id}_${customKey}_${safeInstructions}`
        : product.id;

    const existingIndex = this.items.findIndex(
      (i) =>
        i.cart_item_id === cartItemId ||
        (!customKey && !safeInstructions && i.product.id === product.id),
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        cart_item_id: cartItemId,
        product: {
          ...product,
          price: basePrice,
        },
        quantity,
        selected_customizations,
        special_instructions: safeInstructions || undefined,
        unit_total_price,
      });
    }

    this.notify();
  }

  public setQuantity(cartItemIdOrProductId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(cartItemIdOrProductId);
      return;
    }

    const item = this.items.find(
      (i) =>
        i.cart_item_id === cartItemIdOrProductId ||
        i.product.id === cartItemIdOrProductId,
    );
    if (item) {
      item.quantity = quantity;
      this.notify();
    }
  }

  public removeItem(cartItemIdOrProductId: string) {
    this.items = this.items.filter(
      (i) =>
        i.cart_item_id !== cartItemIdOrProductId &&
        i.product.id !== cartItemIdOrProductId,
    );
    this.notify();
  }

  public getItemQuantity(productId: string): number {
    return this.items
      .filter((i) => i.product.id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  }

  public clearCart() {
    this.items = [];
    this.notify();
  }
}

export const cartService = new CartManager();
