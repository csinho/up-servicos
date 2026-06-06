import { APP_DESCRIPTION, APP_NAME } from "./app-brand";

/** Cores alinhadas ao favicon (#111) e fundo claro do app. */
export const PWA_THEME_COLOR = "#111111";
export const PWA_BACKGROUND_COLOR = "#ffffff";

export const pwaManifest = {
  name: APP_NAME,
  short_name: APP_NAME,
  description: APP_DESCRIPTION,
  lang: "pt-BR",
  dir: "ltr" as const,
  start_url: "/",
  scope: "/",
  display: "standalone" as const,
  orientation: "portrait-primary" as const,
  theme_color: PWA_THEME_COLOR,
  background_color: PWA_BACKGROUND_COLOR,
  categories: ["business", "productivity"],
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};
