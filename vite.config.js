import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
//import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs';


// https://vitejs.dev/config/
const manifestForPlugin = {
  registerType: "prompt",
  includeAssets: [
    "logo.png",
    "logo.png",
    "maskable_iconx48.png",
    "maskable_iconx72.png",
    "maskable_iconx96.png",
    "maskable_iconx128.png",
    "maskable_iconx192.png",
    "maskable_iconx384.png",
    "maskable_iconx512.png",
    "maskable_icon.png",
  ],
  manifest: {
    name: "FalaGOV - Aplicativo de Ouvidoria Governamental",
    short_name: "FalaGOV",
    description: "Aplicativo para fazer solicitações/reclamações para o Governo",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/maskable_icon_x48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable_icon_x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable_icon_x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable_icon_x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable_icon_x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable_icon_x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable_icon_x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    theme_color: "#212121",
    background_color: "#D7FFFE",
    display: "standalone",
    scope: "/",
    start_url: "/",
    orientation: "portrait",
  },
  devOptions: {
    enabled: true,
  },
};
export default defineConfig({
server: {
    https: {
      key: fs.readFileSync('/etc/letsencrypt/live/neogov.com.br/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/neogov.com.br/cert.pem'),
    },
  },
  plugins: [react(), VitePWA(manifestForPlugin)],
});
