import { prisma } from '@/src/lib/prisma';
import BannerManager from './BannerManager';
import CategoryManager from './CategoryManager';

export default async function AdminHomePage() {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-800">Admin Home</h1>
          <p className="text-gray-500 text-sm">Kelola tampilan banner promosi tokomu.</p>
        </div>
      </div>

      {/* Komponen Client untuk mengelola list & modal */}
      <BannerManager initialBanners={banners} />
      <CategoryManager />
    </div>
  );
}