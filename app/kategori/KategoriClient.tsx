'use client';

import Link from 'next/link';
import Header from '../components/Header';
import FooterNav from '../components/FooterNav';
import { pageContainer, pagePadding } from '@/src/lib/layout';

const CATEGORY_IMAGE_OPTIONS = [
  { name: 'Shirt', imagePath: '/category-images/baju.jpg' },
  { name: 'ShoppingBag', imagePath: '/category-images/tas.jpg' },
  { name: 'Home', imagePath: '/category-images/perabotan.png' },
  { name: 'Book', imagePath: '/category-images/buku.jpg' },
  { name: 'Cloth', imagePath: '/category-images/pakaian-wanita.webp' },
];

export default function KategoriClient({ categories }: { categories: any[] }) {
  const getImagePath = (iconName: string | null) => {
    const foundImage = CATEGORY_IMAGE_OPTIONS.find((i) => i.name === iconName);
    return foundImage ? foundImage.imagePath : '/category-images/default.png';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Kategori" showBack={false} showSearch={false} showWhatsapp={true} showCart={true} />

      <main className={`${pageContainer} bg-white ${pagePadding} pt-6`}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {categories.map((cat) => (
            <Link
              href={`/search?category=${cat.id}`}
              key={cat.id}
              className="group flex flex-col"
            >
              <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm transition-shadow group-hover:shadow-md">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-gray-100/50 to-transparent"></div>

                <img
                  src={getImagePath(cat.icon)}
                  alt={cat.nama}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="px-1 text-center">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 transition-colors group-hover:text-red-600 sm:text-sm">
                  {cat.nama}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <FooterNav />
    </div>
  );
}