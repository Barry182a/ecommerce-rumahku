'use server';

import { prisma } from '@/src/lib/prisma';

export async function createOrder(data: {
  nama: string;
  noHp: string;
  alamat: string;
  paymentMethod: string;
  items: any[];
  total: number;
}) {
  let serverTotal = 0;
  const validatedItems = [];

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
      kodeVarian: variant.kodeVarian,
      nama: item.nama,
      warna: variant.warna,
      ukuran: variant.ukuran,
      harga: variant.harga,
      quantity: item.quantity,
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
      paymentMethod: data.paymentMethod,
      totalAmount: serverTotal,
      items: validatedItems,
    },
  });

  return order;
}