import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Kufi_Arabic } from "next/font/google";
import "@/app/globals.css";
import Header from "@/components/Header";

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

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const fontVariables = `${inter.variable} ${playfair.variable} ${locale === 'ar' ? kufiArabic.variable : ''}`;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${fontVariables} antialiased min-h-screen flex flex-col`}>
        <Analytics />
        <CartProvider>
          <Header locale={locale} />
          <CartDrawer locale={locale} />
          <main className="flex-grow">
            {children}
          </main>
        {/* Footer will go here */}
        <footer className="bg-primary text-primary-foreground py-12 text-center text-sm mt-auto border-t border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-serif tracking-widest mb-4">ABEERX</h2>
            <p className="opacity-70 mb-8">Authentic Luxury Perfumery in Kuwait.</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="hover:text-ring">Privacy Policy</a>
              <a href="#" className="hover:text-ring">Terms of Service</a>
              <a href="#" className="hover:text-ring">Contact Us</a>
            </div>
          </div>
        </footer>
        </CartProvider>
      </body>
    </html>
  );
}
