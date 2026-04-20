import { prisma } from '@/src/lib/prisma';
import KategoriClient from './KategoriClient';

export const dynamic = 'force-dynamic';

export default async function KategoriPage() {
  // Ambil hanya kategori yang memiliki minimal 1 produk
  const categories = await prisma.category.findMany({
    where: {
      products: {
        some: {}
      }
    },
    orderBy: {
      nama: 'asc' // Urutkan sesuai abjad A-Z
    }
  });

  return <KategoriClient categories={categories} />;
}