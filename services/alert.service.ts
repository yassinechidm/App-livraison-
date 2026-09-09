export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: "info" | "success" | "error" | "warning";
}

type AlertListener = (alert: AlertOptions | null) => void;

class AlertService {
  private listeners: Set<AlertListener> = new Set();
  private currentAlert: AlertOptions | null = null;

  subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    listener(this.currentAlert);
    return () => {
      this.listeners.delete(listener);
    };
  }

  show(options: AlertOptions) {
    this.currentAlert = options;
    this.notify();
  }

  alert(title: string, message?: string, buttons?: AlertButton[]) {
    this.show({
      title,
      message,
      buttons:
        buttons && buttons.length > 0
          ? buttons
          : [{ text: "OK", style: "default" }],
    });
  }

  hide() {
    this.currentAlert = null;
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentAlert));
  }
}

export const alertService = new AlertService();
