'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/src/context/CartContext';
import CartModal from '@/app/components/CartModal';
import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';
import { FaWhatsapp } from 'react-icons/fa';
import { pageContainer, pagePadding } from '@/src/lib/layout';

const formatSizeLabel = (size: string) => String(size || '').trim().toUpperCase();
interface ProductDetailClientProps {
  product: any;
  similarProducts?: any[];
}

export default function ProductDetailClient({
  product,
  similarProducts = [],
}: ProductDetailClientProps) {
  const { addToCart } = useCart();

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string>(product.fotoUtama);

  const dummyValues = ['Default', '-', '', 'default'];
  const normalizeDisplayVariantValue = (value: unknown) => String(value ?? '').trim();

  const allColors = useMemo(
    () =>
      Array.from(
        new Set(product.varian?.map((v: any) => normalizeDisplayVariantValue(v.warna)))
      ) as string[],
    [product.varian]
  );

  const allSizes = useMemo(
    () =>
      Array.from(
        new Set(product.varian?.map((v: any) => normalizeDisplayVariantValue(v.ukuran)))
      ) as string[],
    [product.varian]
  );

  const hasStockForColor = (color: string) =>
    product.varian?.some((v: any) => v.warna === color && Number(v.stok) > 0);

  const hasStockForSize = (size: string) =>
    product.varian?.some((v: any) => {
      const colorMatch = isColorDummy || v.warna === selectedColor;
      return colorMatch && v.ukuran === size && Number(v.stok) > 0;
    });

  const isColorDummy =
    allColors.length === 1 && dummyValues.includes((allColors[0] ?? '').trim());

  const isSizeDummy =
    allSizes.length === 1 && dummyValues.includes((allSizes[0] ?? '').trim());

  useEffect(() => {
    if (isColorDummy && allColors.length > 0) setSelectedColor(allColors[0]);
    if (isSizeDummy && allSizes.length > 0) setSelectedSize(allSizes[0]);
  }, [isColorDummy, allColors, isSizeDummy, allSizes]);

  const availableSizesToPick = useMemo(() => {
    if (isSizeDummy) return allSizes.filter((size) => hasStockForSize(size));
    if (!isColorDummy && !selectedColor) return [];

    return Array.from(
      new Set(
        product.varian
          .filter((v: any) => {
            const colorMatch = isColorDummy || v.warna === selectedColor;
            return colorMatch && Number(v.stok) > 0;
          })
          .map((v: any) => v.ukuran)
      )
    ) as string[];
  }, [product.varian, selectedColor, isColorDummy, isSizeDummy, allSizes]);

  useEffect(() => {
    if (!isSizeDummy) setSelectedSize('');
  }, [selectedColor, isSizeDummy]);

  const selectedVariant = product.varian?.find((v: any) => {
    const colorMatch = isColorDummy ? true : v.warna === selectedColor;
    const sizeMatch = isSizeDummy ? true : v.ukuran === selectedSize;
    return colorMatch && sizeMatch && Number(v.stok) > 0;
  });
  const totalStock = Array.isArray(product.varian)
    ? product.varian.reduce((sum: number, variant: any) => sum + (Number(variant.stok) || 0), 0)
    : 0;

  const isProductOutOfStock = totalStock <= 0;
  const hasValidColor = isColorDummy || !!selectedColor;
  const hasValidSize = isSizeDummy || !!selectedSize;
  const isValidSelection = hasValidColor && hasValidSize && !!selectedVariant;

  const currentPrice = selectedVariant ? selectedVariant.harga : product.hargaDasar;
  const currentStock = selectedVariant ? selectedVariant.stok : 0;
  const currentImage = activeImage || product.fotoUtama;


  useEffect(() => {
    if (selectedVariant?.fotoVarian) setActiveImage(selectedVariant.fotoVarian);
  }, [selectedVariant]);

  const handleAddToCart = () => {
    if (!isValidSelection || !selectedVariant) {
      alert('Silakan lengkapi pilihan produk terlebih dahulu');
      return;
    }

    addToCart({
      kodeVarian: selectedVariant.kodeVarian,
      nama: product.nama,
      warna: isColorDummy ? '' : selectedVariant.warna,
      ukuran: isSizeDummy ? '' : selectedVariant.ukuran,
      harga: selectedVariant.harga,
      foto: currentImage,
      stok: selectedVariant.stok,
    });

    alert('Berhasil ditambahkan ke keranjang');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-28">
        <Header title="Detail Produk" showBack={false} showSearch={false} showWhatsapp={false} showCart={true} />

        <main className={`${pageContainer} bg-white`}>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-white">
              <div className="relative aspect-[4/4] bg-white md:sticky md:top-[88px]">
                <Image
                  src={currentImage}
                  alt={product.nama}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="bg-white px-4 pb-3 pt-4 sm:px-5 md:px-6">
                <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                  {[product.fotoUtama, ...product.varian?.map((v: any) => v.fotoVarian).filter(Boolean)].map(
                    (img, index) => (
                      <div
                        key={index}
                        onClick={() => setActiveImage(img)}
                        className={`relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 ${activeImage === img
                          ? 'border-red-600'
                          : 'border-transparent hover:border-gray-300'
                          }`}
                      >
                        <Image
                          src={img}
                          alt={`Foto ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-gray-50">
              <div className="bg-white p-4 sm:p-5 md:p-6">
                <h1 className="text-xl leading-snug text-black sm:text-2xl lg:text-3xl">
                  {product.nama}
                </h1>

                <div className="mt-3">
                  <p className="text-xl text-red-600 sm:text-2xl lg:text-3xl">
                    Rp {currentPrice.toLocaleString('id-ID')}
                  </p>

                  {isProductOutOfStock && (
                    <p className="mt-2 text-sm font-semibold text-red-600">
                      Produk ini sedang habis
                    </p>
                  )}

                  {isValidSelection && (
                    <p className="mt-2 text-sm text-gray-700">
                      Stok tersisa:{' '}
                      <span className="text-green-600">{currentStock}</span>
                    </p>
                  )}
                </div>
              </div>

              {(!isColorDummy || !isSizeDummy) && (
                <div className="space-y-6 bg-white p-4 sm:p-5 md:p-6">
                  {!isColorDummy && (
                    <div>
                      <p className="mb-3 text-black">Pilih Warna</p>
                      <div className="flex flex-wrap gap-3">
                        {allColors.map((color) => {
                          const disabled = !hasStockForColor(color);

                          return (
                            <button
                              key={color}
                              onClick={() => !disabled && setSelectedColor(color)}
                              disabled={disabled}
                              className={`rounded-2xl border px-5 py-3 font-medium transition-all ${disabled
                                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                                : selectedColor === color
                                  ? 'border-red-600 bg-red-600 text-white shadow-sm shadow-red-200'
                                  : 'border-gray-300 bg-white text-black hover:border-gray-400'
                                }`}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!isSizeDummy && (
                    <div>
                      <p className="mb-3 text-black">Pilih Ukuran</p>
                      <div className="flex flex-wrap gap-3">
                        {availableSizesToPick.map((size) => {
                          const disabled = !hasStockForSize(size);

                          return (
                            <button
                              key={size}
                              onClick={() => !disabled && setSelectedSize(size)}
                              disabled={disabled}
                              className={`rounded-2xl border px-5 py-3 font-medium transition-all ${disabled
                                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                                : selectedSize === size
                                  ? 'border-red-600 bg-red-600 text-white shadow-sm shadow-red-200'
                                  : 'border-gray-300 bg-white text-black hover:border-gray-400'
                                }`}
                            >
                              {formatSizeLabel(size)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white p-4 sm:p-5 md:p-6">
                <h2 className="text-base text-black">Deskripsi</h2>

                <p className="mt-3 leading-relaxed text-black">
                  {product.deskripsi || 'Tidak ada deskripsi.'}
                </p>

                <a
                  href={`https://wa.me/6281998183644?text=${encodeURIComponent(
                    `Assalamualaikum, saya ingin tanya mengenai produk ini.\n\nNama produk: ${product.nama}\nKode produk: ${product.kodeUnik}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 transition-all hover:bg-green-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
                    <FaWhatsapp size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-green-700">Chat Penjual</p>
                    <p className="text-xs leading-relaxed text-green-700/80">
                      Tanya penjual via whatsapp mengenai produk ini, klik disini.
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {similarProducts.length > 0 && (
            <div className="mt-2 bg-white p-4 sm:p-5 md:p-6">
              <h2 className="text-base text-black">Produk yang mirip</h2>

              <div className="mt-4 columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
                {similarProducts.map((item: any) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </div>
          )}
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white">
          <div className={`${pageContainer} ${pagePadding} flex items-center justify-between gap-4 py-3`}>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Total Harga</p>
              <p className="text-lg text-red-600 sm:text-xl">
                Rp {currentPrice.toLocaleString('id-ID')}
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isValidSelection || isProductOutOfStock || currentStock <= 0}
              className={`min-w-[150px] rounded-xl px-4 py-3 text-sm font-medium transition-all sm:min-w-[180px] sm:text-base ${!isValidSelection || isProductOutOfStock || currentStock <= 0
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
              Masukkan Keranjang
            </button>
          </div>
        </div>
      </div>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}