import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kodeVarianList: string[] = Array.isArray(body?.kodeVarianList)
      ? body.kodeVarianList
      : [];

    if (kodeVarianList.length === 0) {
      return NextResponse.json([]);
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        kodeVarian: {
          in: kodeVarianList,
        },
      },
      select: {
        kodeVarian: true,
        stok: true,
        warna: true,
        ukuran: true,
        harga: true,
      },
    });

    return NextResponse.json(variants);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal cek stok keranjang' },
      { status: 500 }
    );
  }
}