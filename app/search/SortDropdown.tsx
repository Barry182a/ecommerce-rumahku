'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SortDropdown({
  currentSort,
  query,
  category,
}: {
  currentSort: string;
  query: string;
  category?: string;
}) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setIsChanging(true);

    const params = new URLSearchParams();

    if (query) {
      params.set('q', query);
    }

    if (category) {
      params.set('category', category);
    }

    params.set('sort', newSort);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <select
          value={currentSort}
          onChange={handleSortChange}
          disabled={isChanging}
          className="cursor-pointer bg-transparent text-sm font-Inter outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="relevan">Paling Relevan</option>
          <option value="terbaru">Terbaru</option>
          <option value="termurah">Harga Terendah</option>
          <option value="termahal">Harga Tertinggi</option>
        </select>

        {isChanging && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
            Memuat...
          </span>
        )}
      </div>
    </div>
  );
}