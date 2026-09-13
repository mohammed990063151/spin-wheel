import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Cairo, Tajawal } from "next/font/google";
import { LocaleProvider } from "@/components/LocaleProvider";
import KioskShell from "@/components/KioskShell";
import { localeDir, parseLocale, t } from "@/lib/i18n";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseLocale((await cookies()).get("spin-locale")?.value);
  return {
    title: t(locale, "meta.title"),
    description: t(locale, "meta.description"),
    applicationName: "عجلة الحظ",
    appleWebApp: {
      capable: true,
      title: "عجلة الحظ",
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon: "/icon.svg",
      apple: "/icon.svg",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = parseLocale((await cookies()).get("spin-locale")?.value);

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <LocaleProvider initialLocale={locale}>
          <KioskShell>{children}</KioskShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
