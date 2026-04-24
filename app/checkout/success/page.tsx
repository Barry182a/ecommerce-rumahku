import { prisma } from '@/src/lib/prisma';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { pageContainer, pagePadding } from '@/src/lib/layout';

interface Props {
  searchParams: Promise<{
    orderId?: string;
    from?: string;
  }>;
}

function getSuccessTitle(paymentMethod: string, paymentStatus: string) {
  if (paymentMethod === 'cod') return 'Pesanan berhasil dibuat';
  if (paymentStatus === 'paid') return 'Pembayaran berhasil';
  return 'Pesanan berhasil dibuat';
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header
          title="Status Pesanan"
          showBack={true}
          showSearch={false}
          showWhatsapp={false}
          showCart={false}
        />

        <main className={`${pageContainer} ${pagePadding} pt-5`}>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-black">Pesanan tidak ditemukan</h1>
            <p className="mt-2 text-sm text-gray-600">
              Data pesanan tidak tersedia.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderId },
    select: {
      orderId: true,
      paymentMethod: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header
          title="Status Pesanan"
          showBack={true}
          showSearch={false}
          showWhatsapp={false}
          showCart={false}
        />

        <main className={`${pageContainer} ${pagePadding} pt-5`}>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-black">Pesanan tidak ditemukan</h1>
            <p className="mt-2 text-sm text-gray-600">
              Pesanan belum tersedia atau sudah berubah.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (order.paymentMethod === 'midtrans' && order.paymentStatus !== 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header
          title="Status Pembayaran"
          showBack={true}
          showSearch={false}
          showWhatsapp={false}
          showCart={false}
        />

        <main className={`${pageContainer} ${pagePadding} pt-5`}>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-black">Pembayaran belum berhasil</h1>
            <p className="mt-2 text-sm text-gray-600">
              Pembayaran Anda belum selesai atau belum terkonfirmasi sistem.
            </p>

            <Link
              href="/pesanan"
              className="mt-5 inline-flex rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Lihat Pesanan
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const successTitle = getSuccessTitle(order.paymentMethod, order.paymentStatus);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        title="Pesanan Berhasil"
        showBack={false}
        showSearch={false}
        showWhatsapp={false}
        showCart={false}
      />

      <main className={`${pageContainer} ${pagePadding} pt-5`}>
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✅
          </div>

          <h1 className="mt-5 text-2xl font-bold text-black">
            {successTitle}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            Informasi pesanan Anda sudah tersimpan. Penjual akan segera menghubungi
            Anda melalui WhatsApp untuk konfirmasi pesanan.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/pesanan"
              className="rounded-2xl border border-gray-200 px-5 py-4 text-center text-sm font-semibold text-gray-700"
            >
              Lihat Pesanan
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-red-600 px-5 py-4 text-center text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}