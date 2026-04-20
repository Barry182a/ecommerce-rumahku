'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CartModal from './CartModal';
import SearchBar from './SearchBar';

type HeaderProps = {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
};

export default function Header({
  title = 'Marsi',
  showBack = false,
  showSearch = true,
}: HeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  const updateCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  useEffect(() => {
    setIsMounted(true);
    updateCart();
    window.addEventListener('storage', updateCart);
    return () => window.removeEventListener('storage', updateCart);
  }, []);

  return (
    <>
      <header className="sticky top-0 bg-white z-50 border-b border-gray-100 max-w-md mx-auto shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <ArrowLeft size={22} />
              </button>
            )}

            <h1 className="font-semibold text-xl text-red-600 truncate">
              {title}
            </h1>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative p-3 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 transition-colors active:scale-95"
          >
            <ShoppingCart size={14} />
            {isMounted && cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {showSearch && (
          <div className="px-4 pb-1.5">
            <SearchBar />
          </div>
        )}
      </header>

      {isOpen && (
        <CartModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}