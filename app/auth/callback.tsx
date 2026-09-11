import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Colors from "../../constants/Colors";
import { authService } from "../../services/auth.service";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    async function processCallback() {
      try {
        const queryString = Object.entries(params)
          .map(
            ([k, v]) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
          )
          .join("&");

        const callbackUrl = `quicklylivraison://auth/callback?${queryString}`;
        await authService.handleOAuthCallback(callbackUrl);

        const role = authService.getUserRole()?.toLowerCase();
        if (role === "admin") {
          router.replace("/(app)/(admin)/(tabs)" as any);
        } else if (role === "delivery") {
          router.replace("/(app)/(delivery)/(tabs)" as any);
        } else {
          router.replace("/(app)/(client)/(tabs)" as any);
        }
      } catch {
        router.replace("/(auth)/login");
      }
    }

    processCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Connexion en cours...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F7FD",
    gap: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2375",
  },
});
