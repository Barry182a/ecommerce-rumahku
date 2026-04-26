'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createProduct } from '@/src/actions/createProduct';
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Plus, Trash2, Package, X, Save } from 'lucide-react';
import { getCategories } from '@/src/actions/getCategories';
import { getProductById, updateProductAdmin } from '@/src/actions/manageProducts';

interface Variant {
  warna: string;
  ukuran: string;
  harga: number;
  stok: number;
  fotoVarian: string;
}

const DEFAULT_VARIANT_VALUE = 'Default';

function normalizeVariantText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeVariantField(value: unknown) {
  return normalizeVariantText(value);
}

function normalizeVariantPhoto(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeVariantNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isVariantCompletelyEmpty(variant: Variant) {
  const warna = normalizeVariantText(variant.warna);
  const ukuran = normalizeVariantText(variant.ukuran);
  const fotoVarian = normalizeVariantPhoto(variant.fotoVarian);
  const harga = normalizeVariantNumber(variant.harga, 0);
  const stok = normalizeVariantNumber(variant.stok, 0);

  return warna === '' && ukuran === '' && fotoVarian === '' && harga === 0 && stok === 0;
}

function normalizeVariantsForSave(variants: Variant[], hargaDasar: number): Variant[] {
  const filled = variants
    .filter((variant) => !isVariantCompletelyEmpty(variant))
    .map((variant) => ({
      warna: normalizeVariantField(variant.warna),
      ukuran: normalizeVariantField(variant.ukuran),
      harga: normalizeVariantNumber(variant.harga, hargaDasar || 0),
      stok: Math.max(0, normalizeVariantNumber(variant.stok, 0)),
      fotoVarian: normalizeVariantPhoto(variant.fotoVarian),
    }));

  if (filled.length === 0) {
    return [
      {
        warna: DEFAULT_VARIANT_VALUE,
        ukuran: DEFAULT_VARIANT_VALUE,
        harga: Math.max(0, normalizeVariantNumber(hargaDasar, 0)),
        stok: 0,
        fotoVarian: '',
      },
    ];
  }

  const deduped = new Map<string, Variant>();

  for (const variant of filled) {
    const key = `${variant.warna.toLowerCase()}__${variant.ukuran.toLowerCase()}`;
    deduped.set(key, variant);
  }

  return Array.from(deduped.values());
}

function isRealVariantValue(value: unknown) {
  const cleaned = normalizeVariantText(value).toLowerCase();
  return cleaned !== '' && cleaned !== DEFAULT_VARIANT_VALUE.toLowerCase() && cleaned !== '-';
}

function hasVariantIdentity(variant: Variant) {
  return isRealVariantValue(variant.warna) || isRealVariantValue(variant.ukuran);
}

function getVariantPattern(variant: Variant) {
  const hasWarna = isRealVariantValue(variant.warna);
  const hasUkuran = isRealVariantValue(variant.ukuran);

  if (hasWarna && hasUkuran) return 'WARNA_UKURAN';
  if (hasWarna) return 'WARNA';
  if (hasUkuran) return 'UKURAN';
  return 'EMPTY';
}

function getMixedVariantPatternError(variants: Variant[]) {
  const filledVariants = variants.filter((variant) => !isVariantCompletelyEmpty(variant));

  if (filledVariants.length <= 1) return null;

  const patterns = Array.from(
    new Set(
      filledVariants
        .map((variant) => getVariantPattern(variant))
        .filter((pattern) => pattern !== 'EMPTY')
    )
  );

  if (patterns.length <= 1) return null;

  return 'Semua varian dalam satu produk harus konsisten. Jika satu varian memakai warna dan ukuran, maka semua varian wajib memakai warna dan ukuran juga.';
}

export default function ProductPage() {
  const [kodeUnik, setKodeUnik] = useState('');
  const [nama, setNama] = useState('');
  const [hargaDasar, setHargaDasar] = useState(0);
  const [deskripsi, setDeskripsi] = useState('');
  const [fotoUtama, setFotoUtama] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<{ id: string, nama: string }[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [keywords, setKeywords] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('editId');
  const isEditMode = !!editId;

  // Menyimpan harga dasar sebelumnya untuk referensi update sinkronisasi
  const previousHargaDasar = useRef(0);

  useEffect(() => {
    async function loadCategories() {
      const data = await getCategories();
      setCategories(data);
    }
    loadCategories();
  }, []);

  // Memuat data saat Edit Mode
  useEffect(() => {
    async function loadDataForEdit() {
      if (editId) {
        const productData = await getProductById(editId);
        if (productData) {
          setKodeUnik(productData.kodeUnik);
          setNama(productData.nama);
          setHargaDasar(productData.hargaDasar);
          previousHargaDasar.current = productData.hargaDasar; // Simpan untuk referensi
          setDeskripsi(productData.deskripsi || '');
          setFotoUtama(productData.fotoUtama);
          setCategoryId(productData.categoryId || '');
          setKeywords(productData.keywords || '');

          // Filter varian default agar tidak muncul di form (biar rapi)
          const isSingleDefault =
            productData.varian.length === 1 &&
            normalizeVariantField(productData.varian[0].warna) === DEFAULT_VARIANT_VALUE &&
            normalizeVariantField(productData.varian[0].ukuran) === DEFAULT_VARIANT_VALUE;

          if (!isSingleDefault) {
            const formattedVariants = productData.varian.map((v: any) => ({
              warna: isRealVariantValue(v.warna) ? normalizeVariantText(v.warna) : '',
              ukuran: isRealVariantValue(v.ukuran) ? normalizeVariantText(v.ukuran) : '',
              harga: normalizeVariantNumber(v.harga, productData.hargaDasar),
              stok: Math.max(0, normalizeVariantNumber(v.stok, 0)),
              fotoVarian: normalizeVariantPhoto(v.fotoVarian),
            }));
            setVariants(formattedVariants);
          }
        }
      }
    }
    loadDataForEdit();
  }, [editId]);

  // === PERBAIKAN UX: SINKRONISASI HARGA ===
  // Jika admin mengetik harga dasar baru, otomatis ubah harga varian yang nilainya "sama dengan harga dasar lama"
  useEffect(() => {
    if (variants.length > 0 && hargaDasar !== previousHargaDasar.current) {
      setVariants((prevVariants) =>
        prevVariants.map((v) => {
          // Hanya update varian yang harganya belum dimodifikasi secara khusus (masih ngikut harga dasar lama)
          if (v.harga === previousHargaDasar.current || v.harga === 0) {
            return { ...v, harga: hargaDasar };
          }
          return v;
        })
      );
    }
    previousHargaDasar.current = hargaDasar;
  }, [hargaDasar]);


  const addVariant = () => {
    setVariants([
      ...variants,
      {
        warna: '',
        ukuran: '',
        harga: hargaDasar,
        stok: 0,
        fotoVarian: '',
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];

    let nextValue = value;

    if (field === 'warna' || field === 'ukuran') {
      nextValue = String(value ?? '');
    }

    if (field === 'harga') {
      nextValue = Math.max(0, Math.round(Number(value) || 0));
    }

    if (field === 'stok') {
      nextValue = Math.max(0, Number(value) || 0);
    }

    if (field === 'fotoVarian') {
      nextValue = String(value ?? '').trim();
    }

    newVariants[index] = { ...newVariants[index], [field]: nextValue };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoUtama) return alert('Harap upload foto utama produk!');

    const normalizedVariants = normalizeVariantsForSave(variants, hargaDasar);

    const filledVariants = variants.filter((variant) => !isVariantCompletelyEmpty(variant));

    if (filledVariants.length > 1) {
      const invalidIndex = filledVariants.findIndex((variant) => !hasVariantIdentity(variant));

      if (invalidIndex !== -1) {
        return alert(
          `Varian ke-${invalidIndex + 1} harus mengisi warna atau ukuran. Tidak boleh hanya mengisi harga, stok, atau jumlah saja.`
        );
      }

      const mixedPatternError = getMixedVariantPatternError(filledVariants);
      if (mixedPatternError) {
        return alert(mixedPatternError);
      }
    }

    const payload = {
      kodeUnik: kodeUnik.trim(),
      nama: nama.trim(),
      keywords: keywords.trim(),
      deskripsi: deskripsi.trim() || 'Tidak ada deskripsi',
      hargaDasar: Math.max(0, Math.round(Number(hargaDasar) || 0)),
      fotoUtama: fotoUtama.trim(),
      variants: normalizedVariants,
      categoryId: categoryId === '' ? undefined : categoryId,
    };
    if (normalizedVariants.some((v) => v.stok < 0)) {
      return alert('Stok varian tidak boleh negatif');
    }

    try {
      if (isEditMode && editId) {
        const res = await updateProductAdmin(editId, payload);
        if (res.success) {
          alert('Produk berhasil diupdate!');
          router.push('/admin/products/list');
        } else {
          alert(res.error);
        }
      } else {
        await createProduct(payload);
        alert('Produk berhasil disimpan!');
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto bg-white min-h-screen pb-20">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">
        {isEditMode ? 'Edit Data Produk' : 'Tambah Produk Baru'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto Utama */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Foto Utama Produk</label>
          <div className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            {fotoUtama ? (
              <div className="relative group">
                <img src={fotoUtama} className="w-48 h-48 object-cover rounded-xl shadow-lg" />
                <button
                  type="button"
                  onClick={() => setFotoUtama('')}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <UploadButton<OurFileRouter, "imageUploader">
                endpoint="imageUploader"
                onClientUploadComplete={(res) => setFotoUtama(res[0].url)}
              />
            )}
          </div>
        </div>

        {/* Identitas Produk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kode Unik</label>
            <input placeholder="Contoh: KOS001" value={kodeUnik} onChange={(e) => setKodeUnik(e.target.value)} className="border-2 p-3 rounded-xl w-full outline-none focus:border-blue-500 transition-all" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Harga Dasar (Rp)</label>
            {/* Input harga dipaksa membuang desimal jika pengguna salah ketik koma/titik */}
            <input placeholder="0" type="number" value={hargaDasar || ''} onChange={(e) => setHargaDasar(Math.round(Number(e.target.value)))} onWheel={(e) => e.currentTarget.blur()} className="border-2 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nama Produk</label>
          <input placeholder="Nama Lengkap Produk" value={nama} onChange={(e) => setNama(e.target.value)} onWheel={(e) => e.currentTarget.blur()} className="border-2 p-3 rounded-xl w-full outline-none focus:border-blue-500" required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kategori Produk</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border-2 p-3 rounded-xl w-full outline-none focus:border-blue-500 bg-white"
          >
            <option value="">-- Pilih Kategori (Opsional) --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">
            Kata Kunci barang
          </label>
          <input
            placeholder="Contoh: baju, kemeja, atasan,(dengan koma)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="border-2 p-3 rounded-xl w-full outline-none focus:border-blue-500 transition-all shadow-sm"
          />
          <p className="text-[10px] text-gray-400 ml-1 italic">
            *Membantu pencarian produk tetap akurat meskipun pembeli salah ketik.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Deskripsi</label>
          <textarea placeholder="Ceritakan detail produk ini..." value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="border-2 p-3 rounded-xl w-full min-h-[120px] outline-none focus:border-blue-500" />
        </div>

        {/* Tombol Kelola Varian */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center justify-between w-full p-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <Package size={22} />
            <span>Kelola Varian Produk</span>
          </div>
          <span className="bg-blue-500 px-3 py-1 rounded-full text-xs">{variants.length} Varian</span>
        </button>

        {/* Submit */}
        <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
          <Save size={20} />
          Simpan Seluruh Data
        </button>
      </form>

      {/* MODAL POPUP VARIAN (DESAIN BARU) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-gray-100 w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">

            {/* Header Modal */}
            <div className="p-8 border-b bg-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-800">Daftar Varian</h2>
                <p className="text-sm text-gray-500">Tambahkan warna, ukuran, dan stok spesifik</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Area List Varian (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {variants.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Belum ada varian. Klik tombol di bawah untuk menambah.</p>
                </div>
              ) : (
                variants.map((v, index) => (
                  <div key={index} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-200 relative group animate-in fade-in slide-in-from-bottom-4">
                    <button
                      onClick={() => removeVariant(index)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Bagian Foto Varian */}
                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Foto Varian</label>
                        <div className="relative aspect-square rounded-2xl bg-gray-50 border-2 border-dashed flex flex-col items-center justify-center overflow-hidden">
                          {v.fotoVarian ? (
                            <>
                              <img src={v.fotoVarian} className="w-full h-full object-cover" />
                              <button
                                onClick={() => updateVariant(index, 'fotoVarian', '')}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              >
                                <X size={24} />
                              </button>
                            </>
                          ) : (
                            <UploadButton<OurFileRouter, "imageUploader">
                              endpoint="imageUploader"
                              onClientUploadComplete={(res) => updateVariant(index, 'fotoVarian', res[0].url)}
                              appearance={{
                                button: "bg-blue-50 text-blue-600 border-none shadow-none text-xs px-4 h-10",
                                allowedContent: "hidden"
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Bagian Input Data Varian */}
                      <div className="md:col-span-8 grid grid-cols-2 gap-4 content-center">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Warna</label>
                          <input
                            placeholder="Misal: Merah"
                            value={v.warna}
                            onChange={(e) => updateVariant(index, 'warna', e.target.value)}
                            onBlur={(e) => updateVariant(index, 'warna', e.target.value.trim())}
                            className="border-2 p-3 rounded-xl w-full text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Ukuran</label>
                          <input
                            placeholder="Misal: XL / 42"
                            value={v.ukuran}
                            onChange={(e) => updateVariant(index, 'ukuran', e.target.value)}
                            onBlur={(e) => updateVariant(index, 'ukuran', e.target.value.trim())}
                            className="border-2 p-3 rounded-xl w-full text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Harga (Rp)</label>
                          {/* Input harga varian dipaksa membuang desimal */}
                          <input placeholder="0" type="number" value={v.harga || ''} onChange={(e) => updateVariant(index, 'harga', Math.round(Number(e.target.value)))} onWheel={(e) => e.currentTarget.blur()} className="border-2 p-3 rounded-xl w-full text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Stok Barang</label>
                          <input placeholder="0" type="number" value={v.stok || ''} onChange={(e) => updateVariant(index, 'stok', Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className="border-2 p-3 rounded-xl w-full text-sm outline-none focus:border-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Tombol Tambah (+) */}
              <button
                type="button"
                onClick={addVariant}
                className="w-full flex flex-col items-center justify-center py-10 border-4 border-dashed border-gray-200 rounded-[2rem] text-gray-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-all group"
              >
                <Plus size={40} className="group-hover:scale-125 transition-transform" />
                <span className="text-sm font-bold mt-2">Tambah Varian Baru</span>
              </button>
            </div>

            {/* Footer Modal */}
            <div className="p-8 border-t bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Selesai & Simpan Sementara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}