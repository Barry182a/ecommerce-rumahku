'use server';

import { prisma } from '@/src/lib/prisma';

export async function getOrders() {
  return await prisma.order.findMany({
    where: {
      isCompleted: false,
      isCanceled: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}