'use server';

import { prisma } from '@/src/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, status: 'COMPLETED' | 'CANCELLED') {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) throw new Error('Pesanan tidak ditemukan');
      if (order.isCompleted || order.isCanceled) {
        throw new Error('Pesanan sudah diproses sebelumnya');
      }

      if (status === 'COMPLETED') {
        if (order.paymentMethod === 'cod') {
          const items = order.items as any[];

          for (const item of items) {
            const variant = await tx.productVariant.findUnique({
              where: { kodeVarian: item.kodeVarian },
            });

            if (!variant) throw new Error(`Varian ${item.kodeVarian} tidak ditemukan`);
            if (variant.stok < item.quantity) {
              throw new Error(`Stok ${item.nama} tidak mencukupi`);
            }

            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stok: { decrement: item.quantity } },
            });
          }

          await tx.order.update({
            where: { id: orderId },
            data: {
              isCompleted: true,
              paymentStatus: 'paid',
              paidAt: new Date(),
            },
          });
        } else {
          if (order.paymentStatus !== 'paid') {
            throw new Error(
              'Pesanan online hanya bisa diselesaikan jika pembayaran sudah berhasil.'
            );
          }

          await tx.order.update({
            where: { id: orderId },
            data: {
              isCompleted: true,
            },
          });
        }
      } else if (status === 'CANCELLED') {
        await tx.order.update({
          where: { id: orderId },
          data: {
            isCanceled: true,
            paymentStatus: order.paymentMethod === 'cod' ? 'failed' : order.paymentStatus,
            cancelledAt: new Date(),
          },
        });
      }

      revalidatePath('/admin/orders');
      revalidatePath('/pesanan');

      return { success: true, message: 'Status pesanan berhasil diperbarui' };
    });
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}