"use client";

import Link from "next/link";
import { useCart } from "@/features/cart/CartContext";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header({ locale }: { locale: string }) {
  const isArabic = locale === 'ar';
  const { items, setIsCartOpen } = useCart();
  const router = useRouter();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/${locale}/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };
  
  return (
    <header className="w-full border-b border-border bg-background sticky top-0 z-50">
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground text-xs text-center py-2 uppercase tracking-widest font-medium">
        {isArabic ? "توصيل مجاني في الكويت للطلبات فوق 20 دينار" : "Free Delivery in Kuwait for orders over 20 KWD"}
      </div>
      
      {/* Main Header */}
      <div className="container mx-auto px-4 h-32 flex items-center justify-between relative">
        {/* Left: Logo & Hamburger */}
        <div className="flex-1 flex items-center justify-start space-x-2 md:space-x-0">
          <button className="md:hidden p-2 -ml-2 text-foreground">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <Link href={`/${locale}`}>
            <Image src="/logo-zoomed.png" alt="ABEERX" width={300} height={300} priority className="object-contain h-28 w-auto transform md:scale-110 md:origin-left" />
          </Link>
        </div>

        {/* Center: Navigation or Search */}
        <div className="flex-shrink-0 hidden md:flex items-center justify-center relative w-1/3">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="w-full flex items-center border-b border-foreground pb-1 animate-in fade-in zoom-in duration-300">
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? "ابحث عن العطور، الماركات..." : "Search for perfumes, brands..."}
                className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              />
              <button type="button" onClick={() => setIsSearchOpen(false)} className="ml-2 text-muted-foreground hover:text-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </form>
          ) : (
            <nav className="flex space-x-12 text-sm font-medium tracking-widest uppercase animate-in fade-in duration-300">
              <Link href={`/${locale}/shop`} className="hover:text-ring transition-colors">Shop</Link>
              <Link href={`/${locale}/brands`} className="hover:text-ring transition-colors">Brands</Link>
              <Link href={`/${locale}/about`} className="hover:text-ring transition-colors">Our Legacy</Link>
            </nav>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex-1 flex items-center justify-end space-x-6 text-sm">
          <Link href={`/${locale === 'en' ? 'ar' : 'en'}`} className="hover:text-ring transition-colors font-medium">
            {locale === 'en' ? 'العربية' : 'EN'}
          </Link>
          
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="hover:text-ring transition-colors" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          
          <button onClick={() => setIsCartOpen(true)} className="hover:text-ring transition-colors relative" aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-ring text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Search Bar (Only shows on mobile when search is open) */}
      {isSearchOpen && (
        <div className="md:hidden p-4 border-t border-border bg-background animate-in slide-in-from-top-2 duration-300">
          <form onSubmit={handleSearch} className="flex items-center border border-border rounded-md px-3 py-2">
            <svg width="16" height="16" className="text-muted-foreground mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? "بحث..." : "Search..."}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
          </form>
        </div>
      )}
    </header>
  );
}