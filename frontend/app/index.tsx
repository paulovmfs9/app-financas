import { Redirect } from "expo-router";

export default function Index() {
  // Routing is handled by Gate in _layout based on auth state.
  return <Redirect href="/(tabs)" />;
}
