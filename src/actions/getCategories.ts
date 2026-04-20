'use server';

import { prisma } from '@/src/lib/prisma';

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { nama: 'asc' } // Urutkan berdasarkan abjad
    });
    return categories;
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);
    return [];
  }
}