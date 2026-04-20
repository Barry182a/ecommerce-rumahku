'use client';

import { useState, useEffect } from 'react';
import { getAllProducts, deleteProductAdmin } from '@/src/actions/manageProducts';
import { Search, Edit, Trash2, Package, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
export default function ProductListPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fungsi untuk memuat data
    const loadProducts = async () => {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Fungsi Hapus
    const handleDelete = async (id: string, nama: string) => {
        if (confirm(`Peringatan! Yakin ingin menghapus produk "${nama}" beserta seluruh variannya?`)) {
            const result = await deleteProductAdmin(id);
            if (result.success) {
                loadProducts(); // Refresh data jika sukses
            } else {
                alert(result.error);
            }
        }
    };

    // Fungsi Filter Pencarian (Berdasarkan Kode Unik ATAU Nama)
    const filteredProducts = products.filter((product) =>
        product.kodeUnik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-20">

            {/* HEADER & PENCARIAN (Model Standard: Menempel Penuh & Border Bawah) */}
            <div className="bg-white p-6 shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-0 mb-4">
                    <div>
                        <h1 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Daftar Produk</h1>
                    </div>
                    <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest">
                        <span>{products.length} Total Produk</span>
                    </div>
                </div>

                {/* Bar Pencarian */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari barang"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 pl-12 pr-4 py-4 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* AREA KONTEN */}
            <div className="p-4 md:p-8">

                {loading ? (
                    <p className="text-center font-bold text-gray-400 animate-pulse py-10">Memuat data produk...</p>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Tidak ada produk yang sesuai dengan pencarian.</p>
                    </div>
                ) : (
                    /* 1. Mengubah gap-4 menjadi gap-2 agar jarak antar kotak produk lebih rapat */
                    <div className="flex flex-col gap-2">
                        {filteredProducts.map((product) => {
                            const totalStok = product.varian.reduce((sum: number, v: any) => sum + v.stok, 0);
                            const hargaRupiah = new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0
                            }).format(product.hargaDasar);

                            return (
                                /* 2. Mengurangi p-3 menjadi p-2 agar kotak lebih ramping */
                                /* 3. Mengurangi gap-4 menjadi gap-3 antara foto dan teks */
                                <div key={product.id} className="bg-white p-2 pr-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow group">

                                    {/* Foto Produk (Dikecilkan sedikit jika perlu, tetap w-20 h-20 atau w-16 h-16) */}
                                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-50 relative">
                                        <img src={product.fotoUtama} alt={product.nama} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Detail Data Barang */}
                                    <div className="flex-1 min-w-0 py-0"> {/* py-1 jadi py-0 */}

                                        {/* KODE UNIK - mb-1.5 jadi mb-0.5 */}
                                        <div className="mb-0.5">
                                            <span className="inline-block bg-slate-900 text-white font-black text-[10px] px-2 py-0.5 rounded-md tracking-wider shadow-sm">
                                                {product.kodeUnik}
                                            </span>
                                        </div>

                                        {/* Nama Barang - mb-1 jadi mb-0 */}
                                        <h3 className="font-bold text-gray-800 text-xs truncate mb-0" title={product.nama}>
                                            {product.nama}
                                        </h3>

                                        {/* Harga & Stok */}
                                        <div className="flex items-center gap-x-2 text-[10px] font-semibold mt-0.5">
                                            <span className="text-blue-600">{hargaRupiah}</span>
                                            <span className="text-gray-200">|</span>
                                            <span className={`${totalStok > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                Stok: {totalStok}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tombol Aksi */}
                                    <div className="flex items-center gap-1.5 pl-2 border-l border-gray-50">
                                        <button
                                            // UBAH ONCLICK INI:
                                            onClick={() => router.push(`/admin/products?editId=${product.id}`)}
                                            className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            title="Edit Produk"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id, product.nama)}
                                            className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}