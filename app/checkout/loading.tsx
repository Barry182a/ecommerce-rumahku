import Header from '@/app/components/Header';
import { pageContainer, pagePadding } from '@/src/lib/layout';

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header
        title="Checkout"
        showBack={false}
        showSearch={false}
        showWhatsapp={true}
        showCart={false}
      />

      <main className={`${pageContainer} ${pagePadding} pt-5`}>
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-7">
            <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-2xl bg-gray-200" />
              <div className="h-12 animate-pulse rounded-2xl bg-gray-200" />
              <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-7">
            <div className="mb-4 h-6 w-44 animate-pulse rounded bg-gray-200" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 sm:gap-4">
                  <div className="h-16 w-16 animate-pulse rounded-xl bg-gray-200 sm:h-20 sm:w-20" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-7">
            <div className="mb-4 h-6 w-44 animate-pulse rounded bg-gray-200" />
            <div className="space-y-4">
              <div className="h-20 animate-pulse rounded-2xl bg-gray-200" />
              <div className="h-20 animate-pulse rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white">
        <div className={`${pageContainer} ${pagePadding} py-3`}>
          <div className="h-12 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}