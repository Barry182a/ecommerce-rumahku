import webpush from 'web-push';
import { prisma } from '@/src/lib/prisma';

const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY!;
const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY!;
const subject = process.env.WEB_PUSH_EMAIL || 'mailto:admin@example.com';

webpush.setVapidDetails(subject, publicKey, privateKey);

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  const subs = await prisma.pushSubscription.findMany();

  await Promise.all(
    subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
      } catch (error: any) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint },
          }).catch(() => {});
        } else {
          console.error('WEB PUSH SEND ERROR:', error);
        }
      }
    })
  );
}