'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mengambil semua produk beserta variannya
export async function getAllProducts() {
  try {
    return await prisma.product.findMany({
      include: {
        varian: true,     // Ambil data varian untuk hitung stok
        category: true    // Ambil data kategori
      },
      orderBy: { createdAt: 'desc' } // Urutkan dari yang terbaru
    });
  } catch (error) {
    console.error("Gagal mengambil data produk:", error);
    return [];
  }
}

// Menghapus produk
export async function deleteProductAdmin(id: string) {
  try {
    // Berdasarkan schema kamu, onDelete: Cascade sudah ada di ProductVariant,
    // jadi menghapus Product otomatis menghapus semua variannya.
    await prisma.product.delete({
      where: { id }
    });

    revalidatePath('/admin/products/list');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus produk" };
  }
}

// 1. Fungsi untuk mengambil data 1 produk secara spesifik
export async function getProductById(id: string) {
  try {
    return await prisma.product.findUnique({
      where: { id },
      include: { varian: true } // Ambil juga data variannya
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

const DEFAULT_VARIANT_VALUE = 'Default';

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeNullableText(value: unknown) {
  const cleaned = normalizeText(value);
  return cleaned === '' ? null : cleaned;
}

function normalizeVariantField(value: unknown) {
  return normalizeText(value);
}

function normalizeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function sanitizeKode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}

function isVariantCompletelyEmpty(variant: any) {
  const warna = normalizeText(variant.warna);
  const ukuran = normalizeText(variant.ukuran);
  const fotoVarian = normalizeText(variant.fotoVarian);
  const harga = normalizeNumber(variant.harga, 0);
  const stok = normalizeNumber(variant.stok, 0);

  return warna === '' && ukuran === '' && fotoVarian === '' && harga === 0 && stok === 0;
}

function normalizeVariantsForSave(variants: any[], hargaDasar: number) {
  const normalized = (variants || [])
    .filter((variant) => !isVariantCompletelyEmpty(variant))
    .map((variant) => ({
      warna: normalizeVariantField(variant.warna),
      ukuran: normalizeVariantField(variant.ukuran),
      harga: Math.max(0, Math.round(normalizeNumber(variant.harga, hargaDasar))),
      stok: Math.max(0, Math.floor(normalizeNumber(variant.stok, 0))),
      fotoVarian: normalizeNullableText(variant.fotoVarian),
    }));

  const deduped = new Map<string, (typeof normalized)[number]>();

  for (const variant of normalized) {
    const key = `${variant.warna.toLowerCase()}__${variant.ukuran.toLowerCase()}`;
    deduped.set(key, variant);
  }

  return Array.from(deduped.values());
}

function isRealVariantValue(value: unknown) {
  const cleaned = normalizeText(value).toLowerCase();
  return cleaned !== '' && cleaned !== DEFAULT_VARIANT_VALUE.toLowerCase() && cleaned !== '-';
}

function getVariantPattern(variant: any) {
  const hasWarna = isRealVariantValue(variant.warna);
  const hasUkuran = isRealVariantValue(variant.ukuran);

  if (hasWarna && hasUkuran) return 'WARNA_UKURAN';
  if (hasWarna) return 'WARNA';
  if (hasUkuran) return 'UKURAN';
  return 'EMPTY';
}

function validateVariantPatternConsistency(variants: any[]) {
  const filledVariants = (variants || []).filter((variant) => !isVariantCompletelyEmpty(variant));

  if (filledVariants.length <= 1) return;

  const patterns = Array.from(
    new Set(
      filledVariants
        .map((variant) => getVariantPattern(variant))
        .filter((pattern) => pattern !== 'EMPTY')
    )
  );

  if (patterns.length > 1) {
    throw new Error(
      'Varian produk tidak konsisten. Semua varian dalam satu produk harus memakai pola yang sama.'
    );
  }
}
// 2. Fungsi untuk menyimpan hasil edit
export async function updateProductAdmin(id: string, data: any) {
  try {
    const kodeUnik = normalizeText(data.kodeUnik);
    const nama = normalizeText(data.nama);
    const deskripsi = normalizeText(data.deskripsi) || 'Tidak ada deskripsi';
    const fotoUtama = normalizeText(data.fotoUtama);
    const keywords = normalizeNullableText(data.keywords);
    const hargaDasarFix = Math.max(0, Math.round(normalizeNumber(data.hargaDasar, 0)));
    validateVariantPatternConsistency(data.variants || []);
    const normalizedVariants = normalizeVariantsForSave(data.variants || [], hargaDasarFix);

    await prisma.product.update({
      where: { id },
      data: {
        kodeUnik,
        nama,
        deskripsi,
        hargaDasar: hargaDasarFix,
        fotoUtama,
        categoryId: data.categoryId || null,
        keywords,
      }
    });

    await prisma.productVariant.deleteMany({
      where: { productId: id }
    });

    if (normalizedVariants.length > 0) {
      for (const v of normalizedVariants) {
        await prisma.productVariant.create({
          data: {
            productId: id,
            kodeVarian: sanitizeKode(`${kodeUnik}-${v.warna}-${v.ukuran}`),
            warna: v.warna,
            ukuran: v.ukuran,
            harga: v.harga,
            stok: v.stok,
            fotoVarian: v.fotoVarian,
          }
        });
      }
    } else {
      await prisma.productVariant.create({
        data: {
          productId: id,
          kodeVarian: sanitizeKode(`${kodeUnik}-${DEFAULT_VARIANT_VALUE}`),
          warna: DEFAULT_VARIANT_VALUE,
          ukuran: DEFAULT_VARIANT_VALUE,
          harga: hargaDasarFix,
          stok: 0,
          fotoVarian: null,
        }
      });
    }

    revalidatePath('/admin/products/list');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}