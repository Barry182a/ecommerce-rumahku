'use client';

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;

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
      <select
        value={currentSort}
        onChange={handleSortChange}
        className="cursor-pointer bg-transparent text-sm font-Inter outline-none"
      >
        <option value="relevan">Paling Relevan</option>
        <option value="terbaru">Terbaru</option>
        <option value="termurah">Harga Terendah</option>
        <option value="termahal">Harga Tertinggi</option>
      </select>
    </div>
  );
}