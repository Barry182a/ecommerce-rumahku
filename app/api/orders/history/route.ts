import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const idsParam = req.nextUrl.searchParams.get('ids') || '';
        const ids = idsParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);

        if (ids.length === 0) {
            return NextResponse.json([]);
        }

        const orders = await prisma.order.findMany({
            where: {
                orderId: {
                    in: ids,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                orderId: true,
                paymentMethod: true,
                paymentStatus: true,
                totalAmount: true,
                items: true,
                createdAt: true,
                paidAt: true,
                expiredAt: true,
                cancelledAt: true,
                midtransRedirectUrl: true,
                midtransPaymentType: true,
                isCompleted: true,
                isCanceled: true,
            },
        });

        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Gagal mengambil riwayat pesanan' },
            { status: 500 }
        );
    }
}