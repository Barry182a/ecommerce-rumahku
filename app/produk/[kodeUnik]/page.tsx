// app/produk/[kodeUnik]/page.tsx
import { prisma } from '@/src/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { Metadata, ResolvingMetadata } from 'next';

interface Props {
  params: Promise<{ kodeUnik: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { kodeUnik } = await params;

  const product = await prisma.product.findUnique({
    where: { kodeUnik },
    include: { varian: true },
  });

  if (!product) {
    return { title: 'Produk Tidak Ditemukan' };
  }

  const hargaTerkecil =
    product.varian.length > 0
      ? Math.min(...product.varian.map((v) => v.harga))
      : product.hargaDasar;

  return {
    title: `${product.nama} - Toko Rumahku`,
    description: `${product.deskripsi?.substring(0, 150)}... Mulai dari Rp ${hargaTerkecil.toLocaleString('id-ID')}`,
    openGraph: {
      title: product.nama,
      description: `Beli ${product.nama} dengan harga terbaik di Toko Rumahku.`,
      images: [
        {
          url: product.fotoUtama,
          width: 800,
          height: 600,
          alt: product.nama,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.nama,
      description: product.deskripsi || '',
      images: [product.fotoUtama],
    },
  };
}

function detectGenderFromCategoryName(categoryName: string) {
  const name = categoryName.toLowerCase();

  if (
    name.includes('wanita') ||
    name.includes('perempuan') ||
    name.includes('cewek') ||
    name.includes('ladies')
  ) {
    return 'wanita';
  }

  if (
    name.includes('pria') ||
    name.includes('laki') ||
    name.includes('cowok') ||
    name.includes('men')
  ) {
    return 'pria';
  }

  return null;
}

export default async function ProductDetailPage({ params }: Props) {
  const { kodeUnik } = await params;

  const product = await prisma.product.findUnique({
    where: { kodeUnik },
    include: {
      category: true,
      varian: {
        where: { stok: { gt: 0 } },
        orderBy: { warna: 'asc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const categoryName = product.category?.nama?.toLowerCase() || '';
  const isPakaian = categoryName.includes('pakaian');
  const gender = detectGenderFromCategoryName(categoryName);

  let similarProducts: any[] = [];

  if (isPakaian && gender) {
    similarProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        category: {
          is: {
            nama: {
              contains: 'pakaian',
              mode: 'insensitive',
            },
          },
        },
        AND: [
          {
            category: {
              is: {
                nama: {
                  contains: gender,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      include: {
        category: true,
        varian: {
          where: { stok: { gt: 0 } },
          orderBy: { warna: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else if (product.categoryId) {
    similarProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        categoryId: product.categoryId,
      },
      include: {
        category: true,
        varian: {
          where: { stok: { gt: 0 } },
          orderBy: { warna: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return (
    <ProductDetailClient
      product={product}
      similarProducts={similarProducts}
    />
  );
}