'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { getSearchSuggestions } from '@/src/actions/searchActions';
import Image from 'next/image';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await getSearchSuggestions(query);
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      {/* Kotak Input */}
      <form
        onSubmit={handleSearch}
        /* - border-transparent & focus-within:border-transparent: Menghapus garis merah saat diklik.
           - py-0 & pr-0: Memastikan tidak ada jarak antara border form dengan tombol.
           - items-stretch: Memaksa tombol mengisi seluruh tinggi form.
           - overflow-hidden: Penting agar tombol ikut melengkung di pojok kanan mengikuti rounded-2xl.
        */
        className="flex items-stretch bg-gray-100 pl-2 pr-0 md:pl-4 rounded-2xl border border-transparent focus-within:bg-white transition-all shadow-sm overflow-hidden"
      >
        {/* Ikon Search */}
        <div className="flex items-center">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && suggestions.length > 0 && setIsOpen(true)}
          placeholder="Cari produk pilihanmu..."
          /* py-3 memberikan tinggi bar yang ideal */
          className="bg-transparent w-full outline-none py-2 px-2 text-sm font-Inter text-gray-800 placeholder:text-gray-400"
        />

        {/* Spinner Loading */}
        {isLoading && (
          <div className="flex items-center px-2">
            <Loader2 size={16} className="animate-spin text-red-500 flex-shrink-0" />
          </div>
        )}

        {/* TOMBOL CARI (Sudah Pas Atas-Bawah & Samping) */}
        <button
          type="submit"
          /* - h-auto: Mengikuti tinggi kontainer form secara otomatis.
             - rounded-none: Menghilangkan rounding default agar sisi kiri tombol rata dengan input.
          */
          className="bg-red-600 text-white px-6 flex items-center justify-center rounded-none text-[10px] font-black uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all flex-shrink-0"
        >
          Cari
        </button>
      </form>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <ul>
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(item.nama);
                    setIsOpen(false);
                    router.push(`/search?q=${encodeURIComponent(item.nama)}`);
                  }}
                  /* PERUBAHAN: 
                     Ditambahkan 'flex justify-start items-center' agar isi tombol mutlak di kiri 
                  */
                  className="w-full flex justify-start items-center text-left p-3 px-6 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0"
                >
                  <span className="block text-sm font-Inter text-gray-700 line-clamp-1 text-left">
                    {item.nama}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}