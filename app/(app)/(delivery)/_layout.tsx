import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { Redirect, Stack } from "expo-router";

export default function DeliveryLayout() {
  const role = authService.getUserRole();
  if (role !== "delivery" && role !== "admin") {
    return <Redirect href="/(app)/(client)/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
