'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/app/components/Header';
import FooterNav from '@/app/components/FooterNav';
import Link from 'next/link';
import { pageContainer, pagePadding } from '@/src/lib/layout';

const formatSizeLabel = (size?: string) => String(size || '').trim().toUpperCase();

type CustomerOrder = {
    orderId: string;
    paymentMethod: 'cod' | 'midtrans';
    paymentStatus: string;
    items: any[];
    totalAmount: number;
    midtransRedirectUrl?: string | null;
    createdAt: string;
    paidAt?: string | null;
    expiredAt?: string | null;
    cancelledAt?: string | null;
    midtransPaymentType?: string | null;
    isCompleted?: boolean;
    isCanceled?: boolean;
};

function getPaymentStatusText(order: CustomerOrder) {
    if (order.isCanceled) return 'Pembayaran batal';
    if (order.isCompleted) return 'Pembayaran selesai';

    if (order.paymentMethod === 'cod') return 'Pembayaran ditunda';
    if (order.paymentStatus === 'paid') return 'Pembayaran berhasil';
    if (order.paymentStatus === 'expired') return 'Pembayaran kedaluwarsa';
    if (order.paymentStatus === 'failed') return 'Pembayaran gagal';

    return 'Pembayaran ditunda';
}

function getPaymentBadgeClass(order: CustomerOrder) {
    if (order.isCanceled) return 'bg-red-100 text-red-700';
    if (order.isCompleted) return 'bg-green-100 text-green-700';

    if (order.paymentStatus === 'paid') return 'bg-green-100 text-green-700';
    if (order.paymentStatus === 'expired' || order.paymentStatus === 'failed') {
        return 'bg-red-100 text-red-700';
    }

    return 'bg-yellow-100 text-yellow-700';
}

export default function PesananPage() {
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const syncOrdersFromServer = async () => {
        const savedOrders: CustomerOrder[] = JSON.parse(
            localStorage.getItem('customer_orders') || '[]'
        );

        if (savedOrders.length === 0) {
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            const ids = savedOrders.map((o) => o.orderId).join(',');
            const res = await fetch(`/api/orders/history?ids=${encodeURIComponent(ids)}`, {
                cache: 'no-store',
            });

            const serverOrders = await res.json();

            const mergedOrders = savedOrders.map((localOrder) => {
                const serverOrder = serverOrders.find(
                    (order: any) => order.orderId === localOrder.orderId
                );

                if (!serverOrder) return localOrder;

                return {
                    ...localOrder,
                    paymentMethod: serverOrder.paymentMethod || localOrder.paymentMethod,
                    paymentStatus: serverOrder.paymentStatus || localOrder.paymentStatus,
                    totalAmount: serverOrder.totalAmount ?? localOrder.totalAmount,
                    items: Array.isArray(serverOrder.items) ? serverOrder.items : localOrder.items,
                    createdAt: serverOrder.createdAt || localOrder.createdAt,
                    paidAt: serverOrder.paidAt || null,
                    expiredAt: serverOrder.expiredAt || null,
                    cancelledAt: serverOrder.cancelledAt || null,
                    midtransRedirectUrl:
                        serverOrder.midtransRedirectUrl || localOrder.midtransRedirectUrl || null,
                    midtransPaymentType: serverOrder.midtransPaymentType || null,
                    isCompleted: serverOrder.isCompleted ?? localOrder.isCompleted ?? false,
                    isCanceled: serverOrder.isCanceled ?? localOrder.isCanceled ?? false,
                };
            });

            localStorage.setItem('customer_orders', JSON.stringify(mergedOrders));
            setOrders(mergedOrders);
        } catch (error) {
            console.error('Gagal sinkron status pesanan:', error);
            setOrders(savedOrders);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        syncOrdersFromServer();

        const interval = setInterval(() => {
            syncOrdersFromServer();
        }, 15000);

        const onFocus = () => syncOrdersFromServer();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const visibleOrders = useMemo(() => orders, [orders]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Header
                title="Pesanan"
                showBack={true}
                showSearch={false}
                showWhatsapp={false}
                showCart={false}
            />

            <main className={`${pageContainer} ${pagePadding} space-y-4 pt-5`}>
                {loading ? (
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">Memuat pesanan...</p>
                    </div>
                ) : visibleOrders.length === 0 ? (
                    <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <h1 className="text-lg font-bold text-black">Belum ada pesanan</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Pesanan yang Anda buat akan muncul di sini.
                        </p>
                        <Link
                            href="/"
                            className="mt-5 inline-flex rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Belanja Sekarang
                        </Link>
                    </div>
                ) : (
                    visibleOrders.map((order) => (
                        <div key={order.orderId} className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-black">Pesanan Anda</h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {new Date(order.createdAt).toLocaleString('id-ID')}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${getPaymentBadgeClass(order)}`}
                                >
                                    {getPaymentStatusText(order)}
                                </span>
                            </div>

                            {order.isCanceled ? (
                                <div className="mt-4 rounded-2xl bg-red-50 p-4">
                                    <p className="text-sm font-semibold text-red-800">Pesanan batal</p>
                                    <p className="mt-1 text-sm text-red-700">
                                        Pesanan Anda dibatalkan oleh penjual atau sistem.
                                    </p>
                                </div>
                            ) : order.isCompleted ? (
                                <div className="mt-2 p-2">
                                    <p className="text-sm font-semibold text-green-600">✅Pesanan selesai</p>
                                </div>
                            ) : order.paymentMethod === 'cod' ? (
                                <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                                    <p className="text-sm font-semibold text-blue-800">
                                        Pesanan akan segera dikirim oleh penjual
                                    </p>
                                    <p className="mt-1 text-sm text-blue-700">
                                        Penjual akan segera memproses dan mengirim pesanan Anda.
                                    </p>
                                </div>
                            ) : order.paymentStatus === 'paid' ? (
                                <div className="mt-4 rounded-2xl bg-green-50 p-4">
                                    <p className="text-sm font-semibold text-green-800">Pesanan diproses</p>
                                    <p className="mt-1 text-sm text-green-700">
                                        Pembayaran Anda sudah berhasil dan pesanan sedang diproses.
                                    </p>
                                </div>
                            ) : null}

                            <div className="mt-2 space-y-3">
                                {order.items?.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="rounded-2xl border border-gray-100 bg-gray-50 p-2"
                                    >
                                        <p className="font-bold text-gray-800">{item.nama}</p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {[
                                                item.warna && item.warna !== 'Default' && item.warna !== '-'
                                                    ? item.warna
                                                    : null,
                                                item.ukuran && item.ukuran !== 'Default' && item.ukuran !== '-'
                                                    ? `Ukuran ${formatSizeLabel(item.ukuran)}`
                                                    : null,
                                                `Jumlah ${item.quantity}`,
                                            ]
                                                .filter(Boolean)
                                                .join(' • ')}
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-red-600">
                                            Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                        Metode Pembayaran
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {order.paymentMethod === 'midtrans'
                                            ? order.midtransPaymentType || 'Bayar Online'
                                            : 'COD / Bayar di Tempat'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                        Total
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-red-600">
                                        Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            {order.paymentMethod === 'midtrans' && order.paymentStatus === 'pending' && (
                                <div className="mt-5">
                                    <button
                                        type="button"
                                        disabled={!order.midtransRedirectUrl}
                                        onClick={() => {
                                            if (!order.midtransRedirectUrl) return;
                                            window.location.href = order.midtransRedirectUrl;
                                        }}
                                        className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Bayar Sekarang
                                    </button>
                                </div>
                            )}

                            {order.paymentMethod === 'midtrans' && order.paymentStatus === 'expired' && (
                                <div className="mt-5">
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full cursor-not-allowed rounded-2xl bg-gray-300 px-5 py-3 text-sm font-semibold text-gray-600"
                                    >
                                        Pembayaran Kedaluwarsa
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>

            <FooterNav />
        </div>
    );
}