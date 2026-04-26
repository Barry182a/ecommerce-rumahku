import { getSearchResults } from '@/src/actions/searchActions';
import { prisma } from '@/src/lib/prisma';
import Link from 'next/link';
import { PackageX, Search } from 'lucide-react';
import SortDropdown from './SortDropdown';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import FooterNav from '../components/FooterNav';
import { pageContainer, pagePadding } from '@/src/lib/layout';

export const dynamic = 'force-dynamic';

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; sort?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const sortBy = searchParams?.sort || 'relevan';
  const category = searchParams?.category || '';

  let results: any[] = [];
  let categoryName = '';

  if (category) {
    const categoryData = await prisma.category.findUnique({
      where: { id: category },
      select: { nama: true },
    });

    categoryName = categoryData?.nama || '';

    results = await prisma.product.findMany({
      where: { categoryId: category },
      include: { varian: true },
      orderBy: { createdAt: 'desc' },
    });
  } else if (query) {
    results = await getSearchResults(query);
  }

  if (sortBy === 'termurah') {
    results.sort((a, b) => a.hargaDasar - b.hargaDasar);
  } else if (sortBy === 'termahal') {
    results.sort((a, b) => b.hargaDasar - a.hargaDasar);
  } else if (sortBy === 'terbaru') {
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const hasFilter = !!query || !!category;
  const displayTitle = categoryName ? `Kategori: ${categoryName}` : 'Cari Produk';
  const displayHint = categoryName
    ? 'Menampilkan semua produk dari kategori ini'
    : 'Ketik nama produk di atas';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        title="Cari"
        showBack={false}
        showSearch={true}
        showWhatsapp={true}
        showCart={true}
      />

      <main className={`${pageContainer} bg-white ${pagePadding} pt-4`}>
        {!hasFilter ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-gray-50 shadow-sm">
              <Search size={40} className="text-gray-300" />
            </div>

            <h1 className="mb-2 text-lg uppercase tracking-wide text-gray-800">
              {displayTitle}
            </h1>

            <p className="mb-8 text-[10px] uppercase tracking-widest text-gray-400">
              {displayHint}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {['Sepatu', 'Baju', 'Tas', 'Aksesoris'].map((cat) => (
                <Link
                  key={cat}
                  href={`/search?q=${cat}`}
                  className="rounded-full border border-gray-100 px-6 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 shadow-sm transition-all hover:border-red-500 hover:text-red-600"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {categoryName && (
              <div className="mb-4">
                <h1 className="text-lg font-semibold text-gray-800">
                  {categoryName}
                </h1>
              </div>
            )}

            <div className="mb-6 flex flex-col gap-3">
              {results.length > 0 && (
                <SortDropdown currentSort={sortBy} query={query} category={category} />
              )}
            </div>

            {results.length > 0 ? (
              <div className="columns-2 gap-4 pb-6 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
                {results.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                <PackageX size={48} className="mb-6 text-gray-200" />
                <h2 className="mb-2 text-sm uppercase tracking-wide text-gray-800">
                  Produk Tidak Ditemukan
                </h2>
                <p className="mb-8 text-[10px] uppercase tracking-widest text-gray-400">
                  Coba kata kunci atau kategori lain
                </p>
                <Link
                  href="/"
                  className="rounded-xl bg-red-600 px-6 py-3 text-[10px] uppercase tracking-wider text-white shadow-md transition-all active:scale-95"
                >
                  Ke Beranda
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      <FooterNav />
    </div>
  );
}