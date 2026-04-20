'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/src/context/CartContext';
import CartModal from '@/app/components/CartModal';
import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';
import { FaWhatsapp } from 'react-icons/fa';

interface ProductDetailClientProps {
  product: any;
  similarProducts?: any[];
}


export default function ProductDetailClient({
  product,
  similarProducts = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, cartItems } = useCart();

  const [isMounted, setIsMounted] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string>(product.fotoUtama);

  useEffect(() => {
    console.log('PRODUCT', product);
    console.log('VARIANTS', product.varian);
  }, [product]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. LOGIKA CERDAS UNTUK MEMISAHKAN WARNA DAN UKURAN
  const dummyValues = ['Default', '-', '', 'default'];
  const normalizeDisplayVariantValue = (value: unknown) => String(value ?? '').trim();
  // Ambil semua warna dan ukuran unik dari seluruh varian
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
  // Cek apakah warna/ukuran tersebut cuma ada 1 pilihan DAN merupakan nilai dummy ("-", "Default")
  const isColorDummy =
    allColors.length === 1 && dummyValues.includes((allColors[0] ?? '').trim());

  const isSizeDummy =
    allSizes.length === 1 && dummyValues.includes((allSizes[0] ?? '').trim());

  // 2. AUTO-SELECT DI BALIK LAYAR
  // Jika warna/ukuran adalah dummy, sistem akan otomatis memilihnya agar pembeli tidak perlu klik
  useEffect(() => {
    if (isColorDummy && allColors.length > 0) setSelectedColor(allColors[0]);
    if (isSizeDummy && allSizes.length > 0) setSelectedSize(allSizes[0]);
  }, [isColorDummy, allColors, isSizeDummy, allSizes]);

  // Daftar ukuran yang bisa dipilih bergantung pada warna yang dipilih (kecuali jika ukurannya dummy)
  const availableSizesToPick = useMemo(() => {
    if (isSizeDummy) return allSizes;
    if (!isColorDummy && !selectedColor) return [];

    return Array.from(
      new Set(
        product.varian
          .filter((v: any) => isColorDummy || v.warna === selectedColor)
          .map((v: any) => v.ukuran)
      )
    ) as string[];
  }, [product.varian, selectedColor, isColorDummy, isSizeDummy, allSizes]);

  // Reset pilihan ukuran HANYA jika pengguna mengganti warna, dan ukuran tersebut bukan dummy
  useEffect(() => {
    if (!isSizeDummy) {
      setSelectedSize('');
    }
  }, [selectedColor, isSizeDummy]);

  // 3. PENCARIAN VARIAN AKHIR
  const selectedVariant = product.varian?.find((v: any) => {
    const colorMatch = isColorDummy ? true : v.warna === selectedColor;
    const sizeMatch = isSizeDummy ? true : v.ukuran === selectedSize;
    return colorMatch && sizeMatch;
  });

  // Tombol keranjang aktif jika Warna dan Ukuran sudah terisi (baik dipilih manual maupun otomatis)
  const hasValidColor = isColorDummy || !!selectedColor;
  const hasValidSize = isSizeDummy || !!selectedSize;
  const isValidSelection = hasValidColor && hasValidSize && !!selectedVariant;

  useEffect(() => {
    console.log('VARIANT_DEBUG', {
      allColors,
      allSizes,
      selectedColor,
      selectedSize,
      selectedVariant,
      isColorDummy,
      isSizeDummy,
      isValidSelection,
    });
  }, [
    allColors,
    allSizes,
    selectedColor,
    selectedSize,
    selectedVariant,
    isColorDummy,
    isSizeDummy,
    isValidSelection,
  ]);

  const currentPrice = selectedVariant ? selectedVariant.harga : product.hargaDasar;
  const currentStock = selectedVariant ? selectedVariant.stok : 0;
  const currentImage = activeImage || product.fotoUtama;

  useEffect(() => {
    if (selectedVariant?.fotoVarian) {
      setActiveImage(selectedVariant.fotoVarian);
    }
  }, [selectedVariant]);

  // Fungsi tambah ke keranjang
  const handleAddToCart = () => {
    if (!isValidSelection || !selectedVariant) {
      alert("Silakan lengkapi pilihan produk terlebih dahulu");
      return;
    }

    addToCart({
      kodeVarian: selectedVariant.kodeVarian,
      nama: product.nama,
      // Jangan simpan ke keranjang jika itu adalah kata dummy
      warna: isColorDummy ? '' : selectedVariant.warna,
      ukuran: isSizeDummy ? '' : selectedVariant.ukuran,
      harga: selectedVariant.harga,
      foto: currentImage,
      stok: selectedVariant.stok,
    });

    alert("Berhasil ditambahkan ke keranjang");
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">

        {/* 1. PANGGIL KOMPONEN HEADER DI SINI */}
        <Header title="Detail Produk" showBack={true} showSearch={false} />

        {/* Foto Utama */}
        <div className="relative aspect-[4/3] bg-white">
          <Image src={currentImage} alt={product.nama} fill className="object-cover" priority />
        </div>

        {/* Galeri Thumbnail */}
        <div className="px-5 pt-4 pb-1 bg-white">
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
            {[product.fotoUtama, ...product.varian?.map((v: any) => v.fotoVarian).filter(Boolean)].map((img, index) => (
              <div
                key={index}
                onClick={() => setActiveImage(img)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer ${activeImage === img ? 'border-red-600' : 'border-transparent hover:border-gray-300'
                  }`}
              >
                <Image src={img} alt={`Foto ${index + 1}`} fill className="object-cover" sizes="80px" />
              </div>
            ))}
          </div>
        </div>

        {/* Info Produk */}
        <div className="p-5 pt-1 bg-white">
          <h1 className="text-xl font-Inter text-black leading-snug">{product.nama}</h1>

          <div className="mt-2">
            <p className="text-xl font-Inter text-red-600">
              Rp {currentPrice.toLocaleString('id-ID')}
            </p>

            {isValidSelection && (
              <p className="mt-1 text-sm text-gray-700">
                Stok tersisa:{' '}
                <span className="font-Inter text-green-600">{currentStock}</span>
              </p>
            )}
          </div>
        </div>

        {/* 4. BLOK PILIHAN DINAMIS (Muncul hanya jika bukan dummy) */}
        {(!isColorDummy || !isSizeDummy) && (
          <div className="p-5 bg-white mt-2 space-y-6">

            {/* Hanya tampilkan warna jika BUKAN dummy */}
            {!isColorDummy && (
              <div>
                <p className="font-Inter text-black mb-3">Pilih Warna</p>
                <div className="flex flex-wrap gap-3">
                  {allColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-6 py-3 border rounded-2xl font-medium transition-all ${selectedColor === color
                        ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                        : 'bg-white border-gray-300 text-black hover:border-gray-400'
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hanya tampilkan ukuran jika BUKAN dummy */}
            {!isSizeDummy && (
              <div>
                <p className="font-Inter text-black mb-3">Pilih Ukuran</p>
                <div className="flex flex-wrap gap-3">
                  {availableSizesToPick.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-3 border rounded-2xl font-medium transition-all ${selectedSize === size
                        ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                        : 'bg-white border-gray-300 text-black hover:border-gray-400'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
        <div className="p-5 bg-white mt-2">
          <h2 className="text-base font-Inter text-black">Deskripsi</h2>

          <p className="mt-3 text-black leading-relaxed">
            {product.deskripsi || 'Tidak ada deskripsi.'}
          </p>

          <a
            href={`https://wa.me/6281998183644?text=${encodeURIComponent(
              `Assalamualaikum, saya ingin tanya mengenai produk ini.

Nama produk: ${product.nama}
Kode produk: ${product.kodeUnik}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 transition-all hover:bg-green-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
              <FaWhatsapp size={22} />
            </div>

            <div>
              <p className="text-sm font-Inter text-green-700">Chat Penjual</p>
              <p className="text-xs leading-relaxed text-green-700/80">
                Tanya penjual via whatsapp mengenai produk ini, klik disini.
              </p>
            </div>
          </a>
        </div>

        {similarProducts.length > 0 && (
          <div className="p-5 bg-white mt-2">
            <h2 className="text-base font-Inter text-black">Produk yang mirip</h2>

            <div className="mt-4 columns-2 gap-4">
              {similarProducts.map((item: any) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white z-50">
          <div className="max-w-xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500">Total Harga</p>
              <p className="text-xl font-Inter text-red-600">
                Rp {currentPrice.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="flex items-center gap-3">

              {/* Tombol Pesan */}
              <button
                onClick={handleAddToCart}
                disabled={!isValidSelection}
                className={`flex-1 min-w-[140px] px-3 py-3 rounded-xl font-Inter text-lg transition-all ${isValidSelection
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                masukkan keranjang
              </button>
            </div>
          </div>
        </div>
      </div>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
