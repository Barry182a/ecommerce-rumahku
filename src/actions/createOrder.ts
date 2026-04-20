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
  // 1. Inisialisasi variabel untuk hitung ulang di Server
  let serverTotal = 0;
  const validatedItems = [];

  // 2. Loop setiap barang untuk validasi harga & stok asli dari DB
  for (const item of data.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { kodeVarian: item.kodeVarian },
    });

    // Cek apakah barang masih ada di DB
    if (!variant) {
      throw new Error(`Produk dengan kode ${item.kodeVarian} tidak ditemukan.`);
    }

    // Cek apakah stok masih mencukupi (Validasi stok terakhir)
    if (variant.stok < item.quantity) {
      throw new Error(`Stok untuk ${item.nama} tidak mencukupi (Tersisa: ${variant.stok}).`);
    }

    // Hitung subtotal menggunakan harga asli dari Database (Bukan dari Client)
    const itemTotal = variant.harga * item.quantity;
    serverTotal += itemTotal;

    // Susun ulang item untuk disimpan ke kolom JSON agar datanya bersih
    validatedItems.push({
      kodeVarian: variant.kodeVarian,
      nama: item.nama,
      warna: variant.warna,
      ukuran: variant.ukuran,
      harga: variant.harga, // Gunakan harga asli DB
      quantity: item.quantity
    });
  }

  // 3. Bandingkan total dari Client dengan hitungan Server
  // Jika selisih, berarti ada indikasi manipulasi data di browser
  if (serverTotal !== data.total) {
    throw new Error("Manipulasi harga terdeteksi. Transaksi dibatalkan demi keamanan.");
  }

  // 4. Jika semua valid, buat Order ID dan simpan ke DB
  const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await prisma.order.create({
    data: {
      orderId,
      namaPembeli: data.nama,
      noHp: data.noHp,
      alamat: data.alamat,
      paymentMethod: data.paymentMethod,
      totalAmount: serverTotal, // Gunakan hasil hitung server
      items: validatedItems,    // Gunakan item yang sudah divalidasi
    },
  });

  return order;
}