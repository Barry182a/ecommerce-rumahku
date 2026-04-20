import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    kodeUnik: string;
    nama: string;
    fotoUtama: string;
    hargaDasar: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/produk/${product.kodeUnik}`}
      className="group mb-4 block break-inside-avoid"
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
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="p-3">
          <h3 className="font-Inter text-gray-800 text-[11px] uppercase leading-relaxed break-words whitespace-normal">
            {product.nama}
          </h3>

          <p className="text-red-600 font-Inter text-sm mt-1.5">
            Rp {product.hargaDasar.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </Link>
  );
}