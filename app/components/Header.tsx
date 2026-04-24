'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import CartModal from './CartModal';
import SearchBar from './SearchBar';
import { pageContainer, pagePadding } from '@/src/lib/layout';

type HeaderProps = {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showWhatsapp?: boolean;
  showCart?: boolean;
};

export default function Header({
  title = 'Marsi',
  showBack = false,
  showSearch = true,
  showWhatsapp = true,
  showCart = true,
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
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className={pageContainer}>
          <div className={`flex items-center justify-between py-4 ${pagePadding}`}>
            <div className="flex min-w-0 items-center gap-3">
              {showBack && (
                <button
                  onClick={() => router.back()}
                  className="rounded-full p-2 text-gray-700 transition hover:bg-gray-100"
                >
                  <ArrowLeft size={22} />
                </button>
              )}

              <h1 className="truncate text-lg font-semibold text-red-600 sm:text-xl md:text-2xl">
                {title}
              </h1>
            </div>

            {(showWhatsapp || showCart) && (
              <div className="flex items-center gap-3">
                {showWhatsapp && (
                  <a
                    href="https://wa.me/6281998183644"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 transition-colors hover:text-green-700 active:scale-95"
                    aria-label="Tanya Penjual"
                  >
                    <FaWhatsapp size={20} />
                    <span className="whitespace-nowrap text-sm font-medium">
                      Tanya Penjual
                    </span>
                  </a>
                )}

                {showCart && (
                  <button
                    onClick={() => setIsOpen(true)}
                    className="relative rounded-2xl border border-gray-300 p-3 text-gray-700 transition-colors hover:bg-gray-50 active:scale-95"
                  >
                    <ShoppingCart size={16} />
                    {isMounted && cartItems.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 text-[10px] font-bold text-white">
                        {cartItems.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {showSearch && (
            <div className={`${pagePadding} pb-2`}>
              <SearchBar />
            </div>
          )}
        </div>
      </header>

      {showCart && isOpen && (
        <CartModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}