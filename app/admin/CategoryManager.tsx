'use client';

import { useState, useEffect } from 'react';
import { getCategories, addCategory, deleteCategory } from '@/src/actions/categoryActions';
// Kita hanya butuh icon umum untuk tombol UI, bukan untuk gambar kategori lagi
import { Plus, Trash2, ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  nama: string;
  icon: string | null;
}

// 1. DAFTAR PEMETAAN GAMBAR (Pastikan isinya SAMA PERSIS dengan yang di HomeClient.tsx)
const CATEGORY_IMAGE_OPTIONS = [
  { name: 'Shirt', imagePath: '/category-images/baju.jpg' },
  { name: 'ShoppingBag', imagePath: '/category-images/tas.jpg' },
  { name: 'Home', imagePath: '/category-images/perabotan.png' },
  { name: 'Book', imagePath: '/category-images/buku.jpg' },
  { name: 'Cloth', imagePath: '/category-images/pakaian-wanita.webp' },
];

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [namaKategori, setNamaKategori] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Tags'); // State untuk menyimpan 'nama' icon
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori.trim()) return;

    setLoading(true);
    // Yang disimpan ke database tetap Teks-nya (misal: 'Shirt')
    const result = await addCategory(namaKategori, selectedIcon);

    if (result.success) {
      setNamaKategori('');
      setSelectedIcon('Tags'); // Reset ke default
      loadCategories();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Hapus kategori "${nama}"?`)) {
      const result = await deleteCategory(id);
      if (result.success) {
        loadCategories();
      } else {
        alert(result.error);
      }
    }
  };

  // 2. Helper untuk me-render gambar di daftar kategori tersimpan
  const renderIcon = (iconName: string | null) => {
    const foundImage = CATEGORY_IMAGE_OPTIONS.find((i) => i.name === iconName);
    const imgSrc = foundImage ? foundImage.imagePath : '/category-images/default.png';
    return (
      <img
        src={imgSrc}
        alt={iconName || 'Kategori'}
        className="w-5 h-5 object-contain"
      />
    );
  };

  return (
    <div className="p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-lg mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
          <ImageIcon size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Kategori Produk</h2>
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Kelola kelompok produk dan gambarnya</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-4 mb-8">

        {/* Pilihan Gambar (Full Cover) */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">1. Pilih Gambar Kategori</label>
          <div className="flex flex-wrap gap-3">
            {CATEGORY_IMAGE_OPTIONS.map((item) => {
              const isSelected = selectedIcon === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedIcon(item.name)}
                  // Gunakan w-16 h-16, rounded-xl, overflow-hidden. HAPUS padding (p-...).
                  className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden transition-all ${isSelected
                      ? 'ring-4 ring-blue-500 shadow-lg scale-105'
                      : 'border border-gray-200 hover:border-blue-300'
                    }`}
                  title={item.name}
                >
                  {/* Gambar pakai w-full h-full object-cover rounded-xl */}
                  <img src={item.imagePath} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Nama Kategori */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="2. Nama Kategori (Contoh: Pakaian Pria)"
            value={namaKategori}
            onChange={(e) => setNamaKategori(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 p-4 rounded-2xl text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[140px]"
          >
            {loading ? 'Menyimpan...' : (
              <>
                <Plus size={18} />
                Tambah
              </>
            )}
          </button>
        </div>
      </form>

      {/* Daftar Kategori dengan Gambar Masing-Masing */}
      <div className="flex flex-wrap gap-3">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 font-medium italic w-full text-center py-4">Belum ada kategori yang ditambahkan.</p>
        ) : (
          categories.map((kat) => (
            <div key={kat.id} className="flex items-center gap-2 bg-white border border-gray-200 pl-2 pr-2 py-1.5 rounded-full shadow-sm group hover:border-blue-300 transition-all">

              {/* Tempat Gambar Ditampilkan */}
              <div className="bg-gray-50 p-1.5 rounded-full border border-gray-100">
                {renderIcon(kat.icon)}
              </div>

              <span className="text-sm font-bold text-gray-700 pr-2">{kat.nama}</span>

              <button
                type="button"
                onClick={() => handleDelete(kat.id, kat.nama)}
                className="bg-gray-50 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}