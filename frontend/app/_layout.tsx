import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/providers/AuthProvider";
import { ThemeProvider, useTheme } from "../src/providers/ThemeProvider";
import { ExpensesProvider } from "../src/providers/ExpensesProvider";

/** Routing gate: redirects based on auth state + onboarding. */
function Gate() {
  const { status, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { mode, colors } = useTheme();

  useEffect(() => {
    if (status === "loading") return;
    const inAuth = segments[0] === "(auth)";
    if (status === "unauthenticated") {
      if (!inAuth) router.replace("/(auth)/login");
      return;
    }
    // authenticated
    if (inAuth) {
      if (profile && !profile.onboarded) router.replace("/onboarding");
      else router.replace("/(tabs)");
      return;
    }
    if (profile && !profile.onboarded && segments[0] !== "onboarding") {
      router.replace("/onboarding");
      return;
    }
    if (profile && profile.onboarded && segments[0] === "onboarding") {
      router.replace("/(tabs)");
    }
  }, [status, profile, segments, router]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="plans" />
        <Stack.Screen
          name="add-expense"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ExpensesProvider>
              <Gate />
            </ExpensesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
