import midtransClient from 'midtrans-client';

const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

if (!serverKey) {
  throw new Error('MIDTRANS_SERVER_KEY kosong atau tidak terbaca.');
}

console.log('Midtrans mode:', isProduction ? 'production' : 'sandbox');
console.log('Server key prefix:', serverKey.slice(0, 20));

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
});