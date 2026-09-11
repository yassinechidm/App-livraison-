import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { CustomAlertModal } from "../components/ui/CustomAlertModal";
import LoadingScreen from "../components/ui/LoadingScreen";
import { alertService } from "../services/alert.service";
import { authService } from "../services/auth.service";
import { LanguageProvider } from "../src/context/LanguageContext";
import { paperTheme } from "../src/theme";

// Wire all app pop-up messages to the branded login-styled alert modal
Alert.alert = alertService.alert.bind(alertService) as any;

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
  const [authState, setAuthState] = useState(authService.getAuthState());
  const segments = useSegments();
  const router = useRouter();

  // Initialize and listen to authoritative auth state
  useEffect(() => {
    authService.initialize();

    const unsubscribe = authService.onAuthStateChange((state) => {
      setAuthState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle font loading errors
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // Hide splash screen when fonts are loaded and auth is initialized
  useEffect(() => {
    if (fontsLoaded && authState.isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authState.isInitialized]);

  // Auth guard — deterministic redirect based on auth status and role
  useEffect(() => {
    if (!authState.isInitialized || !fontsLoaded) return;
    if (authState.status === "INITIALIZING") return;

    const inAuthGroup = segments[0] === "(auth)";
    const inCallbackRoute = segments[0] === "auth";

    if (inCallbackRoute) {
      // Allow callback screen to handle OAuth processing
      return;
    }

    if (authState.status === "UNAUTHENTICATED" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (authState.status === "AUTHENTICATED" && inAuthGroup) {
      const role = authState.role || authService.getUserRole();
      if (role === "admin") {
        router.replace("/(app)/(admin)/(tabs)" as any);
      } else if (role === "delivery") {
        router.replace("/(app)/(delivery)/(tabs)" as any);
      } else {
        router.replace("/(app)/(client)/(tabs)" as any);
      }
    }
  }, [
    authState.status,
    authState.role,
    authState.isInitialized,
    segments,
    fontsLoaded,
  ]);

  // Show loading while initializing
  if (
    !fontsLoaded ||
    !authState.isInitialized ||
    authState.status === "INITIALIZING"
  ) {
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
            <CustomAlertModal />
          </BottomSheetModalProvider>
        </LanguageProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
