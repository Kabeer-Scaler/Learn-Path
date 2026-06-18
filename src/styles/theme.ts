// Centralised theme tokens. Five-color palette + semantic mappings for light/dark.
// Palette: warm cream + teal/mint with a terracotta accent (LearnPath AI design).

export const palette = {
  powderBlush: "#c8795c", // warm terracotta — warnings / needs review
  vanillaCream: "#fff4e1", // cream
  icyAqua: "#89d7b7", // mint
  lightBlue: "#428475", // teal (primary accent)
  blueSlate: "#1a312c" // deep forest green (brand dark)
} as const;

export type PaletteName = keyof typeof palette;

export type SemanticTokens = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  mutedText: string;
  accent: string;
  accentSoft: string;
  highlight: string;
  highlightSoft: string;
  secondary: string;
  border: string;
  ring: string;
};

export const lightTheme: SemanticTokens = {
  bg: palette.vanillaCream,
  surface: "#ffffff",
  surfaceMuted: "#f5ead2",
  text: palette.blueSlate,
  mutedText: "#5f7268",
  accent: palette.lightBlue,
  accentSoft: "#d9f0e4",
  highlight: palette.icyAqua,
  highlightSoft: "#d9f0e4",
  secondary: "#5dae97",
  border: "#e7dbc2",
  ring: palette.lightBlue
};

export const darkTheme: SemanticTokens = {
  bg: "#0e1f19",
  surface: "#16302a",
  surfaceMuted: "#1b342c",
  text: palette.vanillaCream,
  mutedText: "#a9c0b4",
  accent: "#5dae97",
  accentSoft: "#22382f",
  highlight: palette.icyAqua,
  highlightSoft: "#22382f",
  secondary: "#7fcdb4",
  border: "#2c463d",
  ring: palette.icyAqua
};

export const themes = { light: lightTheme, dark: darkTheme };
export type ThemeName = keyof typeof themes;
