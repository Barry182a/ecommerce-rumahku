import { getSearchResults } from '@/src/actions/searchActions';
import Image from 'next/image';
import Link from 'next/link';
import { PackageX, Search, Home, Grid, MessageCircle } from 'lucide-react';
import SortDropdown from './SortDropdown';

// Import Header yang sudah kamu buat (Pastikan path folder importnya benar)
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
export const dynamic = 'force-dynamic';
import { FaWhatsapp } from 'react-icons/fa';

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const sortBy = searchParams?.sort || 'relevan';

  let results = [];

  if (query) {
    results = await getSearchResults(query);

    if (sortBy === 'termurah') results.sort((a, b) => a.hargaDasar - b.hargaDasar);
    else if (sortBy === 'termahal') results.sort((a, b) => b.hargaDasar - a.hargaDasar);
    else if (sortBy === 'terbaru') results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    // Tambahkan pb-24 agar konten paling bawah tidak tertutup oleh Footer Nav
    <div className="min-h-screen bg-white pb-24">

      {/* HEADER TAMPIL DI ATAS */}
      <Header title="Cari" showBack={true} showSearch={true} />

      <div className="px-6 pt-4">

        {/* STATE KETIKA BELUM MENCARI APA-APA */}
        {!query ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
              <Search size={40} className="text-gray-300" />
            </div>
            <h1 className="text-lg font-Inter text-gray-800 mb-2 uppercase tracking-wide">Cari Produk</h1>
            <p className="text-[10px] font-Inter uppercase tracking-widest text-gray-400 mb-8">Ketik nama produk di atas</p>

            <div className="flex flex-wrap justify-center gap-3">
              {['Sepatu', 'Baju', 'Tas', 'Aksesoris'].map((cat) => (
                <Link
                  key={cat}
                  href={`/search?q=${cat}`}
                  className="px-6 py-2 border border-gray-100 rounded-full text-[10px] font-black text-gray-400 hover:border-red-500 hover:text-red-600 transition-all shadow-sm uppercase tracking-wider"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* STATE KETIKA HASIL PENCARIAN MUNCUL */
          <>
            <div className="flex flex-col mb-6 gap-3">

              {results.length > 0 && (
                <SortDropdown currentSort={sortBy} query={query} />
              )}
            </div>

            {results.length > 0 ? (
              <div className="columns-2 gap-4">
                {results.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              /* JIKA PENCARIAN TIDAK DITEMUKAN */
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <PackageX size={48} className="text-gray-200 mb-6" />
                <h2 className="text-sm font-Inter text-gray-800 mb-2 uppercase tracking-wide">Produk Tidak Ditemukan!</h2>
                <p className="text-[10px] font-Inter text-gray-400 uppercase tracking-widest mb-8">Coba kata kunci lain</p>
                <Link href="/" className="px-6 py-3 bg-red-600 text-white text-[10px] font-Inter rounded-xl active:scale-95 transition-all shadow-md uppercase tracking-wider">Ke Beranda</Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER NAVIGATOR (Disalin dari HomeClient, tapi icon Cari yang nyala) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white backdrop-blur-xl border-t border-gray-100 px-5 py-3 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-300">
          <Home size={22} strokeWidth={3} />
          <span className="text-[8px] font-Inter uppercase">Home</span>
        </Link>
        <Link href="/kategori" className="flex flex-col items-center gap-1 text-gray-300">
          <Grid size={22} />
          <span className="text-[8px] font-Inter uppercase">Kategori</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-1 text-red-600">
          <Search size={22} strokeWidth={3} />
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