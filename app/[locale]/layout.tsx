import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Kufi_Arabic } from "next/font/google";
import "@/app/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });
const kufiArabic = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "ABEERX | Luxury Perfumes in Kuwait",
  description: "Discover your signature scent with ABEERX. Authentic luxury perfumes delivered across Kuwait.",
};

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ar' }];
}

import { CartProvider } from "@/features/cart/CartContext";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { Analytics } from "@/components/Analytics";
import { DeliveryProvider } from "@/features/delivery/DeliveryContext";
import { getDeliverySettings } from "@/services/DeliveryService";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const delivery = await getDeliverySettings();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const fontVariables = `${inter.variable} ${playfair.variable} ${locale === 'ar' ? kufiArabic.variable : ''}`;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${fontVariables} antialiased min-h-screen flex flex-col`}>
        <Analytics />
        <DeliveryProvider value={delivery}>
        <CartProvider>
          <Header locale={locale} />
          <CartDrawer locale={locale} />
          <main className="flex-grow pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
        </CartProvider>
        </DeliveryProvider>
      </body>
    </html>
  );
}
