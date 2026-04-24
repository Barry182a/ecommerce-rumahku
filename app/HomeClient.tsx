'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProductCard from './components/ProductCard';
import FooterNav from './components/FooterNav';
import { pagePadding } from '@/src/lib/layout';

const CATEGORY_IMAGE_OPTIONS = [
  { name: 'Shirt', imagePath: '/category-images/baju.jpg' },
  { name: 'ShoppingBag', imagePath: '/category-images/tas.jpg' },
  { name: 'Home', imagePath: '/category-images/perabotan.png' },
  { name: 'Book', imagePath: '/category-images/buku.jpg' },
  { name: 'Cloth', imagePath: '/category-images/pakaian-wanita.webp' },
];

export default function HomeClient({ banners, categories, products }: any) {
  const [selectedCat, setSelectedCat] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  const renderCategoryImage = (iconName: string | null) => {
    const foundImage = CATEGORY_IMAGE_OPTIONS.find((i) => i.name === iconName);
    const imgSrc = foundImage ? foundImage.imagePath : '/category-images/default.png';

    return (
      <img
        src={imgSrc}
        alt={iconName || 'Kategori'}
        className="h-full w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-110"
      />
    );
  };

  const filteredProducts =
    selectedCat === 'all'
      ? products
      : products.filter((p: any) => p.categoryId === selectedCat);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 500);
    return () => clearTimeout(timer);
  }, [selectedCat]);

  return (
    <>
      {/* BANNERS */}
      <div className="mb-4">
        <div className="flex snap-x gap-4 overflow-x-auto scrollbar-hide">
          {banners.map((b: any) => (
            <div
              key={b.id}
              className="relative aspect-[16/7] w-full shrink-0 snap-center overflow-hidden sm:aspect-[16/6] md:aspect-[16/5]"
            >
              <Image src={b.imageUrl} alt="Promo" fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* KATEGORI */}
      <div className={`mb-6 ${pagePadding}`}>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide py-2">
          <button
            onClick={() => setSelectedCat('all')}
            className="group flex shrink-0 flex-col items-center gap-2"
          >
            <div
              className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl transition-all sm:h-18 sm:w-18 md:h-20 md:w-20 ${selectedCat === 'all'
                ? 'scale-105 ring-4 ring-red-500 shadow-xl'
                : 'border border-gray-100 shadow-sm'
                }`}
            >
              <img
                src="/category-images/semua.jpg"
                alt="Semua"
                className="h-full w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest transition-colors ${selectedCat === 'all'
                ? 'text-red-600'
                : 'text-black group-hover:text-red-400'
                }`}
            >
              Semua
            </span>
          </button>

          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className="group flex shrink-0 flex-col items-center gap-2"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl transition-all sm:h-18 sm:w-18 md:h-20 md:w-20 ${selectedCat === cat.id
                  ? 'scale-105 ring-4 ring-red-500 shadow-xl'
                  : 'border border-gray-100 shadow-sm'
                  }`}
              >
                {renderCategoryImage(cat.icon)}
              </div>
              <span
                className={`text-[10px] uppercase tracking-widest transition-colors ${selectedCat === cat.id
                  ? 'text-red-600'
                  : 'text-black group-hover:text-red-400'
                  }`}
              >
                {cat.nama}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* GRID PRODUK */}
      <div className={pagePadding}>
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
            <p className="text-[10px] uppercase tracking-widest text-red-600">
              Mencari barang...
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
            {filteredProducts.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATOR */}
      <FooterNav />
    </>
  );
}