'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Trash2 } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';


const formatSizeLabel = (size?: string) => String(size || '').trim().toUpperCase();

const isRealVariantValue = (value?: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized !== '' && normalized !== 'default' && normalized !== '-';
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cartItems, removeFromCart, updateQuantity, syncCartStock } = useCart();
  const router = useRouter();

  // Pastikan harga dan quantity adalah angka
  const subtotal = cartItems.reduce((sum, item) => {
    const harga = Number(item.harga) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + (harga * quantity);
  }, 0);
  const hasOutOfStockItem = cartItems.some((item) => Number(item.stok) <= 0);

  const goToPesananAkhir = () => {
    if (cartItems.length === 0) return;

    if (hasOutOfStockItem) {
      alert('Ada produk di keranjang yang stoknya habis. Hapus dulu produk tersebut sebelum melanjutkan.');
      return;
    }

    onClose();

    setTimeout(() => {
      router.push('/checkout');
    }, 100);
  };

  useEffect(() => {
    if (!isOpen) return;
    syncCartStock();
  }, [isOpen, syncCartStock]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-2 shadow-sm bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛒</span>
            <h2 className="text-lg font-Inter">Keranjang {cartItems.length} Barang</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={26} />
          </button>
        </div>

        {/* Daftar Barang - Bisa Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Keranjang masih kosong
            </div>
          ) : (
            // PERUBAHAN DI SINI: [...cartItems].reverse() membalik urutan array
            [...cartItems].reverse().map((item) => {
              const isOutOfStock = Number(item.stok) <= 0;

              return (
                <div key={item.id} className="flex gap-4 bg-gray-50 p-4 rounded-2xl">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={item.foto}
                      alt={item.nama}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-Inter text-black line-clamp-2">{item.nama}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {[
                        isRealVariantValue(item.warna) ? item.warna : null,
                        isRealVariantValue(item.ukuran)
                          ? `Ukuran ${formatSizeLabel(item.ukuran)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>

                    {isOutOfStock && (
                      <p className="mt-1 text-xs font-Inter text-red-600">
                        Stok habis, hapus produk ini untuk melanjutkan pesanan
                      </p>
                    )}

                    {/* Ubah div pembungkus harga dan kontrol menjadi flex-col */}
                    <div className="flex flex-col gap-3 mt-4">

                      {/* 1. Harga (Sekarang di atas) */}
                      <p className="font-Inter text-red-600 text-base">
                        Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                      </p>

                      {/* 2. Baris Kontrol (Sekarang di bawah harga) */}
                      <div className="flex items-center justify-between">

                        {/* Kontrol Tambah Kurang */}
                        <div className="flex items-center border rounded-xl bg-white shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-lg font-Inter hover:bg-gray-100 disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="px-4 font-Inter min-w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isOutOfStock || item.quantity >= Number(item.stok || item.quantity)}
                            className="w-8 h-8 flex items-center justify-center text-lg font-Inter hover:bg-gray-100 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        {/* Tombol Hapus */}
                        <button
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Hapus "${item.nama}" dari keranjang?`
                            );

                            if (confirmed) {
                              removeFromCart(item.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 p-2 bg-white rounded-xl border border-gray-100 shadow-sm transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="shadow-lg p-5 bg-white sticky bottom-0">
            <div className="flex justify-between items-center text-lg mb-5">
              <span className="font-Inter">Total</span>
              <span className="font-Inter text-red-600 text-xl">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={goToPesananAkhir}
              disabled={hasOutOfStockItem}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-2xl text-lg transition-all active:scale-[0.98] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {hasOutOfStockItem ? 'Ada Produk Habis' : 'Pesan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}