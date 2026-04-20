'use server';

import { prisma } from '@/src/lib/prisma';
import { createVariant } from './createVariant';

type VariantInput = {
  warna: string;
  ukuran: string;
  harga: number;
  stok: number;
  fotoVarian: string;
};

type CreateProductProps = {
  kodeUnik: string;
  nama: string;
  deskripsi: string;
  hargaDasar: number;
  fotoUtama: string;
  variants: VariantInput[];
  categoryId?: string;
  keywords?: string | null;
};

const DEFAULT_VARIANT_VALUE = 'Default';

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeOptionalText(value: unknown) {
  const cleaned = normalizeText(value);
  return cleaned === '' ? undefined : cleaned;
}

function normalizeVariantField(value: unknown) {
  const cleaned = normalizeText(value);
  return cleaned === '' ? DEFAULT_VARIANT_VALUE : cleaned;
}

function normalizeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isVariantCompletelyEmpty(variant: VariantInput) {
  const warna = normalizeText(variant.warna);
  const ukuran = normalizeText(variant.ukuran);
  const fotoVarian = normalizeText(variant.fotoVarian);
  const harga = normalizeNumber(variant.harga, 0);
  const stok = normalizeNumber(variant.stok, 0);

  return warna === '' && ukuran === '' && fotoVarian === '' && harga === 0 && stok === 0;
}

function normalizeVariantsForSave(variants: VariantInput[], hargaDasar: number) {
  const normalized = variants
    .filter((variant) => !isVariantCompletelyEmpty(variant))
    .map((variant) => ({
      warna: normalizeVariantField(variant.warna),
      ukuran: normalizeVariantField(variant.ukuran),
      harga: Math.max(0, Math.round(normalizeNumber(variant.harga, hargaDasar))),
      stok: Math.max(0, Math.floor(normalizeNumber(variant.stok, 0))),
      fotoVarian: normalizeOptionalText(variant.fotoVarian),
    }));

  const deduped = new Map<string, (typeof normalized)[number]>();

  for (const variant of normalized) {
    const key = `${variant.warna.toLowerCase()}__${variant.ukuran.toLowerCase()}`;
    deduped.set(key, variant);
  }

  return Array.from(deduped.values());
}

export async function createProduct(data: CreateProductProps) {
  const kodeUnik = normalizeText(data.kodeUnik);
  const nama = normalizeText(data.nama);
  const deskripsi = normalizeText(data.deskripsi) || 'Tidak ada deskripsi';
  const fotoUtama = normalizeText(data.fotoUtama);
  const keywords = normalizeText(data.keywords) || null;
  const hargaDasarFix = Math.max(0, Math.round(normalizeNumber(data.hargaDasar, 0)));
  const normalizedVariants = normalizeVariantsForSave(data.variants || [], hargaDasarFix);

  if (!kodeUnik) throw new Error('Kode unik wajib diisi');
  if (!nama) throw new Error('Nama produk wajib diisi');
  if (!fotoUtama) throw new Error('Foto utama wajib diisi');

  const existing = await prisma.product.findUnique({
    where: { kodeUnik },
  });

  if (existing) throw new Error('Kode unik sudah digunakan');

  const product = await prisma.product.create({
    data: {
      kodeUnik,
      nama,
      deskripsi,
      hargaDasar: hargaDasarFix,
      fotoUtama,
      categoryId: data.categoryId || null,
      keywords,
    },
  });

  if (normalizedVariants.length === 0) {
    await createVariant({
      productId: product.id,
      warna: DEFAULT_VARIANT_VALUE,
      ukuran: DEFAULT_VARIANT_VALUE,
      harga: hargaDasarFix,
      stok: 0,
      fotoVarian: undefined,
    });
  } else {
    for (const v of normalizedVariants) {
      await createVariant({
        productId: product.id,
        warna: v.warna,
        ukuran: v.ukuran,
        harga: v.harga,
        stok: v.stok,
        fotoVarian: v.fotoVarian,
      });
    }
  }

  return product;
}