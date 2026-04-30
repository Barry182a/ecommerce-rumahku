import Header from '@/app/components/Header';
import { pageContainer, pagePadding } from '@/src/lib/layout';

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header
        title="Detail Produk"
        showBack={false}
        showSearch={false}
        showWhatsapp={false}
        showCart={true}
      />

      <main className={`${pageContainer} bg-white`}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-white">
            <div className="relative aspect-[4/4] animate-pulse bg-gray-200" />

            <div className="bg-white px-4 pb-3 pt-4 sm:px-5 md:px-6">
              <div className="flex gap-3 overflow-x-auto pb-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 w-20 flex-shrink-0 animate-pulse rounded-xl bg-gray-200"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 bg-gray-50">
            <div className="bg-white p-4 sm:p-5 md:p-6">
              <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-8 w-40 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-4 w-28 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="space-y-6 bg-white p-4 sm:p-5 md:p-6">
              <div>
                <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 w-24 animate-pulse rounded-2xl bg-gray-200"
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 w-20 animate-pulse rounded-2xl bg-gray-200"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 md:p-6">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-4/6 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white">
        <div className={`${pageContainer} ${pagePadding} flex items-center justify-between gap-4 py-3`}>
          <div className="flex-1">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-6 w-28 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="h-12 min-w-[150px] animate-pulse rounded-xl bg-gray-200 sm:min-w-[180px]" />
        </div>
      </div>
    </div>
  );
}