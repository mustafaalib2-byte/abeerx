import type { Metadata } from "next";
import SuccessClient from "./SuccessClient";

// A thank-you page should never appear in Google search results.
export const metadata: Metadata = {
  title: "Order Confirmed | ABEERX",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <SuccessClient locale={locale} />;
}
