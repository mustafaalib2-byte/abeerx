import { ProductService } from "@/services/ProductService";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const products = await ProductService.getAllProducts();

  return <ShopClient products={products} locale={locale} />;
}