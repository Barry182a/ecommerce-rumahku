import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      status_code,
      gross_amount,
      signature_key,
    } = body;

    // KHUSUS untuk tombol "Tes URL notifikasi" dari dashboard Midtrans
    if (String(order_id).startsWith('payment_notif_test_')) {
      console.log('MIDTRANS DASHBOARD TEST ACCEPTED:', body);

      return NextResponse.json({
        success: true,
        message: 'Midtrans dashboard test notification accepted',
      });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + serverKey)
      .digest('hex');

    console.log('MIDTRANS SIG CHECK', {
      order_id,
      status_code,
      gross_amount,
      signature_key_prefix: String(signature_key).slice(0, 12),
      expected_prefix: String(expectedSignature).slice(0, 12),
    });

    if (signature_key !== expectedSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { orderId: order_id },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    let paymentStatus = 'pending';
    let paidAt: Date | null = null;
    let expiredAt: Date | null = null;
    let cancelledAt: Date | null = null;

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      paymentStatus = 'paid';
      paidAt = new Date();
    } else if (transaction_status === 'expire') {
      paymentStatus = 'expired';
      expiredAt = new Date();
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'failure'
    ) {
      paymentStatus = 'failed';
      cancelledAt = new Date();
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus,
          midtransTransactionId: transaction_id ?? null,
          midtransPaymentType: payment_type ?? null,
          midtransFraudStatus: fraud_status ?? null,
          paidAt,
          expiredAt,
          cancelledAt,
        },
      });

      if (paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
        const items = order.items as any[];

        for (const item of items) {
          const variant = await tx.productVariant.findUnique({
            where: { kodeVarian: item.kodeVarian },
          });

          if (!variant) {
            throw new Error(`Varian ${item.kodeVarian} tidak ditemukan`);
          }

          if (variant.stok < item.quantity) {
            throw new Error(`Stok ${item.nama} tidak mencukupi`);
          }

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stok: { decrement: item.quantity },
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('MIDTRANS WEBHOOK ERROR:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}