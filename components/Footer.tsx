"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function Footer() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isArabic = locale === 'ar';

  return (
    <footer className="bg-secondary/50 pt-16 pb-12 mt-20 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          
          {/* Menu */}
          <div>
            <h3 className="font-serif text-xl mb-6 text-foreground">{isArabic ? "القائمة" : "Menu"}</h3>
            <ul className="space-y-4">
              <li><Link href={`/${locale}`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "الرئيسية" : "Home"}</Link></li>
              <li><Link href={`/${locale}/shop`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "المتجر" : "Shop"}</Link></li>
              <li><Link href={`/${locale}/brands`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "الماركات" : "Brands"}</Link></li>
              <li><Link href={`/${locale}/about`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "من نحن" : "About Us"}</Link></li>
              <li><Link href={`/${locale}/contact`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "تواصل معنا" : "Contact Us"}</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-xl mb-6 text-foreground">{isArabic ? "روابط سريعة" : "Quick Links"}</h3>
            <ul className="space-y-4">
              <li><Link href={`/${locale}/search`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "بحث" : "Search"}</Link></li>
              <li><Link href={`/${locale}/faq`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "الأسئلة الشائعة" : "FAQs"}</Link></li>
              <li><Link href={`/${locale}/privacy-policy`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
              <li><Link href={`/${locale}/shipping-policy`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "سياسة الشحن" : "Shipping Policy"}</Link></li>
              <li><Link href={`/${locale}/returns-refunds`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "الاسترجاع والاستبدال" : "Returns & Refunds"}</Link></li>
              <li><Link href={`/${locale}/terms-conditions`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "الشروط والأحكام" : "Terms & Conditions"}</Link></li>
              <li><Link href={`/${locale}/request-fragrance`} className="text-muted-foreground hover:text-ring transition-colors">{isArabic ? "اطلب عطر" : "Request a fragrance"}</Link></li>
            </ul>
          </div>

          {/* Our Store */}
          <div>
            <h3 className="font-serif text-xl mb-6 text-foreground">{isArabic ? "متجرنا" : "Our Store"}</h3>
            <ul className="space-y-4 text-muted-foreground">
              <li className="leading-relaxed">
                {isArabic ? "الكويت - المباركية، الغربللي، بالقرب من لؤلؤة سنتر - محل رقم ٧" : "KUWAIT CITY-AL-MUBARAKIYAH, GHARABALLY, NEAR LULUWA CENTER - SHOP NO. 7"}
              </li>
              <li>
                <span className="font-medium text-foreground">{isArabic ? "الهاتف: " : "Phone: "}</span>
                +965 98521807
              </li>
              <li>
                <span className="font-medium text-foreground">{isArabic ? "البريد الإلكتروني: " : "Email: "}</span>
                info@abeerx.com
              </li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
}