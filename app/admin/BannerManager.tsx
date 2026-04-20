'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react'; // ImageIcon dihapus
import { addBanner, deleteBanner } from './BannerActions';
import Image from 'next/image';

// PENTING: Sesuaikan path ini dengan lokasi file helper UploadThing kamu.
// Biasanya ada di '@/utils/uploadthing' atau '@/lib/uploadthing'
import { UploadDropzone } from "@/src/lib/uploadthing";

export default function BannerManager({ initialBanners }: { initialBanners: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Hanya butuh state loading

  const handleDelete = async (id: string) => {
    if (confirm("Hapus banner ini?")) {
      await deleteBanner(id);
    }
  };

  return (
    <>
      {/* Tombol Tambah & Grid Banner (TIDAK ADA PERUBAHAN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="aspect-[16/9] border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-red-600 hover:text-red-600 transition-all bg-gray-50"
        >
          <Plus size={32} />
          <span className="font-bold uppercase text-xs tracking-widest text-center">Tambah Banner Baru</span>
        </button>

        {initialBanners.map((banner) => (
          <div key={banner.id} className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden group shadow-lg">
            <Image src={banner.imageUrl} alt="Banner" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => handleDelete(banner.id)}
                className="bg-white p-4 rounded-2xl text-red-600 hover:bg-red-600 hover:text-white transition-colors"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Popup Modal (DIROMBAK) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 pt-8 pb-6">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-tighter italic">Banner Baru</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                    Upload Gambar Banner
                  </label>
                  
                  {/* Area UploadThing */}
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gray-50 p-2">
                    <UploadDropzone
                      endpoint="imageUploader" // Menggunakan endpoint dari core.ts
                      onUploadBegin={() => {
                        setLoading(true); // Tampilkan indikator loading saat upload dimulai
                      }}
                      onClientUploadComplete={async (res) => {
                        if (res && res.length > 0) {
                          // Ambil URL hasil upload
                          const uploadedUrl = res[0].url;
                          
                          // Langsung panggil Server Action kamu
                          const result = await addBanner(uploadedUrl);
                          
                          if (result.success) {
                            setIsModalOpen(false); // Tutup modal jika sukses
                          } else {
                            alert("Gagal menyimpan banner ke database");
                          }
                        }
                        setLoading(false);
                      }}
                      onUploadError={(error: Error) => {
                        alert(`Upload gagal! ${error.message}`);
                        setLoading(false);
                      }}
                      // (Opsional) Styling tambahan agar tombol upload warnanya merah menyesuaikan temamu
                      className="ut-button:bg-red-600 ut-button:ut-readying:bg-red-500/50"
                    />
                  </div>

                </div>

                {/* Teks loading tambahan jika diinginkan */}
                {loading && (
                  <p className="text-center text-xs font-bold tracking-widest text-gray-500 animate-pulse uppercase">
                    Memproses Banner...
                  </p>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}