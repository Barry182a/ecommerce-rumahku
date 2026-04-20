'use server'; // Gunakan 'use server' untuk Server Actions

import { prisma } from '@/src/lib/prisma'; // Sesuaikan path prisma kamu
import { revalidatePath } from 'next/cache';

export async function addBanner(imageUrl: string) {
  try {
    await prisma.banner.create({
      data: { imageUrl }
    });
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menambah banner" };
  }
}

export async function deleteBanner(id: string) {
  try {
    await prisma.banner.delete({
      where: { id }
    });
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus banner" };
  }
}