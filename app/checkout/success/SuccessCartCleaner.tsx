'use client';

import { useEffect } from 'react';
import { useCart } from '@/src/context/CartContext';

interface SuccessCartCleanerProps {
  shouldClear: boolean;
}

export default function SuccessCartCleaner({
  shouldClear,
}: SuccessCartCleanerProps) {
  const { clearCart } = useCart();

  useEffect(() => {
    if (!shouldClear) return;

    const timer = window.setTimeout(() => {
      clearCart();
      localStorage.removeItem('checkoutCart');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [shouldClear, clearCart]);

  return null;
}