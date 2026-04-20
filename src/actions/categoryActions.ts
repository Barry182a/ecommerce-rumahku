'use server';

import { prisma } from '@/src/lib/prisma';

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { nama: 'asc' }
    });
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);
    return [];
  }
}

// Tambahkan parameter icon di sini
export async function addCategory(nama: string, icon: string) {
  try {
    const existing = await prisma.category.findUnique({ where: { nama } });
    if (existing) throw new Error("Kategori sudah ada!");

    // Simpan icon ke database
    await prisma.category.create({ 
      data: { 
        nama: nama,
        icon: icon 
      } 
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambah kategori" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus kategori." };
  }
}