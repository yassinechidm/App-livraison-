import Colors from "@/constants/Colors";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
          flex: 1,
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        },
        animation: "fade",
      }}
    />
  );
}
