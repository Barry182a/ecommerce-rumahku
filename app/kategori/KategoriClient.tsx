'use client';

import Link from 'next/link';
// Hapus import ArrowLeft karena kita sudah tidak pakai header manual
import { Search, Home, Grid, MessageCircle } from 'lucide-react';
// Import komponen Header-mu (Sesuaikan path ini jika komponenmu ada di folder src/components)
import Header from '../components/Header'; 
import { FaWhatsapp } from 'react-icons/fa';

// Daftar pemetaan gambar
const CATEGORY_IMAGE_OPTIONS = [
  { name: 'Shirt', imagePath: '/category-images/baju.jpg' },
  { name: 'ShoppingBag', imagePath: '/category-images/tas.jpg' },
  { name: 'Home', imagePath: '/category-images/perabotan.png' },
  { name: 'Book', imagePath: '/category-images/buku.jpg' },
  { name: 'Cloth', imagePath: '/category-images/pakaian-wanita.webp' },
];

export default function KategoriClient({ categories }: { categories: any[] }) {
  
  // Fungsi untuk mendapatkan path gambar
  const getImagePath = (iconName: string | null) => {
    const foundImage = CATEGORY_IMAGE_OPTIONS.find((i) => i.name === iconName);
    return foundImage ? foundImage.imagePath : '/category-images/default.png';
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      
      {/* 1. PANGGIL KOMPONEN HEADER DI SINI */}
      <Header title="Kategori" showBack={true} showSearch={false} />

      {/* GRID KARTU KATEGORI (Desain mirip Kartu Produk) */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {categories.map((cat) => (
            // Sementara link mengarah kembali ke home dengan membawa parameter kategori
            <Link href={`/?cat=${cat.id}`} key={cat.id} className="group flex flex-col">
              
              {/* Kotak Gambar Kategori (Aspect Ratio 4/5 seperti Produk) */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-3 shadow-sm border border-gray-100 bg-gray-50 group-hover:shadow-md transition-shadow">
                
                {/* Latar Belakang Overlay Tipis agar gambar lebih pop-up */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-100/50 to-transparent z-10 pointer-events-none"></div>
                
                <img 
                  src={getImagePath(cat.icon)} 
                  alt={cat.nama} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              </div>

              {/* Teks Nama Kategori */}
              <div className="px-1 text-center">
                <h3 className="font-Inter text-gray-500 text-xs uppercase tracking-wider group-hover:text-red-600 transition-colors">
                  {cat.nama}
                </h3>
              </div>

            </Link>
          ))}
        </div>
      </div>

      {/* FOOTER NAVIGATOR (Kategori Aktif / Merah) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white backdrop-blur-xl border-t border-gray-100 px-5 py-3 flex justify-between items-center z-[50]">
        
        {/* Tombol Home sekarang abu-abu */}
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-300 hover:text-gray-400">
          <Home size={22} strokeWidth={2.5} />
          <span className="text-[8px] font-Inter uppercase">Home</span>
        </Link>

        {/* Tombol Kategori sekarang MERAH (Aktif) */}
        <Link href="/kategori" className="flex flex-col items-center gap-1 text-red-600">
          <Grid size={22} fill="currentColor" className="text-red-100 stroke-red-600" strokeWidth={2} />
          <span className="text-[8px] font-Inter uppercase text-red-600">Kategori</span>
        </Link>

        <Link href="/search" className="flex flex-col items-center gap-1 text-gray-300 hover:text-gray-400">
          <Search size={22} strokeWidth={2.5} />
          <span className="text-[8px] font-Inter uppercase">Cari</span>
        </Link>

        <a href="https://wa.me/628123456789" className="flex flex-col items-center gap-1 text-green-500">
          <FaWhatsapp size={22} strokeWidth={3} fill="currentColor" />
          <span className="text-[8px] font-Inter uppercase">WhatsApp</span>
        </a>

      </nav>
    </div>
  );
}