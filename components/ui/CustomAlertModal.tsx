import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Colors from "../../constants/Colors";
import {
    AlertButton,
    AlertOptions,
    alertService,
} from "../../services/alert.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const CustomAlertModal: React.FC = () => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  useEffect(() => {
    return alertService.subscribe((current) => {
      setAlert(current);
    });
  }, []);

  if (!alert) return null;

  const buttons =
    alert.buttons && alert.buttons.length > 0
      ? alert.buttons
      : [{ text: "OK", style: "default" as const }];

  const handleButtonPress = (btn: AlertButton) => {
    alertService.hide();
    if (btn.onPress) {
      btn.onPress();
    }
  };

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      onRequestClose={() => alertService.hide()}
    >
      <TouchableWithoutFeedback onPress={() => alertService.hide()}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              {!!alert.message && (
                <Text style={styles.alertMessage}>{alert.message}</Text>
              )}

              <View
                style={[
                  styles.buttonRow,
                  buttons.length > 2 && { flexDirection: "column" },
                ]}
              >
                {buttons.map((btn, index) => {
                  const isCancel = btn.style === "cancel";
                  const isDestructive = btn.style === "destructive";

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.baseBtn,
                        isCancel ? styles.cancelBtn : styles.primaryBtn,
                        isDestructive && styles.destructiveBtn,
                        buttons.length === 1 && styles.singleBtn,
                        buttons.length === 2 && { flex: 1 },
                        buttons.length > 2 && { width: "100%" },
                      ]}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.baseBtnText,
                          isCancel
                            ? styles.cancelBtnText
                            : styles.primaryBtnText,
                          isDestructive && { color: "#FFFFFF" },
                        ]}
                      >
                        {btn.text || "OK"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(60, 52, 137, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  alertCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#CECBF6",
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#3C3489",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#3C3489",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: "#7F77DD",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    width: "100%",
    marginTop: 6,
  },
  baseBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  singleBtn: {
    width: "100%",
  },
  baseBtnText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: Colors.cta,
    shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  cancelBtnText: {
    color: "#3C3489",
    fontSize: 15,
    fontWeight: "700",
  },
  destructiveBtn: {
    backgroundColor: Colors.error,
  },
});
