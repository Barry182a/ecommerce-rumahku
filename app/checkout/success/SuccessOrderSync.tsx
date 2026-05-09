'use client';

import { useEffect } from 'react';

interface Props {
  orderId: string;
  paymentMethod: string;
  totalAmount: number;
}

export default function SuccessOrderSync({ orderId, paymentMethod, totalAmount }: Props) {
  useEffect(() => {
    if (!orderId) return;

    // 1. Ambil riwayat pesanan yang ada di browser
    const savedOrders = JSON.parse(localStorage.getItem('customer_orders') || '[]');

    // 2. Cek apakah orderId ini sudah tercatat?
    const isAlreadySaved = savedOrders.some((o: any) => o.orderId === orderId);

    if (!isAlreadySaved) {
      // 3. Jika belum (kasus Dana/E-wallet), tambahkan secara manual
      const newOrder = {
        orderId: orderId,
        paymentMethod: paymentMethod,
        paymentStatus: 'pending', // Status awal, nanti akan diupdate oleh polling/sync
        totalAmount: totalAmount,
        items: [], // Akan diisi saat sinkronisasi di halaman Pesanan
        createdAt: new Date().toISOString(),
      };

      const updatedOrders = [newOrder, ...savedOrders];
      localStorage.setItem('customer_orders', JSON.stringify(updatedOrders));
      
      // 4. Trigger event agar komponen lain (seperti Header) tahu ada perubahan
      window.dispatchEvent(new Event('customer-orders-updated'));
      console.log('Order synced to local storage from Success Page');
    }
  }, [orderId, paymentMethod, totalAmount]);

  return null; // Komponen ini tidak merender apa pun ke layar
}