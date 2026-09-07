import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { paperTheme } from '@/src/theme';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [session, setSession] = useState<Session | any | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    authService.getSession().then((currentSession: any) => {
      setSession(currentSession);
      setIsInitialized(true);
    });

    // Listen for custom auth service changes (demo + real)
    const unsubscribeAuth = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
    });

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      unsubscribeAuth();
      subscription.unsubscribe();
    };
  }, []);

  // Handle font loading errors
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  // Auth guard — redirect based on session state
  useEffect(() => {
    if (!isInitialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Not signed in — redirect to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Signed in — redirect according to role
      const role = authService.getUserRole();
      if (role?.toLowerCase() === 'admin') {
        router.replace('/(app)/(admin)/(tabs)' as any);
      } else {
        router.replace('/(app)/(client)/(tabs)' as any);
      }
    }
  }, [session, segments, isInitialized, fontsLoaded]);

  // Show loading while initializing
  if (!fontsLoaded || !isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Slot />
          <Toast />
        </BottomSheetModalProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
