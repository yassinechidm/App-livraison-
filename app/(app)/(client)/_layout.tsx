import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function ClientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
