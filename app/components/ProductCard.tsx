import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    kodeUnik: string;
    nama: string;
    fotoUtama: string;
    hargaDasar: number;
    varian?: {
      stok: number;
    }[];
  };
}


export default function ProductCard({ product }: ProductCardProps) {

  const totalStock = Array.isArray(product.varian)
    ? product.varian.reduce((sum, variant) => sum + (Number(variant.stok) || 0), 0)
    : 0;

  const isOutOfStock = totalStock <= 0;
  return (
    <div className="group mb-4 block break-inside-avoid">
      {isOutOfStock ? (
        <div
          className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 opacity-80"
          style={{ boxShadow: '0 12px 30px rgba(0,0,0,0.14)' }}
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
            <Image
              src={product.fotoUtama}
              alt={product.nama}
              fill
              className="object-cover grayscale"
            />

            <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Habis
            </div>

            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="p-3">
            <h3 className="font-Inter text-[11px] uppercase leading-relaxed break-words whitespace-normal text-gray-800">
              {product.nama}
            </h3>

            <p className="mt-1.5 font-Inter text-sm text-gray-400 line-through">
              Rp {product.hargaDasar.toLocaleString('id-ID')}
            </p>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-600">
              Stok habis
            </p>
          </div>
        </div>
      ) : (
        <Link
          href={`/produk/${product.kodeUnik}`}
          className="block"
        >
          <div
            className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 transition-all duration-300 group-hover:-translate-y-1"
            style={{ boxShadow: '0 12px 30px rgba(0,0,0,0.14)' }}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
              <Image
                src={product.fotoUtama}
                alt={product.nama}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-3">
              <h3 className="font-Inter text-[11px] uppercase leading-relaxed break-words whitespace-normal text-gray-800">
                {product.nama}
              </h3>

              <p className="mt-1.5 font-Inter text-sm text-red-600">
                Rp {product.hargaDasar.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}