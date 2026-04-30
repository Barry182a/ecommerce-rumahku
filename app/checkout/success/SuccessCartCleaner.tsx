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

    clearCart();
    localStorage.removeItem('checkoutCart');
  }, [shouldClear, clearCart]);

  return null;
}