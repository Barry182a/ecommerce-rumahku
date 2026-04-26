'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Search, ClipboardList } from 'lucide-react';
import { pageContainer, pagePadding } from '@/src/lib/layout';
import { useEffect, useState } from 'react';

export default function FooterNav() {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isKategori = pathname === '/kategori';
  const isSearch = pathname.startsWith('/search');
  const isPesanan = pathname.startsWith('/pesanan');

  const [isMounted, setIsMounted] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  const baseClass = 'flex flex-col items-center gap-1 transition-colors';
  const inactiveClass = 'text-black/60 hover:text-black/70';
  const activeClass = 'text-red-600';

  const updateOrderCount = () => {
  try {
    const savedOrders = JSON.parse(localStorage.getItem('customer_orders') || '[]');

    if (!Array.isArray(savedOrders)) {
      setOrderCount(0);
      return;
    }

    const unfinishedOrders = savedOrders.filter((order: any) => {
      if (order?.isCompleted) return false;
      if (order?.isCanceled) return false;

      if (
        order?.paymentMethod === 'midtrans' &&
        (order?.paymentStatus === 'expired' || order?.paymentStatus === 'failed')
      ) {
        return false;
      }

      return true;
    });

    setOrderCount(unfinishedOrders.length);
  } catch {
    setOrderCount(0);
  }
};

  useEffect(() => {
    setIsMounted(true);
    updateOrderCount();

    const handleFocus = () => updateOrderCount();
    const handleStorage = () => updateOrderCount();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
          className={`${baseClass} relative ${isPesanan ? activeClass : inactiveClass}`}
        >
          {isMounted && orderCount > 0 && !isPesanan && (
            <span className="absolute bottom-full mb-2 right-0 -translate-x-2 whitespace-nowrap rounded-full bg-red-50 px-3 py-1 text-[12px] font-bold text-red-600 shadow-sm">
              Lihat pesananmu
            </span>
          )}

          <div className="relative">
            <ClipboardList size={26} strokeWidth={isPesanan ? 3 : 2.5} />

            {isMounted && orderCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold text-white">
                {orderCount > 99 ? '99+' : orderCount}
              </span>
            )}
          </div>

          <span className="text-[8px] uppercase">Pesanan</span>
        </Link>
      </div>
    </nav>
  );
}