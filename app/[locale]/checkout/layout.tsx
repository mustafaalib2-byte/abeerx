import type { Metadata } from "next";

// Checkout is personal to each shopper and should never appear in Google search results.
export const metadata: Metadata = {
  title: "Checkout | ABEERX",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
