import { prisma } from '@/src/lib/prisma';
import Header from './components/Header';
import HomeClient from './HomeClient';
import { pageContainer } from '@/src/lib/layout';

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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className={`${pageContainer} min-h-screen bg-white pt-0 pb-24 shadow-2xl`}>
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className={`${pageContainer} min-h-screen bg-white px-4 pt-[72px] pb-24 shadow-2xl`}>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <h1 className="font-bold text-red-700">Halaman sedang bermasalah</h1>
            <p className="mt-2 text-sm text-red-600">
              Koneksi database terputus. Coba refresh beberapa saat lagi.
            </p>
          </div>
        </main>
      </div>
    );
  }
}