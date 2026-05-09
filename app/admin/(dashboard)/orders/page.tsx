'use client';
import { useState, useEffect } from 'react';
import { updateOrderStatus } from '@/src/actions/updateOrderStatus';


function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const setupPushNotification = async () => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (!('PushManager' in window)) return;
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/sw.js');

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY!
        ),
      });
    }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  };

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => setOrders(data));
  };

  useEffect(() => {
    fetchOrders();
    setupPushNotification();
  }, []);

  const handleAction = async (status: 'COMPLETED' | 'CANCELLED') => {
    if (!selectedOrder) return;
    setLoading(true);

    try {
      const res = await updateOrderStatus(selectedOrder.id, status);

      // TypeScript sekarang yakin 'res' punya properti 'success'
      if (res.success) {
        // Pastikan state setSuccessMessage sudah kamu buat di atas
        // Jika belum, hapus baris ini agar tidak error
        setSuccessMessage?.(res.message);

        alert(`Pesanan berhasil di-${status === 'COMPLETED' ? 'Selesaikan' : 'Batalkan'}`);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(res.message || 'Gagal memperbarui pesanan');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false); // PERBAIKAN: Ubah ke false agar tombol bisa diklik lagi
      setSelectedOrder(null);
    }
  };
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'expired':
        return 'bg-orange-100 text-orange-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getOrderStatusText = (order: any) => {
    if (order.isCanceled) return 'pesanan batal';
    if (order.isCompleted) return 'pesanan selesai';
    return order.paymentStatus || 'pending';
  };

  const canCompleteOrder = (order: any) => {
    if (!order) return false;
    if (order.isCompleted || order.isCanceled) return false;

    if (order.paymentMethod === 'cod') {
      return true;
    }

    return order.paymentStatus === 'paid';
  };

  const getCompleteBlockedMessage = (order: any) => {
    if (!order) return '';

    if (order.isCompleted) return 'Pesanan ini sudah selesai.';
    if (order.isCanceled) return 'Pesanan ini sudah dibatalkan.';

    if (order.paymentMethod !== 'cod') {
      if (order.paymentStatus === 'pending') {
        return 'Pesanan online belum bisa diselesaikan karena pembayaran masih ditunda.';
      }

      if (order.paymentStatus === 'expired') {
        return 'Pesanan online tidak bisa diselesaikan karena pembayaran sudah kedaluwarsa.';
      }

      if (order.paymentStatus === 'failed') {
        return 'Pesanan online tidak bisa diselesaikan karena pembayaran gagal.';
      }
    }

    return '';
  };

  const getOrderStatusBadge = (order: any) => {
    if (order.isCanceled) return 'bg-red-100 text-red-700';
    if (order.isCompleted) return 'bg-green-100 text-green-700';
    return getPaymentBadge(order.paymentStatus);
  };
  const getSpecificMethodName = (order: any) => {
    // Jika COD, langsung kembalikan teks COD
    if (order.paymentMethod === 'cod') return 'Cash on Delivery (COD)';

    // Ambil data payment type (pastikan menggunakan midtransPaymentType sesuai page.tsx)
    const type = order.midtransPaymentType;

    if (!type) return 'Pembayaran Online';

    const names: Record<string, string> = {
      'bank_transfer': 'Transfer Bank',
      'gopay': 'GoPay',
      'shopeepay': 'ShopeePay',
      'dana': 'Dana',
      'bca_va': 'Virtual Account BCA',
      'bni_va': 'Virtual Account BNI',
      'bri_va': 'Virtual Account BRI',
      'permata_va': 'Virtual Account Permata',
      'echannel': 'Mandiri Bill',
      'cstore': 'Gerai Retail (Indomaret/Alfamart)',
    };

    return names[type.toLowerCase()] || type.replace(/_/g, ' ').toUpperCase();
  };
  const isRealVariantValue = (value?: string) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized !== '' && normalized !== 'default' && normalized !== '-' && normalized !== 'null';
  };

  return (
    <div className="p-6 space-y-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Pesanan Masuk</h1>

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <p className="text-gray-500">Tidak ada pesanan aktif</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`p-5 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${order.isCanceled
                ? 'bg-red-50 border-red-100'
                : order.isCompleted
                  ? 'bg-green-50 border-green-100'
                  : 'bg-white border-gray-100'
                }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{order.orderId}</p>
                  <p className="font-bold text-lg text-gray-800">{order.namaPembeli}</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <span
                  className={`${getOrderStatusBadge(order)} text-[10px] px-2 py-1 rounded-full font-bold uppercase`}
                >
                  {getOrderStatusText(order)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* POPUP DETAIL PESANAN */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-800">Detail Pesanan</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedOrder.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Konten Scrollable */}
            <div className="overflow-y-auto pr-2 space-y-6 flex-1 scrollbar-hide">

              {/* 1, 2, 3. Data Pembeli (Dibungkus Kotak) */}
              <section className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 space-y-4">
                <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest block border-b border-blue-100 pb-2 mb-2">
                  Data Pembeli
                </label>
                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Nama</label>
                  <p className="font-bold text-gray-800 text-lg uppercase">{selectedOrder.namaPembeli}</p>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">No. WhatsApp</label>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-blue-600 text-lg">{selectedOrder.noHp}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.noHp);
                        setCopiedId(selectedOrder.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 shadow-sm ${copiedId === selectedOrder.id
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-500'
                        }`}
                    >
                      {copiedId === selectedOrder.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Alamat Pengiriman</label>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{selectedOrder.alamat}</p>
                </div>
              </section>

              {/* 4. Daftar Barang (Data Barang Dibungkus Kotak Per Item) */}
              <section>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3 ml-2">
                  Daftar Barang yang Dipesan
                </label>
                <div className="space-y-4">
                  {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
                      {/* Nama Produk (QTY dihapus sesuai instruksi) */}
                      <div className="mb-4">
                        <p className="font-black text-gray-800 uppercase leading-tight text-xl">
                          {item.nama}
                        </p>
                      </div>

                      {/* Kode Unik & Varian */}
                      <div className="space-y-5">
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                            KODE UNIK PRODUK
                          </label>
                          <div className="text-4xl font-mono font-black text-blue-600 tracking-tighter leading-none">
                            {(() => {
                              const suffix = `-${String(item.warna).toUpperCase()}-${String(item.ukuran).toUpperCase()}`;
                              return item.kodeVarian.replace(suffix, "");
                            })()}
                          </div>
                        </div>

                        {/* Bagian Varian Dipilih */}
                        {(isRealVariantValue(item.warna) || isRealVariantValue(item.ukuran)) && (
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">
                              VARIAN DIPILIH
                            </label>
                            <div className="flex gap-4">
                              {/* Tampilkan Warna hanya jika nilainya valid (bukan '-', 'default', atau kosong) */}
                              {isRealVariantValue(item.warna) && (
                                <span className="text-lg font-black text-gray-700 uppercase">
                                  Warna: {item.warna}
                                </span>
                              )}

                              {/* Tampilkan Ukuran hanya jika nilainya valid */}
                              {isRealVariantValue(item.ukuran) && (
                                <span className="text-lg font-black text-gray-700 uppercase">
                                  Ukuran: {item.ukuran}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                            JUMLAH PESANAN
                          </label>
                          <div className="text-lg font-black text-gray-700">
                            {item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Total Harga (Tanpa Kotak) */}
              <section className="px-2 py-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Total Harga</label>
                <p className="text-4xl font-black text-red-600">
                  Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
                </p>
              </section>

              {/* 6. Metode Pembayaran */}
              <section className="px-2 pb-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">
                  Metode Pembayaran
                </label>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    {getSpecificMethodName(selectedOrder)}
                  </span>
                </div>
              </section>
            </div>

            {selectedOrder && !canCompleteOrder(selectedOrder) && !selectedOrder.isCompleted && !selectedOrder.isCanceled && (
              <div className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-xs font-semibold text-yellow-700">
                {getCompleteBlockedMessage(selectedOrder)}
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              {selectedOrder.isCompleted ? (
                <div className="rounded-2xl bg-green-50 py-4 text-center font-black uppercase tracking-widest text-xs text-green-700">
                  Pesanan sudah selesai
                </div>
              ) : selectedOrder.isCanceled ? (
                <div className="rounded-2xl bg-red-50 py-4 text-center font-black uppercase tracking-widest text-xs text-red-700">
                  Pesanan sudah dibatalkan
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={loading || !canCompleteOrder(selectedOrder)}
                    onClick={() => handleAction('COMPLETED')}
                    className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center uppercase tracking-widest text-xs"
                  >
                    {loading ? 'Processing...' : 'Pesanan Selesai'}
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleAction('CANCELLED')}
                    className="bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-black disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
                  >
                    Pesanan Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}