'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useEffect } from 'react';


interface CartItem {
  id: string;
  kodeVarian: string;
  nama: string;
  warna: string;
  ukuran: string;
  harga: number;
  quantity: number;
  foto: string;
  stok: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncCartStock: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems, isHydrated]);

  const addToCart = (newItem: Omit<CartItem, 'id' | 'quantity'>) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.kodeVarian === newItem.kodeVarian);

      if (existing) {
        if (existing.quantity >= newItem.stok) {
          alert("Stok sudah mencapai batas maksimal di keranjang");
          return prev;
        }
        return prev.map(item =>
          item.kodeVarian === newItem.kodeVarian
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...newItem, id: Date.now().toString(), quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const limitStok = Math.max(0, Number(item.stok) || 0);

          if (limitStok <= 0) {
            return { ...item, stok: 0 };
          }

          const newQty = Math.max(1, Math.min(quantity, limitStok));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const syncCartStock = async () => {
    if (cartItems.length === 0) return;

    try {
      const kodeVarianList = cartItems.map((item) => item.kodeVarian);

      const res = await fetch('/api/cart/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kodeVarianList }),
      });

      if (!res.ok) {
        throw new Error('Gagal sinkron stok keranjang');
      }

      const latestVariants = await res.json();

      setCartItems((prev) =>
        prev.map((item) => {
          const latest = latestVariants.find(
            (variant: any) => variant.kodeVarian === item.kodeVarian
          );

          if (!latest) {
            return { ...item, stok: 0, quantity: 1 };
          }

          const latestStock = Number(latest.stok) || 0;

          return {
            ...item,
            stok: latestStock,
            warna: latest.warna ?? item.warna,
            ukuran: latest.ukuran ?? item.ukuran,
            harga: latest.harga ?? item.harga,
            quantity:
              latestStock <= 0 ? item.quantity : Math.min(item.quantity, latestStock),
          };
        })
      );
    } catch (error) {
      console.error('SYNC CART STOCK ERROR:', error);
    }
  };

  const clearCart = () => setCartItems([]);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCartStock,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};