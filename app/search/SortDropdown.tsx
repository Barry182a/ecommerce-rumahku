'use client';

import { useRouter } from 'next/navigation';

export default function SortDropdown({ 
  currentSort, 
  query 
}: { 
  currentSort: string; 
  query: string; 
}) {
  const router = useRouter();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    // Gunakan router.push untuk update URL tanpa refresh halaman penuh
    router.push(`/search?q=${encodeURIComponent(query)}&sort=${newSort}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      <select 
        value={currentSort}
        onChange={handleSortChange}
        className="bg-transparent outline-none text-sm font-Inter cursor-pointer"
      >
        <option value="relevan">Paling Relevan</option>
        <option value="terbaru">Terbaru</option>
        <option value="termurah">Harga Terendah</option>
        <option value="termahal">Harga Tertinggi</option>
      </select>
    </div>
  );
}