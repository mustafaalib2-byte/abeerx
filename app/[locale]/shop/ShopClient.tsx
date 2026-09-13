"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
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
      
      return scored.sort((a, b) => b.score - a.score).map(s => s.product);
    }
    
    return filtered;
  }, [baseProducts, selectedFilters, currentMin, currentMax, urlQuery]);

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

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
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
            <input 
              type="range" 
              min={priceMin} 
              max={priceMax} 
              value={currentMax} 
              onChange={e => setCurrentMax(Number(e.target.value))}
              className="w-full accent-ring"
            />
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
      </aside>

      <div className="flex-grow">
        <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-serif text-foreground capitalize">
              {urlBrand ? urlBrand : (isArabic ? "جميع العطور" : "All Fragrances")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{filteredProducts.length} Results</p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            No products match your selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => (
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