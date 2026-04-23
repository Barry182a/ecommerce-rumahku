import { prisma } from '@/src/lib/prisma';
import Header from '@/app/components/Header';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{
    orderId?: string;
    from?: string;
  }>;
}

function getPaymentMethodLabel(method: string) {
  if (method === 'midtrans') return 'Bayar Online (Midtrans)';
  if (method === 'cod') return 'COD / Bayar di Tempat';
  return method;
}

function getPaymentStatusLabel(paymentMethod: string, paymentStatus: string, from?: string) {
  if (paymentMethod === 'cod') return 'Pesanan berhasil dibuat';

  if (paymentStatus === 'paid') return 'Pembayaran berhasil';

  if (from === 'snap_success') return 'Pembayaran berhasil, sedang dikonfirmasi sistem';

  if (from === 'snap_pending') return '✅Pembayaran berhasil, sedang verifikasi';

  if (paymentStatus === 'pending') return 'Pesanan berhasil, menunggu pembayaran';

  if (paymentStatus === 'expired') return 'Pembayaran kedaluwarsa';

  if (paymentStatus === 'failed') return 'Pembayaran gagal';

  return 'Status pembayaran sedang diproses';
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId, from } = await searchParams;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="Status Pesanan" showBack={true} showSearch={false} />
        <div className="p-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h1 className="text-xl font-bold text-black">Order tidak ditemukan</h1>
            <p className="mt-2 text-sm text-gray-600">
              Nomor pesanan tidak tersedia.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderId },
  });

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="Status Pesanan" showBack={true} showSearch={false} />
        <div className="p-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h1 className="text-xl font-bold text-black">Pesanan tidak ditemukan</h1>
            <p className="mt-2 text-sm text-gray-600">
              Pesanan dengan nomor {orderId} belum tersedia atau sudah berubah.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? (order.items as any[]) : [];
  const paymentLabel = getPaymentMethodLabel(order.paymentMethod);
  const paymentStatusLabel = getPaymentStatusLabel(order.paymentMethod, order.paymentStatus, from);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Pesanan Berhasil" showBack={false} showSearch={false} />

      <div className="p-5 space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
           

            <div>
              <h1 className="text-xl font-bold text-black">{paymentStatusLabel}</h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Pesanan Anda sudah tercatat. Penjual akan segera menghubungi Anda melalui WhatsApp
                untuk konfirmasi pesanan.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-gray-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Nomor Pesanan
            </p>
            <p className="mt-1 text-sm font-bold text-gray-800">{order.orderId}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-black">Ringkasan Pesanan</h2>

          <div className="mt-4 space-y-3">
            {items.map((item: any, index: number) => (
              <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="font-bold leading-snug text-gray-800">{item.nama}</p>

                <p className="mt-1 text-sm text-gray-500">
                  {[
                    item.warna && item.warna !== 'Default' ? item.warna : null,
                    item.ukuran && item.ukuran !== 'Default' ? `Ukuran ${item.ukuran}` : null,
                    `Jumlah ${item.quantity}`,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </p>

                <p className="mt-1 text-sm font-semibold text-red-600">
                  Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-black">Informasi Pembayaran</h2>

          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Metode Pembayaran
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{paymentLabel}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Status Pembayaran
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{paymentStatusLabel}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Total
              </p>
              <p className="mt-1 text-lg font-bold text-red-600">
                Rp {order.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-green-50 p-5 shadow-sm">
          <h2 className="text-base font-bold text-green-800">Langkah Selanjutnya</h2>
          <p className="mt-2 text-sm leading-relaxed text-green-700">
            Mohon tunggu, penjual akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi
            pesanan, ketersediaan barang, dan proses pengiriman.
          </p>
        </div>

        <Link
          href="/"
          className="block rounded-2xl bg-red-600 px-5 py-4 text-center text-sm font-semibold text-white"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}