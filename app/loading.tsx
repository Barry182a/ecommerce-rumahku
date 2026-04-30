import Header from './components/Header';
import FooterNav from './components/FooterNav';
import { pageContainer, pagePadding } from '@/src/lib/layout';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className={`${pageContainer} min-h-screen bg-white pt-0 pb-24 shadow-2xl`}>
        {/* Banner skeleton */}
        <div className="mb-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            <div className="aspect-[16/7] w-full shrink-0 animate-pulse bg-gray-200 sm:aspect-[16/6] md:aspect-[16/5]" />
          </div>
        </div>

        {/* Kategori skeleton */}
        <div className={`mb-6 ${pagePadding}`}>
          <div className="flex gap-5 overflow-x-auto py-2 scrollbar-hide">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-2">
                <div className="h-16 w-16 animate-pulse rounded-2xl bg-gray-200 sm:h-18 sm:w-18 md:h-20 md:w-20" />
                <div className="h-3 w-14 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Produk skeleton */}
        <div className={pagePadding}>
          <div className="columns-2 gap-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
                <div className="aspect-[4/5] animate-pulse bg-gray-200" />
                <div className="p-3">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>

          <div className="py-8 text-center">
            <p className="text-[10px] uppercase tracking-widest text-red-600">
              Memuat beranda...
            </p>
          </div>
        </div>
      </main>

      <FooterNav />
    </div>
  );
}