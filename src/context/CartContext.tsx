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
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

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
        const limitStok = item.stok || 1; 
        const newQty = Math.max(1, Math.min(quantity, limitStok));
        return { ...item, quantity: newQty };
      }
      return item;
    })
  );
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