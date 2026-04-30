import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { pageContainer, pagePadding } from '@/src/lib/layout';

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        title="Cari"
        showBack={false}
        showSearch={true}
        showWhatsapp={true}
        showCart={true}
      />

      <main className={`${pageContainer} bg-white ${pagePadding} pt-4`}>
        <div className="mb-6 flex flex-col gap-3">
          <div className="h-10 w-44 animate-pulse rounded-xl bg-gray-200" />
        </div>

        <div className="columns-2 gap-4 pb-6 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200"
            >
              <div className="aspect-[4/5] animate-pulse bg-gray-200" />
              <div className="p-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        <div className="py-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-red-600">
            Menyiapkan hasil pencarian...
          </p>
        </div>
      </main>

      <FooterNav />
    </div>
  );
}