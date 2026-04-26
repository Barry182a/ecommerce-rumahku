'use server';

import { prisma } from '@/src/lib/prisma';
import { snap } from '@/src/lib/midtrans';
import { sendPushToAll } from '@/src/lib/webpush';

export async function createMidtransOrder(data: {
  nama: string;
  noHp: string;
  alamat: string;
  items: any[];
  total: number;
}) {
  let serverTotal = 0;
  const validatedItems: any[] = [];

  for (const item of data.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { kodeVarian: item.kodeVarian },
    });

    if (!variant) {
      throw new Error(`Produk dengan kode ${item.kodeVarian} tidak ditemukan.`);
    }

    if (variant.stok < item.quantity) {
      throw new Error(`Stok untuk ${item.nama} tidak mencukupi (Tersisa: ${variant.stok}).`);
    }

    const itemTotal = variant.harga * item.quantity;
    serverTotal += itemTotal;

    validatedItems.push({
      id: variant.kodeVarian,
      price: variant.harga,
      quantity: item.quantity,
      name: String(item.nama).slice(0, 50),
      kodeVarian: variant.kodeVarian,
      warna: variant.warna,
      ukuran: variant.ukuran,
      harga: variant.harga,
    });
  }

  if (serverTotal !== data.total) {
    throw new Error('Manipulasi harga terdeteksi. Transaksi dibatalkan demi keamanan.');
  }

  const orderId = `ORD-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await prisma.order.create({
    data: {
      orderId,
      namaPembeli: data.nama,
      noHp: data.noHp,
      alamat: data.alamat,
      paymentMethod: 'midtrans',
      paymentStatus: 'pending',
      totalAmount: serverTotal,
      items: validatedItems.map((item) => ({
        kodeVarian: item.kodeVarian,
        nama: item.name,
        warna: item.warna,
        ukuran: item.ukuran,
        harga: item.harga,
        quantity: item.quantity,
      })),
    },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: order.orderId,
      gross_amount: serverTotal,
    },
    customer_details: {
      first_name: data.nama,
      phone: data.noHp,
    },
    item_details: validatedItems.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name,
    })),

    enabled_payments: [
      'gopay',
      'shopeepay',
      'dana',
      'bca_va',
      'bni_va',
      'bri_va',
      'permata_va',
      'bsi_va',
      'seabank_va',
      'danamon_va',
      'other_va'
    ],
    callbacks: {
      finish: `${appUrl}/checkout/success?orderId=${order.orderId}&from=snap_success`,
    }
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      midtransToken: transaction.token,
      midtransRedirectUrl: transaction.redirect_url,
    },
  });

  await sendPushToAll({
    title: 'Pesanan baru masuk',
    body: `${order.namaPembeli} - Bayar Online`,
    url: '/admin/orders',
  });

  return {
    orderId: order.orderId,
    token: transaction.token,
    redirectUrl: transaction.redirect_url,
  };
}