'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/src/context/CartContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { createOrder } from '@/src/actions/createOrder';
import Header from '@/app/components/Header';
import Script from 'next/script';
import { createMidtransOrder } from '@/src/actions/createMidtransOrder';

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    noHp: '',
    alamat: '',
    paymentMethod: 'cod' as 'cod' | 'midtrans',
  });
  // subtotal
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.harga * item.quantity,
    0
  );
  const isFormValid =
    formData.nama.trim() !== '' &&
    formData.noHp.trim() !== '' &&
    formData.alamat.trim() !== '';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const handleSubmit = async () => {
    if (!isFormValid) {
      alert('Mohon lengkapi semua data pemesan!');
      return;
    }

    setIsSubmitting(true);

    try {
      if (formData.paymentMethod === 'cod') {
        const order = await createOrder({
          nama: formData.nama,
          noHp: formData.noHp,
          alamat: formData.alamat,
          paymentMethod: 'cod',
          items: checkoutItems,
          total: subtotal,
        });

        let message = `🛒 *PESANAN BARU*\n\n`;
        message += `Order ID: ${order.orderId}\n\n`;
        message += `Nama: ${formData.nama}\n`;
        message += `No HP: ${formData.noHp}\n`;
        message += `Alamat: ${formData.alamat}\n\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `Daftar Barang:\n\n`;

        checkoutItems.forEach((item, i) => {
          message += `${i + 1}. ${item.nama}\n`;
          message += `Kode: ${item.kodeVarian}\n`;
          message += `${item.warna} - ${item.ukuran} x${item.quantity}\n\n`;
        });

        message += `Total: Rp ${subtotal.toLocaleString('id-ID')}\n\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `Metode Bayar: COD\n\n`;
        message += `Terima kasih 🙏`;

        const waUrl = `https://wa.me/6281998183644?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        clearCart();
        router.push('/');
        return;
      }

      const transaction = await createMidtransOrder({
        nama: formData.nama,
        noHp: formData.noHp,
        alamat: formData.alamat,
        items: checkoutItems,
        total: subtotal,
      });

      // @ts-ignore
      window.snap.pay(transaction.token, {
        onSuccess: function () {
          clearCart();
          router.push('/');
        },
        onPending: function () {
          router.push('/');
        },
        onError: function () {
          alert('Pembayaran gagal diproses.');
        },
        onClose: function () {
          alert('Kamu menutup popup pembayaran sebelum menyelesaikan transaksi.');
        },
      });
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan!');
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    if (isClient && cartItems.length === 0) {
      router.push('/');
    }
  }, [isClient, cartItems.length, router]);
  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    const savedCheckout = localStorage.getItem('checkoutCart');

    if (savedCheckout) {
      const parsed = JSON.parse(savedCheckout);
      setCheckoutItems(parsed);
      localStorage.removeItem('checkoutCart');
    } else if (cartItems.length > 0) {
      setCheckoutItems(cartItems);
    }
  }, [cartItems]);
  if (!isClient) return null;
  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Keranjang kosong...
      </div>
    );
  }
  <Script
    src={
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js'
    }
    data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
    strategy="afterInteractive"
  />
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-32">
        {/* Header */}
        <Header title="Checkout" showBack={true} showSearch={false} />

        <form onSubmit={handleSubmit} className="p-5 space-y-8">
          {/* DATA PEMESAN */}
          <div className="bg-white rounded-3xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">Data Pemesan</h2>

            <input
              type="text"
              name="nama"
              placeholder="Nama"
              value={formData.nama}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all"
            />

            <input
              type="text"
              name="noHp"
              placeholder="No HP"
              value={formData.noHp}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all"
            />

            <textarea
              name="alamat"
              placeholder="Alamat"
              value={formData.alamat}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all"
            />
          </div>

          {/* RINGKASAN */}
          <div className="bg-white rounded-3xl p-6">
            <h2 className="font-semibold text-lg mb-4">
              Ringkasan Pesanan
            </h2>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <Image
                      src={item.foto}
                      alt={item.nama}
                      sizes="100vw"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <p className="font-medium line-clamp-1">{item.nama}</p>

                    {/* Teks Varian Dinamis */}
                    <p className="text-sm text-gray-500 mt-1">
                      {[
                        item.warna ? item.warna : null,
                        item.ukuran ? `Ukuran ${item.ukuran}` : null,
                        `Jumlah ${item.quantity}`
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>

                    {/* TAMBAHAN DI SINI: Harga Varian (Warna text-red-600, ukuran text-sm sama seperti varian) */}
                    <p className="text-sm text-red-600 mt-0.5">
                      Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                    </p>

                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-4 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-red-600">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* METODE BAYAR */}
          <div className="bg-white rounded-3xl p-6">
            <h2 className="font-semibold text-lg mb-4">Metode Pembayaran</h2>

            <div className="space-y-4">

              {/* COD */}
              <label
                className={`flex gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'cod'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200'
                  }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleChange}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">COD (Cash on Delivery)</p>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Bayar saat barang diterima
                  </p>
                </div>
              </label>

              <label
                className={`flex gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'midtrans'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-300'
                  }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="midtrans"
                  checked={formData.paymentMethod === 'midtrans'}
                  onChange={handleChange}
                />
                <div>
                  <p className="font-medium">Bayar Online</p>
                  <p className="text-xs text-gray-500">
                    Midtrans (QRIS, VA, E-Wallet, Kartu, dll)
                  </p>
                </div>
              </label>

            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-3 rounded-2xl font-semibold shadow-md active:scale-95 transition-all"
          >
            {isSubmitting ? '⏳ Memproses...' : 'Pesan Sekarang'}
          </button>
        </div>
      </div>
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl text-center">
            {!showSuccess ? (
              <p className="text-lg font-semibold">Memproses pesanan...</p>
            ) : (
              <>
                <div className="text-4xl mb-2">✅</div>
                <p className="text-lg font-semibold">Pesanan berhasil!</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}