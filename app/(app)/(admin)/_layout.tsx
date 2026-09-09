import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { Redirect, Stack } from "expo-router";

export default function AdminLayout() {
  const role = authService.getUserRole();
  if (role !== "admin") {
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
