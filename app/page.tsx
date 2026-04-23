import { prisma } from '@/src/lib/prisma';
import Header from './components/Header';
import HomeClient from './HomeClient';

export default async function HomePage() {
  try {
    const [banners, categories, products] = await Promise.all([
      prisma.banner.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.findMany({
        where: {
          products: {
            some: {},
          },
        },
      }),
      prisma.product.findMany({
        include: { varian: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-md mx-auto bg-white min-h-screen pt-[72px] pb-24 shadow-2xl relative">
          <HomeClient
            banners={banners}
            categories={categories}
            products={products}
          />
        </main>
      </div>
    );
  } catch (error) {
    console.error('HOME PAGE ERROR:', error);

    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="max-w-md mx-auto bg-white min-h-screen pt-[72px] pb-24 shadow-2xl relative p-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
            <h1 className="font-bold text-red-700">Halaman sedang bermasalah</h1>
            <p className="text-sm text-red-600 mt-2">
              Koneksi database terputus. Coba refresh beberapa saat lagi.
            </p>
          </div>
        </main>
      </div>
    );
  }
}