// ==============================================================================
// QUICKLY LIVRAISON — IN-APP NOTIFICATION CENTER MODAL
// Path: components/notifications/NotificationCenterModal.tsx
// ==============================================================================

import Colors from "@/constants/Colors";
import { notificationService } from "@/services/notification.service";
import { useLanguage } from "@/src/context/LanguageContext";
import { AppNotification, NotificationType } from "@/types/notification.types";
import { useRouter } from "expo-router";
import {
    Bike,
    CheckCheck,
    Clock,
    Package,
    Pill,
    ShoppingCart,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

export const NotificationCenterModal: React.FC<
  NotificationCenterModalProps
> = ({ visible, onClose, onNotificationRead }) => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await notificationService.getNotifications(50);
    setNotifications(data);
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await notificationService.getNotifications(50);
    setNotifications(data);
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
    );
    onNotificationRead?.();
  };

  const handleNotificationPress = async (notif: AppNotification) => {
    // Mark as read immediately
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
      onNotificationRead?.();
    }

    onClose();

    // Deep-link based on type
    if (notif.type === "NEW_ORDER") {
      router.push("/(app)/(admin)/(tabs)/orders" as any);
    } else if (notif.type === "ORDER_ASSIGNED") {
      router.push("/(app)/(delivery)/(tabs)/active" as any);
    } else if (notif.type === "ORDER_STATUS_CHANGED") {
      router.push("/(app)/(client)/(tabs)/orders" as any);
    }
  };

  const filteredNotifications =
    filter === "UNREAD"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const renderTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "NEW_ORDER":
        return <ShoppingCart size={18} color="#0288D1" strokeWidth={2.2} />;
      case "ORDER_ASSIGNED":
        return <Bike size={18} color="#059669" strokeWidth={2.2} />;
      case "ORDER_STATUS_CHANGED":
        return <Package size={18} color="#F59E0B" strokeWidth={2.2} />;
      default:
        return <Pill size={18} color={Colors.primary} strokeWidth={2.2} />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t("notifications.justNow", "À l'instant");
    if (diffMin < 60) return `${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} h`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View
          style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}
        >
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Fermer"
          >
            <X size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {t("notifications.title", "Notifications")}
          </Text>

          {notifications.some((n) => !n.is_read) ? (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.7}
            >
              <CheckCheck size={16} color={Colors.primary} />
              <Text style={styles.markAllText}>
                {t("notifications.markAllRead", "Tout lire")}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 70 }} />
          )}
        </View>

        {/* Filter Pills */}
        <View
          style={[styles.filterBar, isRTL && { flexDirection: "row-reverse" }]}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "ALL" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("ALL")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "ALL" && styles.filterPillTextActive,
              ]}
            >
              {t("notifications.all", "Toutes")} ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filter === "UNREAD" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("UNREAD")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "UNREAD" && styles.filterPillTextActive,
              ]}
            >
              {t("notifications.unread", "Non lues")} (
              {notifications.filter((n) => !n.is_read).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconBox}>
              <Package size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "UNREAD"
                ? t("notifications.noUnread", "Aucune notification non lue")
                : t("notifications.empty", "Aucune notification")}
            </Text>
            <Text style={styles.emptySub}>
              {t(
                "notifications.emptyDesc",
                "Vous recevrez ici les alertes concernant vos commandes et livraisons.",
              )}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
          >
            {filteredNotifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  !notif.is_read && styles.notifCardUnread,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconBox,
                    notif.type === "NEW_ORDER" && styles.iconBoxOrder,
                    notif.type === "ORDER_ASSIGNED" && styles.iconBoxDelivery,
                  ]}
                >
                  {renderTypeIcon(notif.type)}
                </View>

                <View style={styles.textCol}>
                  <View
                    style={[
                      styles.cardTopRow,
                      isRTL && { flexDirection: "row-reverse" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.notifTitle,
                        !notif.is_read && styles.notifTitleUnread,
                        isRTL && { textAlign: "right" },
                      ]}
                      numberOfLines={1}
                    >
                      {notif.title}
                    </Text>
                    <View style={styles.timeRow}>
                      <Clock size={11} color={Colors.textMuted} />
                      <Text style={styles.timeText}>
                        {formatRelativeTime(notif.created_at)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.notifBody, isRTL && { textAlign: "right" }]}
                    numberOfLines={2}
                  >
                    {notif.body}
                  </Text>
                </View>

                {!notif.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  scrollList: {
    padding: 16,
    gap: 10,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxOrder: {
    backgroundColor: "#E0F2FE",
  },
  iconBoxDelivery: {
    backgroundColor: "#D1FAE5",
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  notifTitleUnread: {
    fontWeight: "800",
    color: "#0369A1",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  notifBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0288D1",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 10,
  },
  emptyIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
