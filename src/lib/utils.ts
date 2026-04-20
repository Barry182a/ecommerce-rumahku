// src/lib/utils.ts
export function generateKodeVarian(
  kodeUnik: string, 
  warna: string, 
  ukuran: string
): string {
  const warnaClean = warna.trim().toUpperCase().replace(/\s+/g, '');
  const ukuranClean = ukuran.trim().toUpperCase().replace(/\s+/g, '');
  
  return `${kodeUnik}-${warnaClean}-${ukuranClean}`;
}

// Helper untuk generate Order ID
export function generateOrderId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${dateStr}-${random}`;
}