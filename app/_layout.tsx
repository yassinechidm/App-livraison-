import LoadingScreen from "@/components/ui/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import { LanguageProvider } from "@/src/context/LanguageContext";
import { paperTheme } from "@/src/theme";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

import { Platform } from "react-native";

if (Platform.OS === "web" && typeof document !== "undefined") {
  try {
    const styleId = "expo-web-global-overflow-fix";
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = `
        html, body {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          touch-action: none !important;
        }
        #root, [data-reactroot] {
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        * {
          box-sizing: border-box !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
  } catch {}
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession);
      }
    });

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

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // Not signed in — redirect to login
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      const role = authService.getUserRole()?.toLowerCase();
      if (role === "admin") {
        router.replace("/(app)/(admin)/(tabs)" as any);
      } else if (role === "delivery") {
        router.replace("/(app)/(delivery)/(tabs)" as any);
      } else {
        router.replace("/(app)/(client)/(tabs)" as any);
      }
    }
  }, [session, segments, isInitialized, fontsLoaded]);

  // Show loading while initializing
  if (!fontsLoaded || !isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, width: "100%", overflow: "hidden" }}
    >
      <PaperProvider theme={paperTheme}>
        <LanguageProvider>
          <BottomSheetModalProvider>
            <StatusBar style="dark" />
            <Slot />
            <Toast />
          </BottomSheetModalProvider>
        </LanguageProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
