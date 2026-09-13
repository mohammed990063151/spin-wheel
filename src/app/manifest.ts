import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "عجلة الحظ | Place × Enala",
    short_name: "عجلة الحظ",
    description: "مسابقة عجلة الحظ — فنادق إناله ومصنع Place",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    orientation: "any",
    background_color: "#f7f6f2",
    theme_color: "#f7f6f2",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
