import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/providers/ThemeProvider";

const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="home-outline" size={size} color={color} />
);
const StatsIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="stats-chart-outline" size={size} color={color} />
);
const PersonIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="person-outline" size={size} color={color} />
);

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="resumo" options={{ title: "Resumo", tabBarIcon: StatsIcon }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: PersonIcon }} />
    </Tabs>
  );
}
