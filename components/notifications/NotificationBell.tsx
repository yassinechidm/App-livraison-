// ==============================================================================
// QUICKLY LIVRAISON — NOTIFICATION BELL COMPONENT
// Path: components/notifications/NotificationBell.tsx
// ==============================================================================

import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { notificationService } from "@/services/notification.service";
import { AppNotification } from "@/types/notification.types";
import { Bell } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { NotificationCenterModal } from "./NotificationCenterModal";

interface NotificationBellProps {
  color?: string;
  size?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  color = Colors.textPrimary,
  size = 22,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get authenticated user session
    authService.getSession().then((session) => {
      const uid = session?.user?.id;
      if (uid) {
        setUserId(uid);
        // Register device push token automatically
        notificationService.registerForPushNotificationsAsync();
        // Load initial unread count
        refreshUnread();

        // 2. Subscribe to live incoming notifications
        const unsub = notificationService.subscribeToNotifications(
          uid,
          (newNotif: AppNotification) => {
            setUnreadCount((prev) => prev + 1);
            // Show brief in-app toast
            Toast.show({
              type: "info",
              text1: newNotif.title,
              text2: newNotif.body,
              position: "top",
              visibilityTime: 4000,
            });
          },
        );

        return () => {
          unsub();
        };
      }
    });
  }, []);

  const refreshUnread = async () => {
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => {
          setIsModalVisible(true);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${unreadCount} non lues`}
      >
        <Bell size={size} color={color} strokeWidth={2.0} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificationCenterModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          refreshUnread();
        }}
        onNotificationRead={() => {
          refreshUnread();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
});
