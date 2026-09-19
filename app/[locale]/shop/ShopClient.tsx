"use client";

function getPriority(p: any) {
    const hasStock = (p.totalStock || 0) > 0;
    const hasImage = p.images && p.images.length > 0;
    if (hasStock && hasImage) return 3;
    if (hasStock && !hasImage) return 2;
    if (!hasStock && hasImage) return 1;
    return 0;
}

import { useState, useMemo, useEffect, Suspense, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Product } from "@/types/product";

function ShopContent({ products, locale }: { products: Product[], locale: string }) {
  const searchParams = useSearchParams();
  const urlBrand = searchParams.get("brand");
  const urlFamily = searchParams.get("family");
  const urlQuery = searchParams.get("q");
  const urlGender = searchParams.get("gender");
  const isArabic = locale === 'ar';

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  
  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(15);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Reset visible count when filters or search changes
  useEffect(() => {
    setVisibleCount(15);
  }, [urlBrand, urlFamily, urlQuery, urlGender, sortBy]);

  useEffect(() => {
    const handleOpenFilters = () => setIsMobileFiltersOpen(true);
    const handleOpenSort = () => setIsMobileSortOpen(true);
    window.addEventListener('open-mobile-filters', handleOpenFilters);
    window.addEventListener('open-mobile-sort', handleOpenSort);
    
    if (searchParams.get('openFilters') === 'true') setIsMobileFiltersOpen(true);
    if (searchParams.get('openSort') === 'true') setIsMobileSortOpen(true);

    return () => {
      window.removeEventListener('open-mobile-filters', handleOpenFilters);
      window.removeEventListener('open-mobile-sort', handleOpenSort);
    };
  }, [searchParams]);

  const baseProducts = useMemo(() => {
    if (!urlBrand) return products;
    return products.filter(p => p.brand?.toLowerCase() === urlBrand.toLowerCase());
  }, [products, urlBrand]);

  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(1000);
  
  useEffect(() => {
    let min = 999999;
    let max = 0;
    baseProducts.forEach(p => {
      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    });
    if (min === 999999) min = 0;
    setPriceMin(Math.floor(min));
    setPriceMax(Math.ceil(max));
  }, [baseProducts]);

  const [currentMin, setCurrentMin] = useState<number>(0);
  const [currentMax, setCurrentMax] = useState<number>(1000);

  useEffect(() => {
    setCurrentMin(priceMin);
    setCurrentMax(priceMax);
  }, [priceMin, priceMax]);

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    if (urlFamily) init.fragranceFamily = [urlFamily];
    if (urlGender) init.gender = [urlGender.charAt(0).toUpperCase() + urlGender.slice(1)];
    return init;
  });

  useEffect(() => {
    setSelectedFilters(prev => {
      const next = { ...prev };
      let changed = false;
      
      if (urlFamily && (!prev.fragranceFamily || !prev.fragranceFamily.includes(urlFamily))) {
        next.fragranceFamily = [urlFamily];
        changed = true;
      }
      
      if (urlGender) {
        const formattedGender = urlGender.charAt(0).toUpperCase() + urlGender.slice(1);
        if (!prev.gender || !prev.gender.includes(formattedGender)) {
          next.gender = [formattedGender];
          changed = true;
        }
      }
      
      return changed ? next : prev;
    });
  }, [urlFamily, urlGender]);

  const filterConfigs = [
    { key: 'gender', label: isArabic ? "الجنس" : "Gender" },
    { key: 'concentration', label: isArabic ? "التركيز" : "Concentration" },
    { key: 'size', label: isArabic ? "الحجم" : "Size" },
    { key: 'categoryId', label: isArabic ? "الفئة" : "Category" },
    { key: 'fragranceFamily', label: isArabic ? "العائلة العطرية" : "Scent Family" },
    { key: 'mainAccord', label: isArabic ? "الوتر الرئيسي" : "Main Accord" },
    { key: 'topNotes', label: isArabic ? "الافتتاحية" : "Top Notes" },
    { key: 'heartNotes', label: isArabic ? "القلب" : "Heart Notes" },
    { key: 'baseNotes', label: isArabic ? "القاعدة" : "Base Notes" },
    { key: 'occasion', label: isArabic ? "المناسبة" : "Occasion" },
    { key: 'origin', label: isArabic ? "بلد المنشأ" : "Country of Origin" },
  ];

  const handleFilterToggle = (key: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[key] || [];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const extractValues = (val: string | undefined): string[] => {
    if (!val) return [];
    return val.split(',').map(v => v.trim()).filter(Boolean);
  };

    const filteredProducts = useMemo(() => {
    const filtered = baseProducts.filter(p => {
      if (p.price < currentMin || p.price > currentMax) return false;

      for (const key of Object.keys(selectedFilters)) {
        const selectedValues = selectedFilters[key];
        if (selectedValues.length === 0) continue;

        const productVal = (p as any)[key];
        const productVals = extractValues(productVal);

        const matches = selectedValues.some(sv => productVals.includes(sv));
        if (!matches) return false;
      }
      return true;
    });
    
    // Now apply fuzzy search scoring and sort if there's a query
    if (urlQuery) {
      const query = urlQuery.toLowerCase();
      const scored = filtered.map(p => {
        let score = 0;
        const searchTarget = `${p.name} ${p.brand || ''} ${p.description || ''}`.toLowerCase();
        
        if (searchTarget.includes(query)) {
          score += 100;
        } else {
           const words = query.split(' ').filter(Boolean);
           let wordMatches = 0;
           words.forEach(w => { if (searchTarget.includes(w)) wordMatches += 1; });
           score += (wordMatches / Math.max(words.length, 1)) * 50;

           let charMatches = 0;
           for (const char of query) {
             if (searchTarget.includes(char)) charMatches += 1;
           }
           score += (charMatches / Math.max(query.length, 1)) * 10;
        }
        return { product: p, score };
      });
      
      let sorted = scored.sort((a, b) => {
        const pA = getPriority(a.product);
        const pB = getPriority(b.product);
        if (pA !== pB) return pB - pA;
        return b.score - a.score;
      }).map(s => s.product);
      if (sortBy === 'price-low') sorted = sorted.sort((a, b) => a.price - b.price);
      if (sortBy === 'price-high') sorted = sorted.sort((a, b) => b.price - a.price);
      return sorted;
    }
    
    let sorted = [...filtered];
    if (sortBy === 'price-low') {
        sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'alpha-asc') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'alpha-desc') {
        sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        sorted.sort((a, b) => {
             const pA = getPriority(a);
             const pB = getPriority(b);
             if (pA !== pB) return pB - pA;
             
             if (a.isBestSeller && !b.isBestSeller) return -1;
             if (!a.isBestSeller && b.isBestSeller) return 1;
             if (a.isFeatured && !b.isFeatured) return -1;
             if (!a.isFeatured && b.isFeatured) return 1;
             return a.name.localeCompare(b.name);
        });
    }
    return sorted;
  }, [baseProducts, selectedFilters, currentMin, currentMax, urlQuery, sortBy]);

  const filterData = useMemo(() => {
    const data: Record<string, { val: string, available: boolean }[]> = {};
    
    filterConfigs.forEach(config => {
      const allValues = new Set<string>();
      baseProducts.forEach(p => {
        extractValues((p as any)[config.key]).forEach(v => allValues.add(v));
      });

      const availableValues = new Set<string>();
      filteredProducts.forEach(p => {
        extractValues((p as any)[config.key]).forEach(v => availableValues.add(v));
      });

      data[config.key] = Array.from(allValues).sort().map(val => ({
        val,
        available: availableValues.has(val)
      }));
    });
    return data;
  }, [baseProducts, filteredProducts]);

  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 15, filteredProducts.length));
        }
      },
      { rootMargin: "400px" } // Load the next 15 when we are 400px away from the bottom
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, filteredProducts.length]);

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      
      {/* Mobile Sort Modal */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex justify-end">
          <div className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in duration-300" onClick={() => setIsMobileSortOpen(false)}></div>
          <div className="relative w-[75%] h-full bg-background flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-serif text-xl">{isArabic ? "الترتيب" : "Sort By"}</h2>
            <button onClick={() => setIsMobileSortOpen(false)} className="p-2 text-foreground">
               <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <button onClick={() => { setSortBy('recommended'); setIsMobileSortOpen(false); }} className={`w-full text-left p-4 border ${sortBy === 'recommended' ? 'border-ring text-ring' : 'border-border'}`}>
              {isArabic ? "موصى به" : "Recommended"}
            </button>
            <button onClick={() => { setSortBy('price-low'); setIsMobileSortOpen(false); }} className={`w-full text-left p-4 border ${sortBy === 'price-low' ? 'border-ring text-ring' : 'border-border'}`}>
              {isArabic ? "السعر: من الأقل للأعلى" : "Price: Low to High"}
            </button>
            <button onClick={() => { setSortBy('price-high'); setIsMobileSortOpen(false); }} className={`w-full text-left p-4 border ${sortBy === 'price-high' ? 'border-ring text-ring' : 'border-border'}`}>
              {isArabic ? "السعر: من الأعلى للأقل" : "Price: High to Low"}
            </button>
            <button onClick={() => { setSortBy('alpha-asc'); setIsMobileSortOpen(false); }} className={`w-full text-left p-4 border ${sortBy === 'alpha-asc' ? 'border-ring text-ring' : 'border-border'}`}>
              {isArabic ? "أبجديًا: أ - ي" : "Alphabetical: A to Z"}
            </button>
            <button onClick={() => { setSortBy('alpha-desc'); setIsMobileSortOpen(false); }} className={`w-full text-left p-4 border ${sortBy === 'alpha-desc' ? 'border-ring text-ring' : 'border-border'}`}>
              {isArabic ? "أبجديًا: ي - أ" : "Alphabetical: Z to A"}
            </button>
          </div>
          </div>
          </div>
        )}

        {/* Mobile Filters Backdrop */}
        {isMobileFiltersOpen && (
          <div className="md:hidden fixed inset-0 z-[90] bg-black/50 animate-in fade-in duration-300" onClick={() => setIsMobileFiltersOpen(false)}></div>
        )}
        <aside className={`
          fixed top-0 bottom-0 left-0 w-[75%] z-[100] bg-background flex flex-col transition-transform duration-300 md:relative md:z-auto md:translate-y-0 md:translate-x-0 md:w-64 md:flex-shrink-0 md:block
          ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-serif text-xl">{isArabic ? "تصفية" : "Filters"}</h2>
          <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-foreground">
             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-0 md:overflow-visible">
          <div className="hidden md:flex justify-between items-center mb-6 border-b border-border pb-2">
          <h2 className="font-serif text-xl text-foreground">
            {isArabic ? "تصفية" : "Filter"}
          </h2>
          <button 
            onClick={() => { setSelectedFilters({}); setCurrentMin(priceMin); setCurrentMax(priceMax); }}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            {isArabic ? "مسح" : "Clear All"}
          </button>
        </div>
        
        <div className="space-y-8">
          <div>
            <h3 className="font-medium mb-4 text-sm tracking-wider uppercase text-foreground">
              {isArabic ? "السعر (د.ك)" : "Sale Price (KWD)"}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="number" 
                min={priceMin} max={currentMax} 
                value={currentMin} 
                onChange={e => setCurrentMin(Number(e.target.value))}
                className="w-full bg-secondary border border-border p-2 text-sm"
              />
              <span className="text-muted-foreground">-</span>
              <input 
                type="number" 
                min={currentMin} max={priceMax} 
                value={currentMax} 
                onChange={e => setCurrentMax(Number(e.target.value))}
                className="w-full bg-secondary border border-border p-2 text-sm"
              />
            </div>
            <div className="relative w-full h-1 bg-border rounded mt-6 mb-6">
                <div 
                  className="absolute h-full bg-ring rounded" 
                  style={{ 
                    left: `${Math.max(0, Math.min(100, ((currentMin - priceMin) / (priceMax - priceMin)) * 100))}%`,
                    right: `${Math.max(0, Math.min(100, 100 - ((currentMax - priceMin) / (priceMax - priceMin)) * 100))}%` 
                  }}
                ></div>
                <input 
                  type="range" 
                  min={priceMin} 
                  max={priceMax} 
                  value={currentMin} 
                  onChange={e => setCurrentMin(Math.min(Number(e.target.value), currentMax - 1))}
                  className="absolute w-full -top-1.5 h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-ring [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-ring [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                />
                <input 
                  type="range" 
                  min={priceMin} 
                  max={priceMax} 
                  value={currentMax} 
                  onChange={e => setCurrentMax(Math.max(Number(e.target.value), currentMin + 1))}
                  className="absolute w-full -top-1.5 h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-ring [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-ring [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>
          </div>

          {filterConfigs.map(config => {
            const options = filterData[config.key];
            if (!options || options.length === 0) return null;

            return (
              <div key={config.key}>
                <h3 className="font-medium mb-3 text-sm tracking-wider uppercase text-foreground">{config.label}</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {options.map(opt => (
                    <label 
                      key={opt.val} 
                      className={`flex items-center space-x-2 text-sm cursor-pointer transition-colors ${
                        opt.available ? 'text-foreground' : 'text-muted-foreground opacity-40'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedFilters[config.key]?.includes(opt.val) || false}
                        onChange={() => handleFilterToggle(config.key, opt.val)}
                        disabled={!opt.available && !(selectedFilters[config.key]?.includes(opt.val))}
                        className="rounded border-border text-ring focus:ring-ring" 
                      />
                      <span>{opt.val}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </aside>

      <div className="flex-grow">
        <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-serif text-foreground capitalize">
                {urlBrand ? urlBrand : (isArabic ? "جميع العطور" : "All Fragrances")}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{filteredProducts.length} {isArabic ? "نتيجة" : "Results"}</p>
            </div>
            {/* Desktop Sort */}
            <div className="hidden md:block">
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent border border-border text-sm p-2 outline-none focus:border-ring"
              >
                <option value="recommended">{isArabic ? "موصى به" : "Recommended"}</option>
                <option value="price-low">{isArabic ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</option>
                <option value="price-high">{isArabic ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
                <option value="alpha-asc">{isArabic ? "أبجديًا: أ - ي" : "Alphabetical: A to Z"}</option>
                <option value="alpha-desc">{isArabic ? "أبجديًا: ي - أ" : "Alphabetical: Z to A"}</option>
              </select>
            </div>
          </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            No products match your selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.slice(0, visibleCount).map(product => (
              <div key={product.id} className="group flex flex-col bg-card p-4 hover:shadow-lg transition-shadow border border-border">
                <div className="relative aspect-square bg-secondary mb-4 overflow-hidden border border-border/50">
                  <Image 
                    src={product.images[0] || '/placeholder.jpg'} 
                    alt={product.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {product.discountPercentage ? (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1 z-10">
                      -{product.discountPercentage}% OFF
                    </span>
                  ) : null}
                </div>
                <div className="flex-grow flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{product.brand}</span>
                  <Link href={`/${locale}/product/${product.slug}`} className="text-lg font-serif mb-2 group-hover:text-ring transition-colors line-clamp-1 text-foreground">
                    {product.name}
                  </Link>
                  <div className="mt-auto flex items-center justify-between text-foreground">
                    <div>
                      {product.salePrice ? (
                        <>
                          <span className="font-medium text-red-600 mr-2">{product.salePrice.toFixed(2)} {product.currency}</span>
                          <span className="text-sm text-muted-foreground line-through">{product.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="font-medium">{product.price.toFixed(2)} {product.currency}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Infinite Scroll Observer Target */}
        {filteredProducts.length > visibleCount && (
          <div ref={observerTarget} className="w-full h-20 flex items-center justify-center mt-8">
             <div className="w-6 h-6 border-2 border-ring border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopClient({ products, locale }: { products: Product[], locale: string }) {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent products={products} locale={locale} />
    </Suspense>
  );
}