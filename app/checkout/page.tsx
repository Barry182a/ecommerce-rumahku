'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/src/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Script from 'next/script';
import { createOrder } from '@/src/actions/createOrder';
import { createMidtransOrder } from '@/src/actions/createMidtransOrder';
import { pageContainer, pagePadding } from '@/src/lib/layout';

const formatSizeLabel = (size?: string) => String(size || '').trim().toUpperCase();
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

  const saveOrderToBrowser = (payload: {
    orderId: string;
    paymentMethod: 'cod' | 'midtrans';
    paymentStatus: string;
    items: any[];
    totalAmount: number;
    midtransRedirectUrl?: string | null;
  }) => {
    const existing = JSON.parse(localStorage.getItem('customer_orders') || '[]');

    const newOrder = {
      orderId: payload.orderId,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
      items: payload.items,
      totalAmount: payload.totalAmount,
      midtransRedirectUrl: payload.midtransRedirectUrl || null,
      createdAt: new Date().toISOString(),
    };

    const merged = [newOrder, ...existing.filter((o: any) => o.orderId !== payload.orderId)];
    localStorage.setItem('customer_orders', JSON.stringify(merged));
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

        saveOrderToBrowser({
          orderId: order.orderId,
          paymentMethod: 'cod',
          paymentStatus: order.paymentStatus || 'pending',
          items: Array.isArray(order.items) ? order.items : checkoutItems,
          totalAmount: order.totalAmount || subtotal,
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

      saveOrderToBrowser({
        orderId: transaction.orderId,
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        items: checkoutItems,
        totalAmount: subtotal,
        midtransRedirectUrl: transaction.redirectUrl || null,
      });

      saveOrderToBrowser({
        orderId: transaction.orderId,
        paymentMethod: 'midtrans',
        paymentStatus: 'pending',
        items: checkoutItems,
        totalAmount: subtotal,
        midtransRedirectUrl: transaction.redirectUrl || null,
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
          setIsSubmitting(false);
          alert('Pembayaran belum selesai. Silakan scan QR atau selesaikan pembayaran Anda.');
        },
        onError: function () {
          setIsSubmitting(false);
          alert('Pembayaran gagal atau belum bisa diproses.');
        },
        onClose: function () {
          setIsSubmitting(false);
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
    if (!isClient) return;
    if (isRedirectingToSuccess) return;

    if (checkoutItems.length === 0) {
      router.push('/');
    }
  }, [isClient, checkoutItems.length, isRedirectingToSuccess, router]);

  if (!isClient) return null;

  if (checkoutItems.length === 0 && !isRedirectingToSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
        <Header title="Checkout" showBack={true} showSearch={false} showWhatsapp={true} showCart={false} />

        <main className={`${pageContainer} ${pagePadding} pt-5`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-7">
              <h2 className="mb-4 text-lg font-semibold">Data Pemesan</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  name="nama"
                  placeholder="Nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-200"
                />

                <input
                  type="text"
                  name="noHp"
                  placeholder="No HP"
                  value={formData.noHp}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-200"
                />

                <textarea
                  name="alamat"
                  placeholder="Alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  className="min-h-[120px] w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition-all focus:border-red-600 focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-7">
              <h2 className="mb-4 text-lg font-semibold">Ringkasan Pesanan</h2>

              <div className="space-y-4">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 sm:gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                      <Image
                        src={item.foto}
                        alt={item.nama}
                        sizes="80px"
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium">{item.nama}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {[
                          item.warna ? item.warna : null,
                          item.ukuran ? `Ukuran ${formatSizeLabel(item.ukuran)}` : null,
                          `Jumlah ${item.quantity}`,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      <p className="mt-1 text-sm text-red-600">
                        Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between border-t pt-4 text-base font-bold sm:text-lg">
                <span>Total</span>
                <span className="text-red-600">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-7">
              <h2 className="mb-4 text-lg font-semibold">Metode Pembayaran</h2>

              <div className="space-y-4">
                <label
                  className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-all ${formData.paymentMethod === 'cod'
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
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Rekomendasi
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Bayar saat barang diterima
                    </p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all ${formData.paymentMethod === 'midtrans'
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
                      Midtrans (QRIS, VA, E-Wallet, dll)
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white">
          <div className={`${pageContainer} ${pagePadding} py-3`}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (formData.paymentMethod === 'midtrans' && !snapReady)}
              className="w-full rounded-2xl bg-red-600 py-3 font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? '⏳ Memproses...' : 'Pesan Sekarang'}
            </button>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="text-lg font-semibold">Memproses pesanan...</p>
          </div>
        </div>
      )}
    </>
  );
}