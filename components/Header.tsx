"use client";

import Link from "next/link";
import { useCart } from "@/features/cart/CartContext";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header({ locale }: { locale: string }) {
  const isArabic = locale === 'ar';
  const { items, setIsCartOpen } = useCart();
  const router = useRouter();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (e) {}
      setIsSearching(false);
    };
    
    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/${locale}/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };
  
  return (
    <>
    <header className="w-full border-b border-border bg-background sticky top-0 z-50">
      <div className="bg-primary text-primary-foreground text-xs text-center py-2 uppercase tracking-widest font-medium">
        {isArabic ? "توصيل مجاني في الكويت للطلبات فوق 20 دينار" : "Free Delivery in Kuwait for orders over 20 KWD"}
      </div>
      
      <div className="container mx-auto px-4 h-32 flex items-center justify-between relative">
        <div className="flex-1 flex items-center justify-start space-x-2 md:space-x-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-foreground">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <Link href={`/${locale}`}>
            <Image src="/logo-zoomed.png" alt="ABEERX" width={300} height={300} priority className="object-contain h-28 w-auto transform md:scale-110 md:origin-left" />
          </Link>
        </div>

        <div className="flex-shrink-0 hidden md:flex items-center justify-center relative w-1/3">
          {isSearchOpen ? (
            <div className="w-full relative">
              <form onSubmit={handleSearch} className="w-full flex items-center border-b border-foreground pb-1 animate-in fade-in zoom-in duration-300">
                <input 
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? "ابحث عن العطور، الماركات..." : "Search for perfumes, brands..."}
                  className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                />
                <button type="button" onClick={closeSearch} className="ml-2 text-muted-foreground hover:text-foreground">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </form>
              
              {/* Search Dropdown */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-background border border-border shadow-lg z-50">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto py-2">
                      {searchResults.map((result) => (
                        <Link 
                          href={`/${locale}/product/${result.slug}`} 
                          key={result.slug}
                          onClick={closeSearch}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-secondary transition-colors"
                        >
                          <div className="relative w-12 h-12 bg-secondary border border-border flex-shrink-0">
                            <Image src={result.image} alt={result.name} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">{result.brand}</span>
                            <span className="text-sm font-medium">{result.name}</span>
                            <span className="text-xs text-foreground mt-1">
                              {result.salePrice ? (
                                <>
                                  <span className="text-red-600 mr-2">{result.salePrice} {result.currency}</span>
                                  <span className="line-through text-muted-foreground">{result.price} {result.currency}</span>
                                </>
                              ) : (
                                <span>{result.price} {result.currency}</span>
                              )}
                            </span>
                          </div>
                        </Link>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 pb-1 px-4">
                        <button onClick={handleSearch} className="text-xs text-ring uppercase tracking-widest hover:underline w-full text-center">
                          {isArabic ? "عرض جميع النتائج" : "View All Results"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <nav className="flex space-x-12 text-sm font-medium tracking-widest uppercase animate-in fade-in duration-300">
              <Link href={`/${locale}/shop`} className="hover:text-ring transition-colors">Shop</Link>
              <Link href={`/${locale}/brands`} className="hover:text-ring transition-colors">Brands</Link>
              <Link href={`/${locale}/about`} className="hover:text-ring transition-colors">Our Legacy</Link>
            </nav>
          )}
        </div>

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
      
      {isSearchOpen && (
        <div className="md:hidden p-4 border-t border-border bg-background animate-in slide-in-from-top-2 duration-300 relative">
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
          {searchQuery.trim().length > 0 && searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-background border-b border-border shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.slice(0,4).map((result) => (
                <Link 
                  href={`/${locale}/product/${result.slug}`} 
                  key={result.slug}
                  onClick={closeSearch}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-secondary border-b border-border"
                >
                  <div className="relative w-10 h-10 bg-secondary border border-border flex-shrink-0">
                    <Image src={result.image} alt={result.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{result.name}</span>
                    <span className="text-xs text-muted-foreground">{result.brand}</span>
                  </div>
                </Link>
              ))}
              <button onClick={handleSearch} className="w-full py-3 text-xs text-ring uppercase tracking-widest hover:underline">
                {isArabic ? "عرض جميع النتائج" : "View All Results"}
              </button>
            </div>
          )}
        </div>
      )}
    
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[75%] max-w-sm h-full bg-background flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
            <div className="flex items-center justify-between px-4 h-32 border-b border-border">
            <Link href={`/${locale}`} onClick={() => setIsMobileMenuOpen(false)}>
              <Image src="/logo-zoomed.png" alt="ABEERX" width={150} height={150} priority className="object-contain h-24 w-auto transform origin-left scale-110" />
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-foreground">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <nav className="flex flex-col p-6 space-y-6 text-base font-medium tracking-widest uppercase">
            <Link href={`/${locale}/shop`} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-ring transition-colors border-b border-border pb-4">{isArabic ? "التسوق" : "Shop"}</Link>
            <Link href={`/${locale}/brands`} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-ring transition-colors border-b border-border pb-4">{isArabic ? "العلامات التجارية" : "Brands"}</Link>
            <Link href={`/${locale}/about`} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-ring transition-colors border-b border-border pb-4">{isArabic ? "تراثنا" : "Our Legacy"}</Link>
          </nav>
          <div className="p-6 mt-auto">
            <Link href={`/${locale === 'en' ? 'ar' : 'en'}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full py-4 bg-secondary hover:bg-secondary/80 transition-colors font-medium text-foreground tracking-widest uppercase rounded-md border border-border">
              {locale === 'en' ? 'العربية' : 'English'}
            </Link>
          </div>
          </div>
        </div>
      )}

    </header>
    {/* Mobile Bottom Navigation (App-like) */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 flex items-center justify-between px-2 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {/* 1. Filters (Extreme Left) */}
      <button 
        onClick={() => {
          if (typeof window !== 'undefined') {
            if (window.location.pathname.includes('/shop')) {
              window.dispatchEvent(new CustomEvent('open-mobile-filters'));
            } else {
              router.push(`/${locale}/shop?openFilters=true`);
            }
          }
        }}
        className="flex flex-col items-center justify-center flex-1 text-muted-foreground hover:text-foreground"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">{isArabic ? "تصفية" : "Filters"}</span>
      </button>

      {/* 2. Search */}
      <button 
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setIsSearchOpen(true);
        }}
        className="flex flex-col items-center justify-center flex-1 text-muted-foreground hover:text-foreground"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">{isArabic ? "بحث" : "Search"}</span>
      </button>

      {/* 3. Sort By */}
      <button 
        onClick={() => {
          if (typeof window !== 'undefined') {
            if (window.location.pathname.includes('/shop')) {
              window.dispatchEvent(new CustomEvent('open-mobile-sort'));
            } else {
              router.push(`/${locale}/shop?openSort=true`);
            }
          }
        }}
        className="flex flex-col items-center justify-center flex-1 text-muted-foreground hover:text-foreground"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
        <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">{isArabic ? "ترتيب" : "Sort By"}</span>
      </button>

      {/* 4. Cart (Extreme Right) */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center justify-center flex-1 text-muted-foreground hover:text-foreground relative"
      >
        <div className="relative">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-ring text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">{isArabic ? "السلة" : "Cart"}</span>
      </button>
    </div>
    </>
  );
}
