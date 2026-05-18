/** Theme tokens (green-minimalist palette). */

export type ThemeMode = "light" | "dark";

const palette = {
  primary: { light: "#059669", dark: "#10b981" },
  primarySoft: { light: "#D1FAE5", dark: "#064E3B" },
  background: { light: "#F8FAF9", dark: "#0A0F0D" },
  surface: { light: "#FFFFFF", dark: "#131C18" },
  surfaceAlt: { light: "#F1F5F4", dark: "#0F1612" },
  textPrimary: { light: "#1A202C", dark: "#F3F4F6" },
  textSecondary: { light: "#64748B", dark: "#94A3B8" },
  textMuted: { light: "#94A3B8", dark: "#64748B" },
  border: { light: "#E2E8F0", dark: "#22302A" },
  success: { light: "#10B981", dark: "#34D399" },
  warning: { light: "#F59E0B", dark: "#FBBF24" },
  danger: { light: "#EF4444", dark: "#F87171" },
  info: { light: "#3B82F6", dark: "#60A5FA" },
};

export function getColors(mode: ThemeMode) {
  return {
    primary: palette.primary[mode],
    primarySoft: palette.primarySoft[mode],
    background: palette.background[mode],
    surface: palette.surface[mode],
    surfaceAlt: palette.surfaceAlt[mode],
    textPrimary: palette.textPrimary[mode],
    textSecondary: palette.textSecondary[mode],
    textMuted: palette.textMuted[mode],
    border: palette.border[mode],
    success: palette.success[mode],
    warning: palette.warning[mode],
    danger: palette.danger[mode],
    info: palette.info[mode],
  };
}
export type Colors = ReturnType<typeof getColors>;

export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 };
export const radii = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };
export const fontSizes = { hero: 56, h1: 32, h2: 24, h3: 20, body: 16, small: 14, micro: 12 };
