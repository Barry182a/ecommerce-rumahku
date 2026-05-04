'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPollingClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [dots, setDots] = useState('');
  const [isPending, setIsPending] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 4;

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/history?ids=${orderId}`, { cache: 'no-store' });
      const data = await res.json();
      
      if (data[0]?.paymentStatus === 'paid') {
        router.refresh();
      } else {
        if (retryCount >= maxRetries) {
          setIsPending(false);
        }
      }
    } catch (err) {
      console.error("Gagal verifikasi:", err);
    }
  }, [orderId, router, retryCount]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    const pollInterval = setInterval(() => {
      setRetryCount(prev => prev + 1);
      checkStatus();
    }, 1500);

    return () => {
      clearInterval(dotInterval);
      clearInterval(pollInterval);
    };
  }, [checkStatus]);

  if (!isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-5">
        <div className="mb-4 text-4xl">⏳</div>
        <h2 className="text-lg font-bold text-black">Pembayaran Belum Selesai</h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Kami belum menerima konfirmasi pembayaran Anda. Jika Anda sudah membayar, mohon tunggu sebentar atau cek riwayat pesanan.
        </p>
        <div className="mt-6 flex flex-col w-full gap-3">
           <button 
             onClick={() => { setIsPending(true); setRetryCount(0); }}
             className="w-full rounded-2xl bg-red-600 py-3 text-sm font-bold text-white"
           >
             Cek Ulang Status
           </button>
           <Link 
             href="/pesanan"
             className="w-full rounded-2xl border border-gray-200 py-3 text-center text-sm font-bold text-gray-600"
           >
             Ke Daftar Pesanan
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
      <h1 className="mt-5 text-xl font-bold text-black text-center">
        Memverifikasi Pembayaran{dots}
      </h1>
      <p className="mt-2 text-sm text-gray-600 text-center px-4">
        Mohon jangan tutup halaman ini
      </p>
    </div>
  );
}