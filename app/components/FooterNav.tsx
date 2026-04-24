'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Search, ClipboardList } from 'lucide-react';
import { pageContainer, pagePadding } from '@/src/lib/layout';

export default function FooterNav() {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isKategori = pathname === '/kategori';
  const isSearch = pathname.startsWith('/search');
  const isPesanan = pathname.startsWith('/pesanan');

  const baseClass = 'flex flex-col items-center gap-1 transition-colors';
  const inactiveClass = 'text-black/60 hover:text-black/70';
  const activeClass = 'text-red-600';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[50] border-t border-gray-100 bg-white backdrop-blur-xl">
      <div className={`${pageContainer} ${pagePadding} flex items-center justify-between py-3`}>
        <Link
          href="/"
          className={`${baseClass} ${isHome ? activeClass : inactiveClass}`}
        >
          <Home size={26} strokeWidth={isHome ? 3 : 2.5} />
          <span className="text-[8px] uppercase">Home</span>
        </Link>

        <Link
          href="/kategori"
          className={`${baseClass} ${isKategori ? activeClass : inactiveClass}`}
        >
          <Grid
            size={26}
            strokeWidth={isKategori ? 2.5 : 2.2}
            fill={isKategori ? 'currentColor' : 'none'}
            className={isKategori ? 'text-red-100 stroke-red-600' : ''}
          />
          <span className="text-[8px] uppercase">Kategori</span>
        </Link>

        <Link
          href="/search"
          className={`${baseClass} ${isSearch ? activeClass : inactiveClass}`}
        >
          <Search size={26} strokeWidth={isSearch ? 3 : 2.5} />
          <span className="text-[8px] uppercase">Cari</span>
        </Link>

        <Link
          href="/pesanan"
          className={`${baseClass} ${isPesanan ? activeClass : inactiveClass}`}
        >
          <ClipboardList size={26} strokeWidth={isPesanan ? 3 : 2.5} />
          <span className="text-[8px] uppercase">Pesanan</span>
        </Link>
      </div>
    </nav>
  );
}