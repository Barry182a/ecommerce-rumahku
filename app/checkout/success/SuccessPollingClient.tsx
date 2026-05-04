'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPollingClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animasi titik-titik sederhana
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    // Fungsi cek status ke API history yang sudah Anda miliki
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/history?ids=${orderId}`);
        const data = await res.json();
        
        // Jika status sudah berubah jadi 'paid', segarkan halaman[cite: 3, 5]
        if (data[0]?.paymentStatus === 'paid') {
          router.refresh(); 
        }
      } catch (err) {
        console.error("Gagal verifikasi:", err);
      }
    };

    // Jalankan polling setiap 1.5 detik
    const pollInterval = setInterval(checkStatus, 1500);

    return () => {
      clearInterval(dotInterval);
      clearInterval(pollInterval);
    };
  }, [orderId, router]);

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
      <h1 className="mt-5 text-xl font-bold text-black text-center">
        Memverifikasi Pembayaran{dots}
      </h1>
      <p className="mt-2 text-lg text-gray-600 text-center">
        Mohon jangan tutup halaman ini
      </p>
    </div>
  );
}