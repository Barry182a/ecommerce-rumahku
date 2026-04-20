// @ts-nocheck
import 'dotenv/config';
// seed.ts  (di root project)
import { prisma } from './src/lib/prisma';
import { generateKodeVarian } from './src/lib/utils';

async function main() {
  console.log('🌱 Starting seed...');

  // Hapus data lama
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  // Buat Produk
  const product = await prisma.product.create({
    data: {
      kodeUnik: 'KOS001',
      nama: 'Kaos Polos Oversize',
      deskripsi: 'Kaos oversize bahan katun premium nyaman dipakai sehari-hari. Cocok untuk santai maupun casual.',
      hargaDasar: 89000,
      fotoUtama: 'https://picsum.photos/id/1015/600/600',
    },
  });

  console.log(`✅ Product created: ${product.kodeUnik}`);

  // Buat Varian dengan foto
  const variants = [
    {
      warna: 'Merah',
      ukuran: 'XL',
      harga: 89000,
      stok: 15,
      fotoVarian: 'https://picsum.photos/id/1015/600/600'
    },
    {
      warna: 'Merah',
      ukuran: 'L',
      harga: 89000,
      stok: 8,
      fotoVarian: 'https://picsum.photos/id/102/600/600'
    },
    {
      warna: 'Hitam',
      ukuran: 'XL',
      harga: 85000,
      stok: 12,
      fotoVarian: 'https://picsum.photos/id/106/600/600'
    },
    {
      warna: 'Hitam',
      ukuran: 'L',
      harga: 85000,
      stok: 10,
      fotoVarian: 'https://picsum.photos/id/107/600/600'
    },
    {
      warna: 'Biru',
      ukuran: 'M',
      harga: 89000,
      stok: 5,
      fotoVarian: 'https://picsum.photos/id/133/600/600'
    },
    {
      warna: 'Biru',
      ukuran: 'XL',
      harga: 89000,
      stok: 7,
      fotoVarian: 'https://picsum.photos/id/201/600/600'
    },
  ];

  for (const v of variants) {
    const kodeVarian = generateKodeVarian(product.kodeUnik, v.warna, v.ukuran);

    await prisma.productVariant.create({
      data: {
        kodeVarian,
        productId: product.id,
        warna: v.warna,
        ukuran: v.ukuran,
        harga: v.harga,
        stok: v.stok,
      },
    });

    console.log(`✅ Variant created: ${kodeVarian}`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });