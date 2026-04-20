import { prisma } from '@/src/lib/prisma';

type CreateVariantProps = {
  productId: string;
  warna?: string;
  ukuran?: string;
  harga: number;
  stok: number;
  fotoVarian?: string;
};

const DEFAULT_VARIANT_VALUE = 'Default';

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeVariantField(value: unknown) {
  const cleaned = normalizeText(value);
  return cleaned === '' ? DEFAULT_VARIANT_VALUE : cleaned;
}

function normalizeOptionalText(value: unknown) {
  const cleaned = normalizeText(value);
  return cleaned === '' ? undefined : cleaned;
}

function normalizeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function sanitizeKode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '');
}

export async function createVariant(data: CreateVariantProps) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) {
    throw new Error('Product tidak ditemukan');
  }

  const warna = normalizeVariantField(data.warna);
  const ukuran = normalizeVariantField(data.ukuran);
  const harga = Math.max(0, Math.round(normalizeNumber(data.harga, 0)));
  const stok = Math.max(0, Math.floor(normalizeNumber(data.stok, 0)));
  const fotoVarian = normalizeOptionalText(data.fotoVarian);

  const kodeVarian =
    warna === DEFAULT_VARIANT_VALUE && ukuran === DEFAULT_VARIANT_VALUE
      ? sanitizeKode(`${product.kodeUnik}-${DEFAULT_VARIANT_VALUE}`)
      : sanitizeKode(`${product.kodeUnik}-${warna}-${ukuran}`);

  const existing = await prisma.productVariant.findUnique({
    where: { kodeVarian },
  });

  if (existing) {
    throw new Error('Variant sudah ada');
  }

  return await prisma.productVariant.create({
    data: {
      kodeVarian,
      productId: product.id,
      warna,
      ukuran,
      harga,
      stok,
      fotoVarian,
    },
  });
}