import Header from '@/app/components/Header';
import { pageContainer, pagePadding } from '@/src/lib/layout';

export default function CheckoutSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        title="Status Pesanan"
        showBack={false}
        showSearch={false}
        showWhatsapp={false}
        showCart={false}
      />

      <main className={`${pageContainer} ${pagePadding} pt-5`}>
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="mx-auto mt-5 h-8 w-52 animate-pulse rounded bg-gray-200" />
          <div className="mx-auto mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-gray-200" />
          <div className="mx-auto mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-gray-200" />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="h-14 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-14 animate-pulse rounded-2xl bg-gray-200" />
          </div>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-red-600">
            Memeriksa status pembayaran...
          </p>
        </div>
      </main>
    </div>
  );
}