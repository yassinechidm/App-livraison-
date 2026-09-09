import { authService } from "@/services/auth.service";
import { Redirect } from "expo-router";

export default function RootIndex() {
  const role = authService.getUserRole()?.toLowerCase();
  if (role === "admin") {
    return <Redirect href="/(app)/(admin)/(tabs)" />;
  }
  if (role === "delivery") {
    return <Redirect href="/(app)/(delivery)/(tabs)" />;
  }
  return <Redirect href="/(app)/(client)/(tabs)" />;
}
