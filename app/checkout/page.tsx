'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/src/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Script from 'next/script';
import { createOrder } from '@/src/actions/createOrder';
import { createMidtransOrder } from '@/src/actions/createMidtransOrder';

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [isRedirectingToSuccess, setIsRedirectingToSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    noHp: '',
    alamat: '',
    paymentMethod: 'cod' as 'cod' | 'midtrans',
  });

  const subtotal = checkoutItems.reduce(
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
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const goToSuccessPage = (orderId: string, extraQuery = '') => {
    setIsRedirectingToSuccess(true);
    clearCart();
    router.push(`/checkout/success?orderId=${orderId}${extraQuery}`);
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      alert('Mohon lengkapi semua data pemesan!');
      return;
    }

    if (checkoutItems.length === 0) {
      alert('Keranjang checkout kosong.');
      return;
    }

    if (
      formData.paymentMethod === 'midtrans' &&
      (typeof window === 'undefined' || !window.snap)
    ) {
      alert('Midtrans Snap belum siap. Coba reload halaman sebentar lagi.');
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

        goToSuccessPage(order.orderId);
        return;
      }

      const transaction = await createMidtransOrder({
        nama: formData.nama,
        noHp: formData.noHp,
        alamat: formData.alamat,
        items: checkoutItems,
        total: subtotal,
      });

      if (!transaction?.token || !transaction?.orderId) {
        throw new Error('Gagal membuat transaksi Midtrans.');
      }

      if (!window.snap) {
        throw new Error('Midtrans Snap tidak tersedia di browser.');
      }

      window.snap.pay(transaction.token, {
        onSuccess: function () {
          clearCart();
          goToSuccessPage(transaction.orderId, '&from=snap_success');
        },
        onPending: function () {
          clearCart();
          goToSuccessPage(transaction.orderId, '&from=snap_pending');
        },
        onError: function () {
          setIsSubmitting(false);
          goToSuccessPage(transaction.orderId, '&from=snap_error');
        },
        onClose: function () {
          setIsSubmitting(false);
          console.log('Popup Midtrans ditutup oleh user');
        },
      });
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan!');
      setIsSubmitting(false);
    }
  };

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

  useEffect(() => {
    if (!isClient) return;

    const checkSnap = () => {
      if (typeof window !== 'undefined' && window.snap) {
        setSnapReady(true);
        return true;
      }
      return false;
    };

    if (checkSnap()) return;

    const interval = setInterval(() => {
      if (checkSnap()) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isClient]);

  useEffect(() => {
    console.log('MIDTRANS CLIENT KEY:', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (isRedirectingToSuccess) return;

    if (checkoutItems.length === 0) {
      router.push('/');
    }
  }, [isClient, checkoutItems.length, isRedirectingToSuccess, router]);

  if (!isClient) return null;

  if (checkoutItems.length === 0 && !isRedirectingToSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Keranjang kosong...
      </div>
    );
  }

  return (
    <>
      <Script
        id="midtrans-snap"
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Midtrans script loaded');
          if (window.snap) {
            setSnapReady(true);
          }
        }}
        onError={() => {
          console.error('Gagal memuat Midtrans Snap script');
          setSnapReady(false);
        }}
      />

      <div className="min-h-screen bg-gray-50 pb-32">
        <Header title="Checkout" showBack={true} showSearch={false} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="p-5 space-y-8"
        >
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

          <div className="bg-white rounded-3xl p-6">
            <h2 className="font-semibold text-lg mb-4">Ringkasan Pesanan</h2>

            <div className="space-y-4">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <Image
                      src={item.foto}
                      alt={item.nama}
                      sizes="64px"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <p className="font-medium line-clamp-1">{item.nama}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {[
                        item.warna ? item.warna : null,
                        item.ukuran ? `Ukuran ${item.ukuran}` : null,
                        `Jumlah ${item.quantity}`,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
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

          <div className="bg-white rounded-3xl p-6">
            <h2 className="font-semibold text-lg mb-4">Metode Pembayaran</h2>

            <div className="space-y-4">
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

        <div className="fixed bottom-0 left-0 right-0 bg-white p-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-3 rounded-2xl font-semibold shadow-md active:scale-95 transition-all disabled:opacity-60"
          >
            {isSubmitting ? '⏳ Memproses...' : 'Pesan Sekarang'}
          </button>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl text-center">
            <p className="text-lg font-semibold">Memproses pesanan...</p>
          </div>
        </div>
      )}
    </>
  );
}