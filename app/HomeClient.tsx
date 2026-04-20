'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// Hapus icon-icon kategori yang lama, sisakan icon untuk navigasi bawah saja
import { Search, Home, Grid, MessageCircle } from 'lucide-react';
import ProductCard from './components/ProductCard';
import { FaWhatsapp } from 'react-icons/fa';
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

  // Fungsi Pengubah Teks Database Menjadi Gambar Asli
  const renderCategoryImage = (iconName: string | null) => {
    const foundImage = CATEGORY_IMAGE_OPTIONS.find((i) => i.name === iconName);
    const imgSrc = foundImage ? foundImage.imagePath : '/category-images/default.png';

    return (
      <img
        src={imgSrc}
        alt={iconName || 'Kategori'}
        className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110"
      />
    );
  };

  const filteredProducts = selectedCat === 'all'
    ? products
    : products.filter((p: any) => p.categoryId === selectedCat);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 500);
    return () => clearTimeout(timer);
  }, [selectedCat]);

  return (
    <>
      {/* BANNERS (Langsung muncul di bawah header) */}
      <div className="-mt-18 mb-2">
        <div className="flex gap-4 overflow-x-auto snap-x scrollbar-hide">
          {banners.map((b: any) => (
            <div key={b.id} className="snap-center shrink-0 w-full aspect-video relative">
              <Image src={b.imageUrl} alt="Promo" fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* KATEGORI (Gambar Penuh/Cover) */}
      <div className="px-6 mb-4">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide py-2">

          {/* Tombol "Semua" */}
          <button onClick={() => setSelectedCat('all')} className="flex flex-col items-center gap-2 shrink-0 group">
            {/* HAPUS padding di div ini (misal p-2), pastikan rounded sama dengan img */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all ${selectedCat === 'all' ? 'shadow-xl ring-4 ring-red-500 scale-105' : 'shadow-sm border border-gray-100'}`}>

              {/* Ubah img "Semua" juga pakai w-full h-full object-cover rounded-2xl */}
              <img
                src="/category-images/semua.jpg"
                alt="Semua"
                className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110"
              />

            </div>
            <span className={`text-[10px] font-Inter uppercase tracking-widest transition-colors ${selectedCat === 'all' ? 'text-red-600' : 'text-gray-400 group-hover:text-red-400'}`}>
              Semua
            </span>
          </button>

          {/* Looping Kategori dari Database */}
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className="flex flex-col items-center gap-2 shrink-0 group">
              {/* HAPUS padding (misal p-2 atau p-4) agar gambar menempel ke pinggir */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all ${selectedCat === cat.id ? 'shadow-xl ring-4 ring-red-500 scale-105' : 'shadow-sm border border-gray-100'}`}>

                {/* Panggil fungsi gambar yang sudah kita ubah jadi object-cover */}
                {renderCategoryImage(cat.icon)}

              </div>
              <span className={`text-[10px] font-Inter uppercase tracking-widest transition-colors ${selectedCat === cat.id ? 'text-red-600' : 'text-gray-400 group-hover:text-red-400'}`}>
                {cat.nama}
              </span>
            </button>
          ))}

        </div>
      </div>

      {/* GRID PRODUK */}
      <div className="px-6">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-Inter uppercase tracking-widest text-red-600">Mencari barang...</p>
          </div>
        ) : (
          <div className="columns-2 gap-4">
            {filteredProducts.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white backdrop-blur-xl border-t border-gray-100 px-5 py-3 flex justify-between items-center z-[50]">
        <Link href="/" className="flex flex-col items-center gap-1 text-red-600">
          <Home size={22} strokeWidth={3} />
          <span className="text-[8px] font-Inter uppercase">Home</span>
        </Link>
        <Link href="/kategori" className="flex flex-col items-center gap-1 text-gray-300">
          <Grid size={22} />
          <span className="text-[8px] font-Inter uppercase">Kategori</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-gray-300">
          <Search size={22} />
          <span className="text-[8px] font-Inter uppercase">Cari</span>
        </Link>
        <a href="https://wa.me/628123456789" className="flex flex-col items-center gap-1 text-green-500">
          <FaWhatsapp size={22} strokeWidth={3} fill="currentColor" />
          <span className="text-[8px] font-Inter uppercase">WhatsApp</span>
        </a>
      </nav>
    </>
  );
}