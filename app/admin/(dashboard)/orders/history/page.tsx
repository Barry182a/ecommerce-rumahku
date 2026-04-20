'use client';
import { useState, useEffect } from 'react';
import { Package, CheckCircle2, XCircle, Search, Calendar } from 'lucide-react';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        // Ambil hanya yang sudah SELESAI atau BATAL
        const historyData = data.filter((o: any) => o.isCompleted || o.isCanceled);
        setOrders(historyData);
      });
  }, []);

  // Logika Filter & Search
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.namaPembeli.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'COMPLETED') return matchesSearch && order.isCompleted;
    if (filterStatus === 'CANCELLED') return matchesSearch && order.isCanceled;
    return matchesSearch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-800">Riwayat Pesanan</h1>
          <p className="text-gray-500">Arsip seluruh transaksi yang telah diproses</p>
        </header>

        {/* Bar Pencarian & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Cari nama pembeli atau ID pesanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === status 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
              >
                {status === 'ALL' ? 'SEMUA' : status === 'COMPLETED' ? 'SELESAI' : 'BATAL'}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Riwayat */}
        <div className="grid gap-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm">
              <Package size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">Tidak ada riwayat yang ditemukan</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${order.isCompleted ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {order.isCompleted ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.orderId}</p>
                    <h3 className="font-bold text-gray-800 uppercase">{order.namaPembeli}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar size={12} />
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p className="font-black text-gray-800">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                    order.isCompleted 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                  }`}>
                    {order.isCompleted ? 'Berhasil' : 'Dibatalkan'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}