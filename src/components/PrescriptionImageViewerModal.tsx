import Colors from "@/constants/Colors";
import { useLanguage } from "@/src/context/LanguageContext";
import { FileText, Phone, X } from "lucide-react-native";
import React from "react";
import {
    Dimensions,
    Image,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PrescriptionImageViewerModalProps {
  visible: boolean;
  imageUrl?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const PrescriptionImageViewerModal: React.FC<
  PrescriptionImageViewerModalProps
> = ({
  visible,
  imageUrl,
  orderNumber,
  customerName,
  customerPhone,
  onClose,
}) => {
  const { t } = useLanguage();

  if (!visible || !imageUrl) return null;

  const handleCallCustomer = () => {
    if (!customerPhone) return;
    const cleanNumber = customerPhone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.titleCol}>
            <View style={styles.badgeRow}>
              <FileText size={16} color="#10B981" />
              <Text style={styles.modalTitle}>
                {t("pharmacy.prescriptionDoc", "Ordonnance Médicale")}
              </Text>
            </View>
            {orderNumber && (
              <Text style={styles.orderNumberText}>
                {orderNumber} {customerName ? `• ${customerName}` : ""}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeBtnCircle}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Full Image Container */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          {customerPhone && (
            <TouchableOpacity
              style={styles.callClientBtn}
              onPress={handleCallCustomer}
              activeOpacity={0.85}
            >
              <Phone size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.callClientText}>
                {t("orders.call", "Appeler")} {customerPhone}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissText}>
              {t("common.close", "Fermer")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.95)",
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 36 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
  },
  titleCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  orderNumberText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  fullImage: {
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 12,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(17, 24, 39, 0.98)",
  },
  callClientBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  callClientText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dismissBtn: {
    minWidth: 100,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  dismissText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
