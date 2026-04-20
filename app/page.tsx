// app/page.tsx
import { prisma } from '@/src/lib/prisma'; // Sesuaikan path ini dengan letak file prisma.ts kamu
import Header from './components/Header';
import HomeClient from './HomeClient';


export default async function HomePage() {
  // 1. Ambil data dari database secara paralel (lebih cepat)
  // Kita mengambil Banner, Kategori, dan Produk (termasuk variannya)

  const [banners, categories, products] = await Promise.all([
    prisma.banner.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    prisma.category.findMany({
      where: {
        products: {
          some: {} 
        }
      }
    }),
    prisma.product.findMany({
      include: { varian: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 2. Komponen Header (Berisi Logo & Icon Keranjang) */}
      <Header />

      {/* 3. Container utama dengan pembatas lebar (Max Width) agar tampil seperti aplikasi mobile */}
      <main className="max-w-md mx-auto bg-white min-h-screen pt-[72px] pb-24 shadow-2xl relative">

        {/* 4. Komponen Client untuk bagian Body dan Footer Navigator */}
        <HomeClient
          banners={banners}
          categories={categories}
          products={products}
        />

      </main>
    </div>
  );
}